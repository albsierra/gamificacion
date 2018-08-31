'use strict';

var gamificaFunctions = require('../../server/lib/gamificaFunctions');
// TODO unificar todos los senderAddress en el global-config.js
var senderAddress = 'noreply@iesdosmares.com'; // Replace this address with your actual address

module.exports = function (Juego) {
  Juego.beforeRemote('create', function (context, juego, next) {
    context.args.data.creador = context.req.accessToken.userId;
    next();
  });

  Juego.beforeRemote('prototype.__get__grupos',
    function (context, juego, next) {
      var Role = Juego.app.models.Role;
      var filter = context.args.filter;
      var rolesArray = [];

      if (context.req.accessToken && context.req.accessToken.userId) {
        let ctx = {
          accessToken: context.req.accessToken,
          model: Juego,
          modelId: context.instance.id,
          modelName: 'Juego',
        };
        rolesArray.push(Role.isInRole('coordinadorJuego', ctx));
        rolesArray.push(Role.isInRole('admin', ctx));
        Promise.all(rolesArray).then(roles => {
          let isInRole = roles.find(function (role) {
            return role === true;
          });
          if (!isInRole) {
            context.args.filter = gamificaFunctions.soloValidados(filter);
          }
          next();
        }).catch(err => next(err));
      } else {
        context.args.filter = gamificaFunctions.soloValidados(filter);
        process.nextTick(() => next());
      }
    }
  );

  Juego.beforeRemote('prototype.__create__grupos',
    function (context, grupo, next) {
      if (context.args.data && context.args.data.validado)
        delete context.args.data.validado;
      next();
    }
  );

  Juego.prototype.juegoAlQuePertenece = function (cb) {
    return process.nextTick(() => cb(null, this));
  };

  /**
   * Puntuaciones de los equipos en un juego determinado
   * @param {Function(Error, array)} callback
   */

  Juego.prototype.ranking = function (callback) {
    var juego = this;
    var puntosEquipos = [];

    juego.puntuaciones(function (err, puntuaciones) {
      if (err) callback(err);

      puntuaciones.forEach(puntuacion => {
        puntuacion = puntuacion.toJSON();
        puntosEquipos[puntuacion.grupo.id] = {
          id: puntuacion.grupo.id,
          nombre: puntuacion.grupo.nombre,
          puntos: puntuacion.puntos +
            (
              puntosEquipos[puntuacion.grupo.id] ?
                puntosEquipos[puntuacion.grupo.id].puntos : 0
            ),
        };
      });

      callback(null, puntosEquipos.sort((a, b) => {
        return b.puntos - a.puntos;
      }));
    });
  };

  Juego.prototype.puntuaciones = function (cb) {
    var juego = this;
    var puntuaciones = [];

    juego.pruebas((err, pruebas) => {
      if (err) cb(err);

      var puntuacionesPromises = [];

      pruebas.forEach(pruebaIntegrada => {
        puntuacionesPromises.push(
          pruebaIntegrada.puntuaciones({include: 'grupo'})
        );
      });
      Promise.all(puntuacionesPromises).then(pruebas => {
        pruebas.forEach(prueba => {
          prueba.forEach(puntuacion => {
            puntuaciones.push(puntuacion);
          });
        });
        cb(null, puntuaciones);
      }).catch(err => {
        cb(err);
      });
    });
  };

  /**
   * Permite enviar emails de invitación a otros usuarios para participar en uno de los juegos de los que el usuario es coordinador.
   * @param {array} emails Un array conteniendo las direcciones de correo electrónico de los usuarios a invitar
   * @param {object} req El objeto con la petición, para obtener el accessToken
   * @param {Function(Error, array)} callback
   */

  Juego.prototype.invite = function (emails, req, callback) {
// TODO permitir la recepción de un String con los emails separados por comas.

    var Invitacion = Juego.app.models.Invitacion;

    Invitacion.invite(emails, req, this, (err, emails) => {
      return callback(err, emails)
    });
  };

  Juego.afterRemote('create', function (context, juego, next) {
    juego.coordinadores.add(context.req.accessToken.userId)
      .then(coordinador => next())
      .catch(error => next(error));
  });

  Juego.afterRemote('prototype.__create__grupos',
    function (context, grupo, next) {
      var juego = context.instance;
      var userId = context.req.accessToken && context.req.accessToken.userId;

      grupo.miembros.add(userId, (err, miembro) => {
        if (err) next(err);
        next();
      });
    }
  );

  Juego.afterRemote('prototype.__create__grupos',
    function (context, grupo, next) {
      var juego = context.instance;
      juego.coordinadores((err, coordinadores) => {
        if (err) next(err);
        // TODO el email real de los usuarios está en UserIdentity
        var emailCoordinadores = coordinadores.map(coordinador => {
          return coordinador.email;
        });

        var subject = 'Un grupo se ha inscrito en el juego ' + juego.nombre;

        let url = Invitacion.app.get('restApiUrl') + '/Grupos/' + grupo.id + '/';
        var urlValidar = url + 'validate';
        var urlRechazar = url + 'reject';
        var html = '<p>Se ha inscrito el grupo <b>' + grupo.nombre + '</b>' +
          '</p></p>Click <a href="' + urlValidar +
          '">aqu&iacute;</a> para <b>aceptar</b> al grupo.</p>' +
          '</p>Click <a href="' + urlRechazar +
          '">aqu&iacute;</a> para <b>rechazar</b> al grupo.</p>';

        // TODO Utilizar una plantilla EJS para componer un mejor cuerpo del email
        Juego.app.models.Email.send({
          to: emailCoordinadores,
          from: senderAddress,
          subject: subject,
          html: html,
        }, err => {
          if (err) next(err);
          next();
        });
      });
    }
  );
};

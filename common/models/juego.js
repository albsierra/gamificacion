'use strict';

var gamificaFunctions = require('../../server/lib/gamificaFunctions');

module.exports = function (Juego) {
  Juego.beforeRemote('create', function (context, juego, next) {
    context.args.data.creador = context.req.accessToken.userId;
    next();
  });

  Juego.beforeRemote('prototype.__get__grupos', function (context, juego, next) {

    var Role = Juego.app.models.Role;
    var filter = context.args.filter;
    var rolesArray = [];

    if (context.req.accessToken && context.req.accessToken.userId) {
      let ctx = {
        accessToken: context.req.accessToken,
        model: Juego,
        modelId: context.instance.id,
        modelName: "Juego"
      };
      rolesArray.push(Role.isInRole("coordinadorJuego", ctx));
      rolesArray.push(Role.isInRole("admin", ctx));
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

  });



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
          puntos: puntuacion.puntos + (puntosEquipos[puntuacion.grupo.id] ? puntosEquipos[puntuacion.grupo.id].puntos : 0)
        };
      });

      callback(null, puntosEquipos.sort((a, b) => {
        return b.puntos - a.puntos
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
          puntuacionesPromises.push(pruebaIntegrada.puntuaciones({include: 'grupo'}));
        });
        Promise.all(puntuacionesPromises).then(pruebas => {
          pruebas.forEach(prueba => {
            prueba.forEach(puntuacion => {
              puntuaciones.push(puntuacion);
            });
          });
          cb(null, puntuaciones);
        }).catch(err => {
          cb(err)
        });
    });
  };

  Juego.afterRemote('create', function (context, juego, next) {
    juego.coordinadores.add(context.req.accessToken.userId)
      .then(coordinador => next())
      .catch(error => next(error));
  });

};

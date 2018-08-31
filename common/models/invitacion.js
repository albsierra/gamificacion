'use strict';

var gamificaFunctions = require('../../server/lib/gamificaFunctions');
var crypto = require('crypto');
// TODO senderAddress en el global-config
var senderAddress = 'noreply@iesdosmares.com'; // Replace this address with your actual address

module.exports = function (Invitacion) {
  Invitacion.invite = function (emails, req, instance, callback) {
    gamificaFunctions.filtraInvitados(
      emails, req, Invitacion.app, (err, emails) => {
        if (err) return callback(err);

        Invitacion.crearYEnviarTokenInvitados(emails, instance, function (err, emails) {
          if (err) return callback(err);
          return callback(null, emails);
        });
      }
    );
  };

  Invitacion.crearYEnviarTokenInvitados = function (invitados, instance, cb) {
    var arrayPromises = [];

    invitados.forEach(invitado => {
      arrayPromises.push(Invitacion.enviarInvitacion(invitado, instance));
    });

    Promise.all(arrayPromises)
      .then(respuestas => {
        var invitados = [];
        respuestas.forEach(respuesta => {
          invitados.push(respuesta.email);
        });
        cb(null, invitados);
      })
      .catch(err => {
        cb(err);
      });
  };

  Invitacion.enviarInvitacion = function (email, instance) {

    return new Promise((resolve, reject) => {
      var token = crypto.randomBytes(64);
      token = token && token.toString('hex');

      instance.invitaciones.create({
        email: email,
        token: token,
      }).then(invitacion => {
        // TODO Evitar la duplicidad de código enviando emails desde Usuario
        // TODO Utilizar una plantilla EJS para componer un mejor cuerpo del email
        // TODO Incluir el nombre y el apellido del que envía la invitación

        var url = Invitacion.app.get('restApiUrl') + '/Invitaciones/' +
          invitacion.id + '/aceptarInvitacion?' + 'token=' + token;
        var html = 'Click <a href="' + url + '">aqu&iacute;</a> ' +
          'para aceptar la invitación ' + instance.nombre;

        Invitacion.app.models.Email.send({
          to: email,
          from: senderAddress,
          subject: 'Te han invitado a participar ' +
            'en la app de gamificación del I.E.S. Dos Mares',
          html: html,
        }, err => {
          if (err) reject(err);
          resolve(invitacion);
        });
      }).catch(err => reject(err));
    });
  };

  /**
   * Un usuario de la app acepta participar en un grupo al que ha sido previamente invitado.
   * @param {string} token El token enviado junto con la invitación
   * @param {object} req El objeto con la petición
   * @param {Function(Error, object)} callback
   */

  Invitacion.prototype.aceptarInvitacion = function (token, req, callback) {
    var invitacion = this;

    if (!invitacion || invitacion.token != token) callback(new Error(
      'El token enviado no corresponde a ninguna invitación')
    );

    invitacion.invitable((err, invitable) => {
      if (err) return callback(err);

      if (invitacion.invitableType === 'Grupo') {
        invitable.miembros.add(req.accessToken.userId)
          .then(miembro => callback(null, miembro))
          .catch(err => callback(err));
      } else if (invitacion.invitableType === 'Juego') {
        invitable.coordinadores.add(req.accessToken.userId)
          .then(miembro => callback(null, miembro))
          .catch(err => callback(err));
      }
    });
  };

  Invitacion.afterRemote('prototype.aceptarInvitacion',
    function (context, miembro, next) {
      var invitacion = context.instance;

      invitacion.destroy()
        .then(() => next())
        .catch(err => next(err));
    }
  );
};

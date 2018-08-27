'use strict';

var config = require('../../server/config.json');
var gamificaFunctions = require('../../server/lib/gamificaFunctions');
var crypto = require('crypto');
//TODO senderAddress en el global-config
var senderAddress = "noreply@iesdosmares.com"; //Replace this address with your actual address

module.exports = function (Grupo) {

  /**
   * Valida un grupo por cumplir con las normas establecidas.
   * @param {Function(Error, object)} callback
   */

  Grupo.prototype.validate = function (callback) {
    var grupo = this;
    grupo.patchAttributes({validado: true}).then(function (result) {
      callback(null, result);
    })
      .catch(function (err) {
        callback(err);
      });
  };

  /**
   * Permite enviar emails de invitación a otros usuarios para participar en uno de los grupos de los que el usuario es miembro.
   * @param {array} emails Un array conteniendo las direcciones de correo electrónico de los usuarios a invitar
   * @param {object} req El objeto con la petición, para obtener el accessToken
   * @param {Function(Error, array)} callback
   */

  Grupo.prototype.invite = function (emails, req, callback) {
//TODO permitir la recepción de un String con los emails separados por comas.
    this.juego((err, juego) => {
      if (err) callback(err);

      if (!juego.grupal) callback(new Error("El juego no permite invitaciones a grupos"));

      gamificaFunctions.filtraInvitados(emails, req, Grupo.app, (err, emails) => {
        if (err) callback(err);

        this.crearYEnviarTokenInvitados(emails, function (err, emails) {
          if (err) callback(err);
          callback(null, emails);
        });
      });

    });

  };

  Grupo.prototype.crearYEnviarTokenInvitados = function (invitados, cb) {
    var grupo = this;
    var arrayPromises = [];

    invitados.forEach(invitado => {

      arrayPromises.push(grupo.enviarInvitacion(invitado));

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
        cb(err)
      });

  };

  Grupo.prototype.enviarInvitacion = function (email) {
    var grupo = this;

    return new Promise((resolve, reject) => {
      var token = crypto.randomBytes(64);
      token = token && token.toString('hex');

      grupo.invitaciones.create({
        email: email,
        token: token
      }).then(invitacion => {
        //TODO Evitar la duplicidad de código enviando emails desde Usuario
        //TODO Utilizar una plantilla EJS para componer un mejor cuerpo del email
        //TODO Incluir el nombre y el apellido del que envía la invitación

        var url = 'http://' + config.host + ':' + config.port + '/' + config.restApiRoot + '/Grupos/' + grupo.id + '/aceptarInvitacion?token=' + token;
        var html = 'Click <a href="' + url + '">aqu&iacute;</a> para aceptar la invitación al grupo ' + grupo.nombre;

        Grupo.app.models.Email.send({
          to: email,
          from: senderAddress,
          subject: 'Te han invitado a participar en la app de gamificación del I.E.S. Dos Mares',
          html: html
        }, err => {
          if (err) reject(err);
          resolve(invitacion);
        })
      }).catch(err => reject(err));
    });
  };

  /**
   * Un usuario de la app acepta participar en un grupo al que ha sido previamente invitado.
   * @param {string} token El token enviado junto con la invitación
   * @param {object} req El objeto con
   * @param {Function(Error, object)} callback
   */

  Grupo.prototype.aceptarInvitacion = function (token, req, callback) {
    var grupo = this;

    grupo.invitaciones.findOne({
      where: {token: token}
    }).then(invitacion => {
      if (!invitacion) callback(new Error("El token enviado no corresponde a ninguna invitación para este grupo"));

      grupo.miembros.add(req.accessToken.userId)
        .then(miembro => callback(null, miembro))
        .catch(err => callback(err))
    }).catch(err => callback(err));
  };

  Grupo.afterRemote('prototype.aceptarInvitacion', function (context, miembro, next) {
    var grupo = context.instance;
    var token = context.req.query.token;

    grupo.invitaciones.findOne({
      where: {token: token}
    }).then(invitacion => {
      if (!invitacion) callback(new Error("El token enviado no corresponde a ninguna invitación para este grupo"));

      invitacion.destroy()
        .then(() => next())
        .catch(err => callback(err))
    }).catch(err => callback(err));
  });

  Grupo.prototype.juegoAlQuePertenece = function (cb) {
    this.juego(function (err, juego) {
      if (err) cb(err);
      if (!juego) cb(new Error("No existe un juego asociado a esta prueba"));

      cb(null, juego);
    });
  };

};

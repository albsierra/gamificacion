'use strict';

var config = require('../../server/config.json');
var path = require('path');
var senderAddress = "noreply@iesdosmares.com"; //Replace this address with your actual address

module.exports = function (Usuario) {
  //send verification email after registration
  Usuario.afterRemote('create', function (context, user, next) {
    var options = {
      type: 'email',
      to: user.email,
      from: senderAddress,
      subject: 'Gracias por registrarse.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      redirect: '/verified',
      user: user
    };

    user.verify(options, function (err, response) {
      if (err) {
        Usuario.deleteById(user.id);
        return next(err);
      }
      context.res.render('response', {
        title: 'Registrado con éxito',
        content: 'Por favor, revise su email y pulse en el enlace de verificación ' +
          'antes de intentar el Login.',
        redirectTo: '/',
        redirectToLinkText: 'Log in'
      });
    });
  });

  //send password reset link when requested
  Usuario.on('resetPasswordRequest', function (info) {
    var url = 'http://' + config.host + ':' + config.port + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
      info.accessToken.id + '">aqu&iacute;</a> para resetear la contrase&ntilde;a';

    Usuario.app.models.Email.send({
      to: info.email,
      from: senderAddress,
      subject: 'Password reset',
      html: html
    }, function (err) {
      if (err) return console.log('> error enviando el email para resetear la contrase&ntilde;a');
      console.log('> enviando el email a:', info.email);
    });
  });

  //render UI page after password reset
  Usuario.afterRemote('setPassword', function (context, user, next) {
    context.res.render('response', {
      title: 'Contraseña actualizada con éxito',
      content: 'Contraseña actualizada con éxito',
      redirectTo: '/',
      redirectToLinkText: 'Log in'
    });
  });

  /**
   * Permite enviar emails de invitación a otros usuarios.
   * @param {array} emails Un array conteniendo las direcciones de correo electrónico de los usuarios a invitar
   * @param {object} req el objeto con la petición
   * @param {Function(Error, array)} callback
   */

  Usuario.invite = function (emails, req, callback) {
//TODO permitir la recepción de un String con los emails separados por comas.
    var emailsValidos = validaEmails(emails);

    var invitados = compruebaDominios(emailsValidos);

    let accessContext = {
      principalType: 'USER',
      principalId: req.accessToken.userId
    };

    var Role = Usuario.app.models.Role;
    Role.getRoles(accessContext).then(rolesMapping => {
      rolesMapping = rolesMapping.filter(roleMapping => Number.isInteger(roleMapping));
      Role.find({where: {id: rolesMapping}}).then(roles => {
        var rolEncontrado = roles.find(function (rol) {
          return rol.name === 'docente' || rol.name === 'admin';
        });
        if (!rolEncontrado) invitados = invitados.slice(0, 10);

        //TODO Evitar la duplicidad de código enviando emails desde Usuario
        //TODO Utilizar una plantilla EJS para componer un mejor cuerpo del email
        //TODO Incluir el nombre y el apellido del que envía la invitación
        var url = 'http://' + config.host + ':' + config.port;
        var html = 'Click <a href="' + url + '">aqu&iacute;</a> para unirte a nuestra aplicación de gamificación';

        Usuario.app.models.Email.send({
          bcc: invitados,
          from: senderAddress,
          subject: 'Te han invitado a participar en la app de gamificación del I.E.S. Dos Mares',
          html: html
        }, function (err) {
          if (err) return callback(new Error('> error enviando el email para resetear la contrase&ntilde;a'));

          return callback(null, invitados);
        });
      }).catch(reject => {
        return callback(reject)
      })
    }).catch(reject => {
      return callback(reject)
    })

  };

};

var validaEmails = function (emails) {
  var isEmail = require('isemail');
  let emailsValidados = [];
  emails.forEach(function (email) {
    if (isEmail.validate(email)) {
      emailsValidados.push(email);
    }
  });
  return emailsValidados;
};

var compruebaDominios = function (emails) {
  //TODO incluir el array tldWhitelist en el fichero global-config.js
  let tldWhitelist = ['murciaeduca.es', 'alu.murciaeduca.es'];
  var emailsValidados = [];
  emails.forEach((email) => {
    if (tldWhitelist.indexOf(email.substring(email.indexOf("@") + 1, email.length)) >= 0) {
      emailsValidados.push(email);
    }
  });
  return emailsValidados
};

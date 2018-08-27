'use strict';

module.exports = {

  filtraInvitados: function (emails, req, app, cb) {
    var emailsValidos = validaEmails(emails);

    var invitados = compruebaDominios(emailsValidos);

    let accessContext = {
      principalType: 'USER',
      principalId: req.accessToken.userId
    };

    var Role = app.models.Role;
    Role.getRoles(accessContext).then(rolesMapping => {
      rolesMapping = rolesMapping.filter(roleMapping => Number.isInteger(roleMapping));
      return Role.find({where: {id: rolesMapping}}).then(roles => {
        var rolEncontrado = roles.find(function (rol) {
          return rol.name === 'docente' || rol.name === 'admin';
        });
        if (!rolEncontrado) invitados = invitados.slice(0, 10);
        return cb(null, invitados);
      }).catch(reject => {
        return cb(reject)
      })
    }).catch(reject => {
      return cb(reject)
    })
  },

  soloValidados: function (filter) {
    if (!filter)
      filter = {};
    if ((!filter.where))
      filter.where = {};

    filter.where = {
      and: [
        {validado: true},
        filter.where
      ]
    };
    return filter;
  }

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

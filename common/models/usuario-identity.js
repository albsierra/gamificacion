'use strict';

module.exports = function (Usuarioidentity) {

  Usuarioidentity.observe('after save', function asignarRole(ctx, next) {
    if (!ctx.instance) next();

    let identidad = ctx.instance;
    let role;
    let models = Usuarioidentity.app.models;
    if (identidad.profile._json.domain == 'murciaeduca.es') {
      role = 'docente';
    } else if (identidad.profile._json.domain == 'alu.murciaeduca.es') {
      role = 'alumno';
    }

    models.Role.findOne({
      where: {name: role}
    }, function (err, rol) {
      if (err) next(err);

      // make Admin an admin
      rol.principals.create({
        principalType: models.RoleMapping.USER,
        principalId: identidad.userId,
      }, function (err, principal) {
        if (err) next(err);
        next();
      });
    });
  });
};

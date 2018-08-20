module.exports = function (app) {
  var Role = app.models.Role;

  Role.registerResolver('miembroGrupo', function (role, context, cb) {
    // Q: Is the current request accessing a Miembro?
    if (!context.modelName == 'Grupo') {
      // A: No. This role is only for 'Grupo': callback with FALSE
      return process.nextTick(() => cb(null, false));
    }

    //Q: Is the user logged in? (there will be an accessToken with an ID if so)
    var userId = context.accessToken.userId;
    if (!userId) {
      //A: No, user is NOT logged in: callback with FALSE
      return process.nextTick(() => cb(null, false));
    }

    // Q: Is the current logged-in user associated with this Juego?
    // Step 1: lookup the requested instance
    context.model.findById(context.modelId, function (err, instance) {
      // A: The datastore produced an error! Pass error to callback
      if (err) return cb(err);
      // A: There's no instance by this ID! Pass error to callback
      if (!instance) return cb(new Error("Instance not found"));

      // Step 2: comprueba si el usuario está validado en el grupo
      // (usamos count() porque solo nos interesa saber la existencia del usuario validado)
      var Miembro = app.models.Miembro;
      Miembro.count({
        grupoId: instance.id,
        usuarioId: userId,
        validado: true
      }, function (err, count) {
        // A: The datastore produced an error! Pass error to callback
        if (err) return cb(err);

        if (count > 0) {
          // A: YES. El usuario está validado en ese grupo
          // callback with TRUE, user is role:`miembroGrupo`
          return cb(null, true);
        }

        else {
          // A: NO, El usuario o no pertenece al grupo o no está validado
          // callback with FALSE, user is NOT role:`miembroGrupo`
          return cb(null, false);
        }
      });
    });
  });
};

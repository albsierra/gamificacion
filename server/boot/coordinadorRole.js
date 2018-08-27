module.exports = function (app) {
  var Role = app.models.Role;

  Role.registerResolver('coordinadorJuego', function (role, context, cb) {
    // Q: Is the current request accessing a: Juego, Prueba or Marcador?
    if (['Juego', 'Prueba', 'Marcador', 'Grupo'].indexOf(context.modelName) < 0) {
      // A: No. This role is only for ['juego', 'prueba', 'marcador']: callback with FALSE
      return process.nextTick(() => cb(null, false));
    }

    //Q: Is the user logged in? (there will be an accessToken with an ID if so)
    var userId = context.accessToken.userId;
    if (!userId || !context.modelId) {
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

      // Step 2: Identifica al Juego al que está asociada la instancia
      instance.juegoAlQuePertenece(function (err, juego) {
        if (err) return cb(err);
        if (!juego) return cb(new Error("No existe un juego asociado con esta instancia"));

        // Step 3: Utiliza la relación coordinadores del modelo Juego
        // para comprobar si el usuario autenticado es coordinador del juego al que pertenece la instancia.
        // utiliza para ello el método findById de las relaciones hasAndBelongsToMany
        juego.coordinadores.findById(userId, function (err, usuario) {
          if (err) return cb(null, false);
          if (usuario) {
            // A: YES. El usuario es coordinador del juego
            // callback with TRUE, user is role:`coordinadorJuego`
            return cb(null, true);
          }

          else {
            // A: NO, El usuario no es coordinador del juego
            // callback with FALSE, user is NOT role:`coordinadorJuego`
            return cb(null, false);
          }
        })
      });

    });
  });
};

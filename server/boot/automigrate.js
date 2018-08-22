module.exports = function (app) {
  if (process.env.AUTOMIGRATE === "true") {
    app.dataSources.db.automigrate(null, function (err) {
      if (err) throw err;
      console.log("Modelos creados");
      app.loadFixtures()
        .then(function () {
          insertaAdmin(app.models, function (err) {
            if (err) throw err;
            // TODO eliminar coordinadores en producción
            insertaCoordinadores(app);
          });
        })
        .catch(function (err) {
          console.log('Errors:', err);
        });
    });
  }
};

function insertaAdmin(models, cb) {
  var conf = require('../../global-config');
  var roleAdmin = {name: 'admin'};
  
  models.Usuario.create(
    {username: 'Admin', email: conf.adminEmail, password: conf.adminPassword}
    , function (err, user) {
      if (err) return cb(err);

      //create the admin role
      models.Role.create(roleAdmin, function (err, rol) {
        if (err) cb(err);

        //make Admin an admin
        rol.principals.create({
          principalType: models.RoleMapping.USER,
          principalId: user.id
        }, function (err, principal) {
          cb(err);
        });
      });
    });

}

function insertaCoordinadores(app) {
  app.models.Juego.find({}, function (err, juegos) {
    let coordinadores = juegos.map((juego) => {
      console.log(juego);
      return new Promise((resolve) => {
        console.log('Llamando a add con id: ' + juego.id);
        juego.coordinadores.add(juego.id, resolve);
      });
    });

    Promise.all(coordinadores).then(() => console.log('Datos cargados correctamente!'));
  })

}

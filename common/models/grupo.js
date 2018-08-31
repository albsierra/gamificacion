'use strict';

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
   * Valida un grupo por cumplir con las normas establecidas.
   * @param {Function(Error, string)} callback
   */

  Grupo.prototype.reject = function (callback) {
    var grupo = this;
    grupo.destroy().then(function () {
      callback(null, 'Grupo eliminado correctamente');
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
// TODO permitir la recepción de un String con los emails separados por comas.

    var Invitacion = Grupo.app.models.Invitacion;

    this.juego((err, juego) => {
      if (err) return callback(err);

      if (!juego.grupal)
        return callback(new Error('El juego no permite invitaciones a grupos'));

      Invitacion.invite(emails, req, this, (err, emails) => {
        return callback(err, emails)
      });
    });
  };

  Grupo.beforeRemote('prototype.reject',
    function (context, msg, next) {
      var grupo = context.instance;
      Grupo.findById(grupo.id)
        .then(grupo => {
          grupo.miembros((err, miembros) => {
            if (err) next(err);

            let borrarPromise = [];
            miembros.forEach(miembro => {
              borrarPromise.push(grupo.miembros.remove(miembro));
            });
            Promise.all(borrarPromise)
              .then(miembrosBorrados => {
                next();
              })
              .catch(err => next(err));
          });
        })
        .catch(err => next(err));

    }
  );

  Grupo.prototype.juegoAlQuePertenece = function (cb) {
    this.juego(function (err, juego) {
      if (err) cb(err);
      if (!juego) cb(new Error('No existe un juego asociado a esta prueba'));

      cb(null, juego);
    });
  };
};

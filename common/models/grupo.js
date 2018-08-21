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

  Grupo.prototype.juegoAlQuePertenece = function (cb) {
    this.juego(function (err, juego) {
      if (err) cb(err);
      if (!juego) cb(new Error("No existe un juego asociado a esta prueba"));

      cb(null, juego);
    });
  }


};

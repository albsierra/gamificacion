'use strict';

module.exports = function (Prueba) {

  Prueba.prototype.juegoAlQuePertenece = function (cb) {
    this.juego(function (err, juego) {
      if (err) cb(err);
      if (!juego) cb(new Error("No existe un juego asociado a esta prueba"));

      cb(null, juego);
    });
  }
};

'use strict';

module.exports = function (Marcador) {

  Marcador.validateAsync('puntos', puntosMenorIgualMaximo, {message: 'Los puntos superan el máximo para esta prueba'});

  function puntosMenorIgualMaximo(err, done) {
    let Prueba = Marcador.app.models.Prueba;
    let self = this;
    Prueba.findById(this.pruebaId, function (error, prueba) {
      if (self.puntos > prueba.maximo) err();
      done();
    })
  }

  Marcador.prototype.juegoAlQuePertenece = function (cb) {
    this.prueba(function (err, prueba) {
      if (err) cb(err);
      if (!prueba) {
        cb(new Err("No existe la prueba asociada a este Marcador"))
      }
      prueba.juego(function (err, juego) {
        if (err) cb(err);
        cb(null, juego);
      })
    })
  }
};

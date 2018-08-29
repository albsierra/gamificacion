'use strict';

module.exports = function (Prueba) {
  Prueba.prototype.juegoAlQuePertenece = function (cb) {
    this.juego(function (err, juego) {
      if (err) cb(err);
      if (!juego) cb(new Error('No existe un juego asociado a esta prueba'));

      cb(null, juego);
    });
  };

  /**
   * Puntuaciones de los equipos en una prueba determinada
   * @param {Function(Error, array)} callback
   */

  Prueba.prototype.ranking = function (callback) {
    var prueba = this;

    prueba.puntuaciones({
      order: 'puntos DESC',
      include: 'grupo',
    }, function (err, grupos) {
      if (err) callback(err);
      let puntosEquipos = [];
      grupos.forEach(grupoParticipante => {
        grupoParticipante = grupoParticipante.toJSON();

        let puntosEquipo = {
          id: grupoParticipante.grupo.id,
          nombre: grupoParticipante.grupo.nombre,
          puntos: grupoParticipante.puntos,
        };
        puntosEquipos.push(puntosEquipo);
      });
      callback(null, puntosEquipos);
    });
  };
};

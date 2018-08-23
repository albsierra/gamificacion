'use strict';

module.exports = function (Juego) {
  Juego.beforeRemote('create', function (context, juego, next) {
    context.args.data.creador = context.req.accessToken.userId;
    next();
  });

  Juego.prototype.juegoAlQuePertenece = function (cb) {
    return process.nextTick(() => cb(null, this));
  };

  /**
   * Puntuaciones de los equipos en un juego determinado
   * @param {Function(Error, array)} callback
   */

  Juego.prototype.ranking = function (callback) {
    var juego = this;
    var puntosEquipos = [];

    juego.puntuaciones(function (err, puntuaciones) {
      if (err) callback(err);

      puntuaciones.forEach(puntuacion => {
        puntuacion = puntuacion.toJSON();
        puntosEquipos[puntuacion.grupo.id] = {
          id: puntuacion.grupo.id,
          nombre: puntuacion.grupo.nombre,
          puntos: puntuacion.puntos + (puntosEquipos[puntuacion.grupo.id] ? puntosEquipos[puntuacion.grupo.id].puntos : 0)
        };
      });

      callback(null, puntosEquipos.sort((a, b) => {
        return b.puntos - a.puntos
      }));
    });

  };

  Juego.prototype.puntuaciones = function (cb) {
    var juego = this;
    var puntuaciones = [];

    juego.pruebas((err, pruebas) => {
      if (err) cb(err);

        var puntuacionesPromises = [];

        pruebas.forEach(pruebaIntegrada => {
          puntuacionesPromises.push(pruebaIntegrada.puntuaciones({include: 'grupo'}));
        });
        Promise.all(puntuacionesPromises).then(pruebas => {
          pruebas.forEach(prueba => {
            prueba.forEach(puntuacion => {
              puntuaciones.push(puntuacion);
            });
          });
          cb(null, puntuaciones);
        }).catch(err => {
          cb(err)
        });
    });
  }

};

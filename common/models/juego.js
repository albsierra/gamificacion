'use strict';

module.exports = function (Juego) {
  Juego.beforeRemote('create', function (context, juego, next) {
    context.args.data.creador = context.req.accessToken.userId;
    next();
  });

  Juego.prototype.juegoAlQuePertenece = function (cb) {
    return process.nextTick(() => cb(null, this));
  }
};

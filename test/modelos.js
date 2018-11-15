let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;
const usuario = {
  admin: {email: 'profe@ies2mares.ies', password: 'alumno'},
  docente: {email: 'profe@ies2mares.ies', password: 'alumno'},
  alumno: {email: 'profe@ies2mares.ies', password: 'alumno'},
};

chai.use(chaiHttp);
const url = 'http://localhost:3000';

var autenticate = function(tipoUsuario) {
  return new Promise((resolve, reject) => {
    chai.request(url)
      .post('/api/Usuarios/login')
      .send(usuario[tipoUsuario])
      .end(function (err, res) {
        expect(res.body).to.have.any.keys(['id']);
        let accessToken = res.body.id;
        resolve(accessToken);
      });
  });
};

describe('Listado de juegos: ', () => {

  it('Deben ser juegos', (done) => {
    autenticate('docente')
      .then(accessToken => {
        chai.request(url)
          .get('/api/Juegos')
          .query({
            access_token: accessToken,
            filter: '{"include":["coordinadores","ownerId","pruebas", "grupos", "imagen", "invitaciones"]}'
          })
          .send()
          .end(function (err, res) {
            expect(res).to.have.status(200);
            let resBody = res.body;
            expect(resBody).to.be.an('Array');
            expect(resBody.length).greaterThan(0);
            let unGrupo = resBody[0];
            let allKeys = [
              "coordinadores",
              "creador",
              "descripcion",
              "grupal",
              "grupos",
              "id",
              "invitaciones",
              "nombre",
              "ownerId",
              "pruebas"
            ]
            expect(unGrupo).to.have.all.keys(allKeys);
            done();
          });
      });
  });
});

describe('Listado de grupos: ', () => {

  it('Deben ser grupos', (done) => {
    autenticate('docente')
      .then(accessToken => {
        chai.request(url)
          .get('/api/Grupos')
          .query({access_token: accessToken})
          .send()
          .end(function (err, res) {
            expect(res).to.have.status(200);
            let resBody = res.body;
            expect(resBody).to.be.an('Array');
            expect(resBody.length).greaterThan(0);
            let unGrupo = resBody[0];
            expect(unGrupo).to.have.all.keys('id', 'nombre', 'validado', 'juegoId');
            done();
          });
      });
  });
});

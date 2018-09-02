let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;

chai.use(chaiHttp);
const url = 'http://localhost:3000';

describe('Listado de grupos: ', () => {

  it('Deben ser grupos', (done) => {
    var agent = chai.request.agent(url);
    agent
      .post('/api/Usuarios/login')
      .send({email: 'profe@ies2mares.ies', password: 'alumno'})
      .end(function (err, res) {
        expect(res.body).to.have.any.keys(['id']);
        let accessToken = res.body.id;
        // The `agent` now has the sessionid cookie saved, and will send it
        // back to the server in the next request:
        agent.get('/api/Grupos')
          .query({access_token: accessToken})
          .send()
          .end(function (err, res) {
            expect(res).to.have.status(200);
            console.log(res.body);
            done();
          });
      });
  });
});

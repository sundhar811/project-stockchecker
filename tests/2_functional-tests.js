/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'wmt'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'WMT');
          assert.property(res.body.stockData, 'price');
          assert.equal(res.body.stockData.likes, 0);
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'amd', like: true })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'AMD');
          assert.property(res.body.stockData, 'price');
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'amd', like: true })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.equal(res.body.stockData.stock, 'AMD');
          assert.property(res.body.stockData, 'price');
          assert.equal(res.body.stockData.likes, 1);
          done();
        });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['amd', 'INTC'] })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stocData.length);
          assert.equal(res.body.stockData[0].stock, 'AMD');
          assert.property(res.body.stockData[0], 'price');
          assert.equal(res.body.stockData[0].rel_likes, 1);
          assert.equal(res.body.stockData[1].stock, 'INTC');
          assert.property(res.body.stockData[1], 'price');
          assert.equal(res.body.stockData[1].rel_likes, -1);
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'aapl'], like: true })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stocData.length);
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.property(res.body.stockData[0], 'price');
          assert.equal(res.body.stockData[0].rel_likes, 0);
          assert.equal(res.body.stockData[1].stock, 'AAPL');
          assert.property(res.body.stockData[1], 'price');
          assert.equal(res.body.stockData[1].rel_likes, 0);
          done();          
        });
      });
      
    });

});

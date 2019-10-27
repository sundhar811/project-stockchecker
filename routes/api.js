/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb');
const fetch = require('node-fetch');

let dbConnection;

function getDBConnection() {
  if (!dbConnection) {
    dbConnection = MongoClient.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
  }
  return dbConnection;
}

module.exports = function (app) {

  app.route('/api/stock-prices')
  .get(function (req, res){
    let ip = req.headers['x-forwarded-for'].split(',')[0];
    let { query: { stock, like } } = req;
    if (typeof stock === 'string') {
      stock = [stock];
    }
    let data = [];
    getDBConnection().then(client => {
      let db = client.db('test');
      Promise.all(stock.map(stockCode => {
        return fetch(`https://repeated-alpaca.glitch.me/v1/stock/${stockCode}/quote`)
        .then(res => res.json())
        .then(apiData =>  {
          let price = apiData[apiData.calculationPrice];
          if (price) return { stock: stockCode.toUpperCase(), price: String(price) }
          return 'Unknown symbol'
        })
      }))
      .then(data => {
        if (data.includes('Unknown symbol')) return res.send('Unknown symbol');
        Promise.all(data.map(stockData => {
          let { price, stock } = stockData;
          return db.collection('stocks').findOneAndUpdate(
            { stock },
            // empty string is added otherwise 'likes' property will not be returned in the response
            like ? { $set: { price }, $addToSet: { likes: { $each: [ip, ''] } } } : { $set: { price }, $addToSet: { likes: '' } },
            { returnOriginal: false, upsert: true }
          );
        }))
        .then(result => {
          if (result.length === 1) {
            let stockData = result[0].value;
            stockData.likes = stockData.likes ? stockData.likes.length - 1 : 0;
            delete stockData._id;
            return res.send({ stockData })
          }
          else {
            let stockData = result.map(e => {
              let data = e.value;
              data.rel_likes = data.likes ? data.likes.length - 1 : 0;
              delete data._id;
              delete data.likes;
              return data;
            })
            
            // finding the relative difference between two variables
            // 1. a = a-b
            // 2. b = b-a
            // from eqn 1. eqn 2. becomes b = b-(a-b) = 2b-a, does not give expected result
            // need to subract a 'b' from eqn 2.
            // b = 2b-a-b = b-a = -(a) [from 1.]
            // final equations
            // a = a-b, b = -a
            
            stockData[0].rel_likes = stockData[0].rel_likes - stockData[1].rel_likes;
            // Boolean check is included so that the result doesnot return '-0'
            stockData[1].rel_likes = stockData[0].rel_likes ? -stockData[0].rel_likes : stockData[0].rel_likes;

            return res.send({ stockData });   
          }       
        });
      })
    })
  });
    
};

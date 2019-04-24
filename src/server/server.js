import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let oracles = 20;
let oracle_accounts = [];
let STATUS_CODES = [0, 10, 20, 30, 40, 50];

web3.eth.getAccounts((error, accounts) => {
  for(let i = 5; i < oracles; i++) {
    flightSuretyApp.methods.registerOracle()
    .send({from: accounts[i], value: web3.utils.toWei("1",'ether'), gas: 6721975}, (error, result) => {
      if(error) {
        console.log(error);
      } 
      else {
        flightSuretyApp.methods.getMyIndexes().call({from: accounts[i]}, (error, result) => {
            if (error) {
              console.log(error);
            }
            else {
              let oracle = {
                address: accounts[i],
                index: result
              };
              oracle_accounts.push(oracle);
              console.log("Oracle registered: " + JSON.stringify(oracle));
            }
        });
      }
    });
  };
});

flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {
      console.log(error);
    }
    else {
      let index = event.returnValues.index;
      let airline = event.returnValues.airline;
      let flight = event.returnValues.flight;
      let timestamp = event.returnValues.timestamp;
      let statusCode = STATUS_CODES[Math.floor(Math.random() * STATUS_CODES.length)]
      
      for(let i = 0; i < oracle_accounts.length; i++) {
        if(oracle_accounts[i].index.includes(index)) {
          flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
          .send({from: oracle_accounts[i].address}, (error, result) => {
              if(error) {
                console.log(error);
              } 
              else {
                console.log("From " + JSON.stringify(oracle_accounts[i]) + "STATUS_CODE: " + statusCode);
              }
          });
        }
      }
    }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;
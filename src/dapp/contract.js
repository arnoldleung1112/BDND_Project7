import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            
            this.owner = accts[0];
            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            this.flightSuretyApp.methods.registerFlight(this.web3.utils.fromAscii('MU123'), Math.floor(Date.now() / 1000))
                .send({from: this.owner, gas:650000}, (error, result) => {
                    console.log('MU123 registered');
                });
            
                
            this.flightSuretyApp.methods.registerFlight(this.web3.utils.fromAscii('MU456'), Math.floor(Date.now() / 1000))
                .send({from: this.owner, gas:650000}, (error, result) => {
                    console.log('MU456 registered');
                });

            this.flightSuretyApp.methods.registerFlight(this.web3.utils.fromAscii('MU789'), Math.floor(Date.now() / 1000))
                .send({from: this.owner, gas:650000}, (error, result) => {
                    //callback(error);
                    console.log('MU789 registered');
                });
            
            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, self.web3.utils.fromAscii(payload.flight), payload.timestamp)
            .send({from: self.owner, gas:650000}, (error, result) => {
                callback(error, payload);
            });
    }

    buy(flight, amount, callback) {
        let self = this;
        self.flightSuretyApp.methods.buy(self.web3.utils.fromAscii(flight))
            .send({from: self.owner, value: self.web3.utils.toWei(amount, 'ether'), gas:650000}, (error, result) => {
                console.log(error);
                callback(error, result);
            });
    }
}
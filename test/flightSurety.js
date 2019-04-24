var Test = require('../config/testConfig.js');
const fund_fee = web3.utils.toWei("10",'ether');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  let newAirline2 = accounts[3];
  let newAirline3 = accounts[4];
  let newAirline4 = accounts[5];
  let newAirline5 = accounts[6];
  let newAirline6 = accounts[7];

  before('setup contract', async() => {
    config = await Test.Config(accounts);
    //await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) First airline is registered when contract is deployed.', async () => {
      
    let result = await config.flightSuretyData.isRegisteredAirline.call(config.firstAirline);
    
    assert.equal(result, true, "First airline is not registered");
  
  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    let accessDenied = false;
    
    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {
        accessDenied = true;
    }

    // ASSERT
    assert.equal(accessDenied, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) Only existing airline may register a new airline until there are at least four airlines registered', async () => {
    
    // ARRANGE
    await config.flightSuretyApp.fund({from: config.firstAirline, value: fund_fee});
    await config.flightSuretyApp.registerAirline(newAirline2, {from: config.firstAirline});
    await config.flightSuretyApp.fund({from: newAirline2, value: fund_fee});
    await config.flightSuretyApp.registerAirline(newAirline3, {from: config.firstAirline});
    await config.flightSuretyApp.fund({from: newAirline3, value: fund_fee});
    await config.flightSuretyApp.registerAirline(newAirline4, {from: config.firstAirline});
    await config.flightSuretyApp.fund({from: newAirline4, value: fund_fee});

    let result = await config.flightSuretyApp.registerAirline.call(newAirline5, {from: config.firstAirline});
    // ASSERT
    assert.equal(result, false, "there are not enough Votes");

  });

  it('(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines part1', async () => {
    
    // ARRANGE
    let result2 = await config.flightSuretyApp.registerAirline.call(newAirline6, {from: newAirline2});
    await config.flightSuretyApp.registerAirline(newAirline6, {from: newAirline2});
    let result3 = await config.flightSuretyApp.registerAirline.call(newAirline6, {from: newAirline3});

    // ASSERT
    assert.equal(result2, false, "Votes are 1");
    assert.equal(result3, true, "Votes are more than 1");

  });

  it('(Passengers) Passengers may pay up to 1 ether for purchasing flight insurance.', async () => {

    let passenger1 = accounts[8];
    let passenger2 = accounts[9];

    let flight = web3.utils.fromAscii('MU567');

    let value1 = web3.utils.toWei('2', "ether");
    let value2 = web3.utils.toWei('1', "ether");

    let result1 = false;
    let result2 = false;

    await config.flightSuretyApp.registerFlight(flight, 1200, {from: config.firstAirline});
    
    try {
      await config.flightSuretyApp.buy(flight, {from: passenger1, value: value1});
    }
    catch(e) {
      result1 = true;
    }

    try {
        await config.flightSuretyApp.buy(flight, {from: passenger2, value: value2});
      }
      catch(e) {
        result2 = true;
      }

    // ASSERT
    assert.equal(result1, true, "the payment should less than 1 ether");
    assert.equal(result2, false, "buy insurence failed");
  });

  it('(Passengers) Passenger can withdraw any funds owed to them as a result of receiving credit for insurance payout.', async () => {    
    
    let passenger2 = accounts[9];
    let flight = web3.utils.fromAscii('MU567');
    let value2 = web3.utils.toWei('1', "ether");

    result = false;

    try {
        await config.flightSuretyApp.withdraw(flight, value2, {from: passenger2, value: value2});
    }
    catch(e) {
        result = true;
    }

    assert.equal(result, false, "withdraw failed.");
  });

  it('(Passengers) passenger receives credit of 1.5X the amount they paid if the flight is delay', async () => {

    let passenger3 = accounts[10];
    let flight = web3.utils.fromAscii('MU567');
    let value = web3.utils.toWei('1', "ether");

    let result= false;
    
    await config.flightSuretyApp.buy(flight, {from: passenger3, value: value});

    try {
      await config.flightSuretyApp.pay(flight, value, {from: passenger3});
    }
    catch(e) {
      result = true;
    }

    // ASSERT
    assert.equal(result, false, "Can´t pay insurance.");
  });

  it('(Passengers) Insurance payouts are not sent directly to passenger’s wallet', async () => {

    let passenger4 = accounts[11];
    let passenger5 = accounts[12];
    let passenger6 = accounts[13];
    let passenger7 = accounts[14];

    let flight = web3.utils.fromAscii('MU567');
    let value = web3.utils.toWei('1', "ether");
    let payoutvalue = web3.utils.toWei('6', "ether");

    await config.flightSuretyApp.buy(flight, {from: passenger4, value: value});
    await config.flightSuretyApp.buy(flight, {from: passenger5, value: value});
    await config.flightSuretyApp.buy(flight, {from: passenger6, value: value});
    await config.flightSuretyApp.buy(flight, {from: passenger7, value: value});
    await config.flightSuretyData.processFlightStatus(flight, 1500, 20);
    
    let result = await config.flightSuretyData.creditInsurees.call(flight);

    assert.equal(result.toString(), payoutvalue, "did not hold the payout");
  });
});

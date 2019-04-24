var HDWalletProvider = require("truffle-hdwallet-provider");
//var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
var mnemonic = "scene limb vibrant air tennis state dice matter bulk merit behind reward";
module.exports = {
  networks: {
    development: {
      //provider: function() {
      //  return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      //},
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
      gas: 6721975
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};
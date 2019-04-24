pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;           // Account used to deploy contract
    bool private operational = true;         // Blocks all state changes throughout the contract if false
                                
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        uint256 credits;
        mapping (address => uint256) buyers;
    }
    mapping(bytes32 => Flight) private flights;

    struct Airline {
        bool funded;
        bool registered;
    }

    mapping(address => Airline) private airlines;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor (address airline) public {
        contractOwner = msg.sender;
        airlines[airline] = Airline(false, true);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() public view returns(bool) {
        return operational;
    }

    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus (bool mode) external requireContractOwner() {
        operational = mode;
    }

    function isRegisteredAirline(address airline) public view returns(bool) {
        return airlines[airline].registered;
    }

    function isFundedAirline(address airline) public view returns(bool) {
        return airlines[airline].funded;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */

    function registerAirline(address airline) external requireIsOperational {
        airlines[airline] = Airline(false, true);
    }

    function registerFlight(bytes32 flightnumber, uint256 timestamp, address sender) external requireIsOperational {
        require(airlines[sender].registered || contractOwner == sender, "Caller must be a registered funded airline");
        flights[flightnumber] = Flight(true, 0, timestamp, sender, 0 ether);
    }

    function processFlightStatus(bytes32 flightnumber, uint256 timestamp, uint8 statusCode) external requireIsOperational {
        flights[flightnumber].statusCode = statusCode;
        flights[flightnumber].updatedTimestamp = timestamp;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy(bytes32 flightnumber, address sender, uint256 value) external requireIsOperational {
        require(flights[flightnumber].isRegistered, "the flight doesn't exsist");
        require(flights[flightnumber].statusCode == 0, "the flight has taken off");
        flights[flightnumber].buyers[sender] = value;
        flights[flightnumber].credits = flights[flightnumber].credits.add((value.mul(15)).div(10));
    }

    function withdraw(bytes32 flightnumber, address sender, uint256 value) external requireIsOperational {
        require(flights[flightnumber].isRegistered, "the flight doesn't exsist");
        require(flights[flightnumber].statusCode == 0, "the flight has taken off");
        require(flights[flightnumber].buyers[sender] == value, 'wrong value sended');
        flights[flightnumber].credits = flights[flightnumber].credits.sub((value.mul(15)).div(10));
        delete flights[flightnumber].buyers[sender];
    }
    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flightnumber) external requireIsOperational() returns(uint256) {
        require(flights[flightnumber].statusCode == 20, 'wrong statusCode');
        uint256 credits = flights[flightnumber].credits;
        return credits;
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(bytes32 flightnumber, uint256 value, address sender) external requireIsOperational() returns(uint256) {
        require(flights[flightnumber].buyers[sender] == value, 'wrong insurence value');
        uint256 amount = (flights[flightnumber].buyers[sender].mul(15)).div(10);
        flights[flightnumber].credits = flights[flightnumber].credits.sub((value.mul(15)).div(10));
        delete flights[flightnumber].buyers[sender];
        return amount;
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund(address sender) public requireIsOperational() {
        require(airlines[sender].registered, "only for registered airline");
        airlines[sender].funded = true;
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function reFund(address sender) public requireIsOperational() returns(bool) {
        return airlines[sender].funded;
    }
}


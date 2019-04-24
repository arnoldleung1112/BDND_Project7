
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            let flights_list = [{number: "MU123 departure time 09:15"},
                                {number: "MU456 departure time 10:15"}, 
                                {number: "MU789 departure time 11:15"}];
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
            displayFlightList(flights_list);
        });

    
        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

        DOM.elid('buy-flight-insurance', 'flight-insurance-amount').addEventListener('click', () => {
            let flight = DOM.elid('flight-insurance').value;
            let amount = DOM.elid('flight-insurance-amount').value
            // Write transaction
            contract.buy(flight, amount, (error, result) => {
                display('Insurance', 'Buy insurance', [ { label: '', error: error, value: 'Buy ' + flight + ' insurance succeed. Paid: ' + amount + ' ether'} ]);
            });
        });
    
    });
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlightList(flights) {
    let displayDiv = DOM.elid("display-wrapper");
    let FlightList = DOM.section();
    FlightList.appendChild(DOM.h2("Flight List"));
    FlightList.appendChild(DOM.h5("The flight you can choose"));
    flights.map((flight) => {
        let row = FlightList.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, flight.number));
        FlightList.appendChild(row);
    })
    displayDiv.append(FlightList);
}


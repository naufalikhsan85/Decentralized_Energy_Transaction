const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda'));
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://test.mosquitto.org')
const readline = require('readline-sync')

let filename= readline.question("What is your keystore filename? ");
let decpassword=readline.question("What is your keystore password? ");

let objKeyStore;
let path = "./" + filename
objKeyStore = require(path);
//console.log(objKeyStore)

let decryptData = web3.eth.accounts.decrypt(objKeyStore, decpassword);
console.log(decryptData.privateKey)

let input_privateKey = decryptData.privateKey.substring(2)
let hexKey = "0x" + input_privateKey;
let acc = web3.eth.accounts.privateKeyToAccount(hexKey);
let current_account = acc.address;
web3.eth.defaultAccount = current_account;


let topic1='HW_IN_'+ current_account
let topic2='meterInData'+ current_account
//Energy Network state
var state = 'closed'
//kWh Meter
let energy=0
let limit=0

//Mengalirkan Listrik
function inputEnergy() {
    //jika jaringan nyala
    if(state === "open" && energy < limit){
        energy=energy+2;
        sendMeterData()
    }
    console.log('current Energy :',energy);
}

function runEnergy(){
    inputEnergy()
    setInterval(inputEnergy,1000)
}

runEnergy()

//Listen Energy Network
client.on('connect', () => {
    //Subscriber
    client.subscribe(topic1 +'/open')
    client.subscribe(topic1 +'/close')

    client.publish(topic1 +'/connected', 'true')
    client.subscribe(topic2 +'/initMeter')
    client.subscribe(topic2+'/limit')

    sendStateUpdate()
})

client.on('message', (topic, message) => {
    console.log('received message %s %s', topic, message)
    //setTimeout(inputEnergy,1000)
    switch (topic) {
        case topic1 +'/open':
            return handleOpenRequest(message)
        case topic1 +'/close':
            return handleCloseRequest(message)
        case topic2 +'/initMeter':
            return handelInitMeter(message)
        case topic2 +'/limit':
            return handleLimitMeter(message)
    }
})

function sendStateUpdate () {
    console.log('sending state %s', state)
    client.publish(topic1 +'/state', state)
}

function sendMeterData() {
    console.log('sending meter data :',energy.toString())
    client.publish(topic2 +'/energyImport',energy.toString())
}

function handleOpenRequest (message) {
    if (state !== 'open' && state !== 'opening') {
        console.log('opening circuit')
        //state = 'opening'
        //sendStateUpdate()
        state = 'open'
        sendStateUpdate()

    }
}

function handleCloseRequest (message) {
    if (state !== 'closed' && state !== 'closing') {
        console.log('closing circuit')
        //state = 'closing'
        //sendStateUpdate()

        state = 'closed'
        sendStateUpdate()

    }
}

function handelInitMeter(message) {
    energy = Number(message)
}

function handleLimitMeter(message) {
    limit= Number(message)
}
function handleAppExit (options, err) {
    if (err) {
        console.log(err.stack)
    }

    if (options.cleanup) {
        client.publish(topic1 +'/connected', 'false')
    }

    if (options.exit) {
        process.exit()
    }
}

process.on('exit', handleAppExit.bind(null, {
    cleanup: true
}))
process.on('SIGINT', handleAppExit.bind(null, {
    exit: true
}))
process.on('uncaughtException', handleAppExit.bind(null, {
    exit: true
}))









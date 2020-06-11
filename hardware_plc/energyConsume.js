const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://test.mosquitto.org')
const readline = require('readline-sync')
/*
var CryptoJS = require("crypto-js");
var secretKey= '12345'
// Encrypt
async function enryptMsg(msg) {
    var chipertext= await CryptoJS.AES.encrypt(msg, secretKey).toString();
    console.log(chipertext)
    return chipertext
}
// Decrypt
async function decryptMsg(msg) {
    var bytes  = await CryptoJS.AES.decrypt(msg, secretKey);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    console.log(originalText)
    return originalText
}
 */

let filename= readline.question("What is your keystore filename? ");

let topic1='HW_IN_'+((filename.substring(9)).slice(0,-20))
let topic2='meterInData'+((filename.substring(9)).slice(0,-20))
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









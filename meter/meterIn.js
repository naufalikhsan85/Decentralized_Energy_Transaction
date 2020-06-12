const Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda'));
const fetch = require("node-fetch");
const readline = require('readline-sync')
const mqtt = require('mqtt')

const serverUrl   = "mqtt://test.mosquitto.org";

const client = mqtt.connect(serverUrl);

let filename=readline.question("What is your keystore filename? ");
let decpassword=readline.question("What is your keystore password? ");


/*
var CryptoJS = require("crypto-js");
var secretKey= '12345'
// Encrypt
 function enryptMsg(msg) {
    var chipertext=  CryptoJS.AES.encrypt(msg, secretKey).toString();
    console.log(chipertext)
    return chipertext
}
// Decrypt
 function decryptMsg(msg) {
    var bytes  =  CryptoJS.AES.decrypt(msg, secretKey);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    console.log(originalText)
    return originalText
}
 */


//Blockchain Part
let url= 'https://energydapp.000webhostapp.com/abi.json'
//'http://192.168.100.6:8080/abi.json'
//'https://energydapp.000webhostapp.com/abi.json'
//'https://raw.githubusercontent.com/naufalikhsan85/Decentralized_Energy_Transaction/master/contract/abi.json'


let dataABI

async function fetchData(){
    let response = await fetch(url);
    //console.log(response)
    let data = await response.json();
    data = JSON.stringify(data);
    data = JSON.parse(data);
    return data;
}
async function getAddress() {
    dataABI = await fetchData();
    return dataABI.address;

}
async function getABI() {
    dataABI = await fetchData();
    return  dataABI.abi;
}

/*
 function fetchDataTest(){
    let response =  fetch(url);
    let data =  response.json();
    data = JSON.stringify(data);
    return JSON.parse(data);

}

var abc = fetchDataTest()
console.log(abc)


 */

let contract_Address;
let abi;
let contract
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
let current_privateKey = Buffer.from(input_privateKey, 'hex');

let meterData
let statusIn;
let myMeterThIn
let meterRecordInOut

function convert(inputTs) {


    var unixtimestamp = inputTs;


    var months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


    var date = new Date(unixtimestamp * 1000);


    var year = date.getFullYear();


    var month = months_arr[date.getMonth()];


    var day = date.getDate();


    var hours = date.getHours();

    // Minutes
    var minutes = "0" + date.getMinutes();

    // Seconds
    var seconds = "0" + date.getSeconds();

    // Display date time in MM-dd-yyyy h:m:s format
    return month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);


}
async function sendSign(myData, myGas) {
    contract_Address = await getAddress()

    web3.eth.getTransactionCount(current_account, (err, txCount) => {


        var txObject = {

            nonce: web3.utils.toHex(txCount),

            to: contract_Address,

            value: web3.utils.toHex(web3.utils.toWei('0', 'ether')),

            gasLimit: web3.utils.toHex(myGas),

            gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),

            data: myData

        }

        // Sign the transaction

        var tx = new Tx(txObject, {'chain': 'ropsten'});

        tx.sign(current_privateKey);


        var serializedTx = tx.serialize();

        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            .on('receipt', console.log);

    })
}

async function _meterRecordIn() {
    abi = await getABI()
    contract_Address = await getAddress()
    contract = new web3.eth.Contract(abi, contract_Address);
    let myDataIn = contract.methods.meterRecordIn(meterData).encodeABI();
    sendSign(myDataIn, 100000);
}

async function getHistoryMeterData() {
    abi = await getABI()
    contract_Address = await getAddress()
    contract = new web3.eth.Contract(abi, contract_Address);
    let meterHistory = await contract.methods.getMeterRecordInOut(current_account).call()
    meterData= meterHistory[0]
    return meterData
}

async function getMeterData(){
    abi = await getABI()
    contract_Address = await getAddress()
    contract = new web3.eth.Contract(abi, contract_Address);

    myMeterThIn = await contract.methods.meterInTh(current_account).call()
    meterRecordInOut = await contract.methods.getMeterRecordInOut(current_account).call()
}

//Function get deal data for trigger hardware
async function networkImport() {


    let ts = Math.round((new Date()).getTime() / 1000);
    console.log('current:',convert(ts));
    let start = myMeterThIn[0];
    console.log('start:',convert(start));
    let expire = myMeterThIn[2];
    console.log('expire:',convert(expire));
    let limitIn = Number(myMeterThIn[4]);
    client.publish(topic2+'/limit', limitIn.toString())
    console.log('limitIn:',limitIn);
    let currentMeterIn = Number(meterRecordInOut[0]);
    console.log('currentMeterIn:',currentMeterIn);
    initMeter()
    sendMeterImport()
    if (ts > start && ts < expire && meterData < limitIn && currentMeterIn < limitIn) {
        statusIn = "Onn";
        openCircuit()
        console.log('A')
    } else if (ts > start && ts < expire && meterData === limitIn && currentMeterIn < limitIn) {
        inputMeter()
        closeCircuit()
        statusIn = "Off";
        console.log('B')
    } else if (ts > start && ts === expire && meterData < limitIn && currentMeterIn < limitIn) {
        inputMeter()
        closeCircuit()
        statusIn = "Off";
        console.log('C')
    } else if (ts > start && ts === expire && meterData === limitIn && currentMeterIn < limitIn) {
        inputMeter()
        statusIn = "Off";
        closeCircuit()
        console.log('D')

    } else {
        statusIn = "Off";
        closeCircuit()
        console.log('E')
    }

    console.log('stat:', statusIn)
    console.log('meter data:', Number(meterData))
    console.log('#############################')
}

async function inputMeter() {
    if (statusIn === "Onn") {
        await _meterRecordIn()
    }
}

//Hardware Communication
let circuitState = ''
let connected = false

let cutname1=filename.substring(9)
let cutname2=cutname1.substring(0, 42)
let topic1 = 'HW_IN_' + cutname2
let topic2 = 'meterInData' + cutname2
let topic3=  'meterImportGUI' + cutname2


client.on('connect', () => {
    //publisher
    client.subscribe(topic1 + '/connected')
    client.subscribe(topic1 + '/state')

    //subscriber
    client.subscribe(topic2 + '/energyImport')

})

client.on('message', (topic, message) => {
    console.log('received message %s %s', topic, message)
    switch (topic) {
        case topic1 + '/connected':
            return handleCircuitConnected(message)
        case topic1 + '/state':
            return handleCircuitState(message)
        case topic2 + '/energyImport':
            return handleMeterData(message)

    }
    console.log('No handler for topic %s', topic)
})

function sendMeterImport() {
    console.log('sending meter import to GUI :',meterData.toString())
    client.publish(topic3 +'/toGUI',meterData.toString())
    console.log(topic3 +'/toGUI')
}

function handleCircuitConnected(message) {
    console.log('circuit connected status %s', message)
    connected = (message.toString() === 'true')
}

function handleCircuitState(message) {
    circuitState = message
    console.log('circuit state update to %s', message)
}

function handleMeterData(message) {
    meterData = Number(message)

}

let initCount = 0

function initMeter() {
    if (connected && initCount === 0) {
        // Ask the door to open
        client.publish(topic2 + '/initMeter', meterData.toString())
        console.log("sending open", 'true')
        initCount = 1
    }

}

function openCircuit() {
    // can only open door if we're connected to mqtt and door isn't already open
    if (connected && circuitState !== 'open') {
        // Ask the door to open
        client.publish(topic1 + '/open', 'true')
        console.log("sending open", 'true')
    }
}

function closeCircuit() {
    // can only close door if we're connected to mqtt and door isn't already closed
    if (connected && circuitState !== 'closed') {
        // Ask the door to close
        client.publish(topic1 + '/close', 'true')
        console.log("sending close", 'true')
    }
}



function runAll(){
    setInterval(getMeterData,15000)
    setInterval(networkImport, 500);
    setInterval(inputMeter,300000)
}


function main(){
    meterData= getHistoryMeterData()
    setTimeout(getMeterData,5000)
    setTimeout(runAll,10000)

}
main()











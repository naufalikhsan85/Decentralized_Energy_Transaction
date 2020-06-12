const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda');
const web3 = new Web3(provider);
//const mqtt = require('mqtt')
//const client = new mqtt.connect('wss://broker.hivemq.com')
//var client = mqtt.connect('wxs://test.mosquitto.org')
//let  client =new Paho.MQTT.Client('wxs://test.mosquitto.org', 8000,  "123456")
//var client = mqtt.connect('wss://broker.mqttdashboard.com',8000)


let abi= JSON.parse(sessionStorage.getItem("abi"));
let contract_Address= sessionStorage.getItem("address");
console.log(abi)
console.log(contract_Address)
const contract = new web3.eth.Contract(abi, contract_Address);

let checkKey=sessionStorage.getItem("privKey");
let keyOwner
if(checkKey===null){
    alert("You Must Connected To Ethereum Account")
    setTimeout(function(){ document.location.href="/connect.html"; }, 1000);
}
else{
    keyOwner=checkKey
}

let hexKey="0x"+keyOwner;
let acc= web3.eth.accounts.privateKeyToAccount(hexKey);
let current_account= acc.address;
web3.eth.defaultAccount = current_account;

let topic1;
let topic2;


//Get Realtime meter data
function _checkRealTimeMeter(addressCheck) {
    topic1 = 'meterImportGUI' + addressCheck
    console.log(topic1)
    topic2 = 'meterExportGUI' + addressCheck
    console.log(topic2)
    //startConnect()
    getRealTime()
}

function getRealTime() {
    var client = mqtt.connect('wss://test.mosquitto.org:8081')

    client.on('connect', () => {
        client.subscribe(topic1 + '/toGUI');
        client.subscribe(topic2 + '/toGUI');

    })

    client.on('message', (topic, message) => {
        console.log('received message %s %s', topic, message)

        switch (topic) {
            case topic1 + '/toGUI':
                return handleMeterImport(message)
            case topic2 + '/toGUI':
                return handleMeterExport(message)
        }


        console.log('No handler for topic %s', topic)
    })


}


/*
    function startConnect() {
        // Generate a random client ID
        let clientID = "clientID-" + parseInt(Math.random() * 100);

        let host ='test.mosquitto.org'
        let port = 8081

        // Initialize new Paho client connection
        client = new Paho.MQTT.Client(host, port, clientID);

        // Set callback handlers
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;

        // Connect the client, if successful, call onConnect function
        client.connect({
            onSuccess: onConnect,
        });
    }


    function onConnect() {
        // Subscribe to the requested topic
        client.subscribe(topic1 + '/toGUI');
        client.subscribe(topic2 + '/toGUI');
    }


    function onMessageArrived(message) {
        console.log("onMessageArrived: " + message.payloadString);
        let data = message.payloadString
        let topic = message.destinationName
        switch (topic) {
            case topic1 + '/toGUI':
                return handleMeterImport(data)
            case topic2 + '/toGUI':
                return handleMeterExport(data)
        }
    }


    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.log(responseObject.errorMessage)
        }
    }


 */

    function handleMeterImport(message) {
        document.getElementById("_meterInReal").innerHTML = Number(message)
        console.log('Receive :', topic1 + '/toGUI')
        console.log(message)
    }

    function handleMeterExport(message) {
        document.getElementById("_meterOutReal").innerHTML = Number(message)
        console.log(message)
        console.log('Receive :', topic2 + '/toGUI')
    }





function _checkByAddress(){
    let addressCheck=document.getElementById("_addressCheck").value;
    _checkRealTimeMeter(addressCheck)
    _getMeterRecordInOut(addressCheck);
    _getDataConsumeDeal(addressCheck);
    _getDataProduceDeal(addressCheck);
    _meterInTh(addressCheck);
    _meterOutTh(addressCheck);
}

function _checkBySelf(){
    let addressCheck=current_account;
    _checkRealTimeMeter(addressCheck)
    _getMeterRecordInOut(addressCheck);
    _getDataConsumeDeal(addressCheck);
    _getDataProduceDeal(addressCheck);
    _meterInTh(addressCheck);
    _meterOutTh(addressCheck);
    document.getElementById("_addressMeter").innerHTML=current_account;
}

async function _getMeterRecordInOut(_address){
    let meterRecordInOut =await contract.methods.getMeterRecordInOut(_address).call()
    document.getElementById("_meterIn").innerHTML=meterRecordInOut[0];
    document.getElementById("_meterOut").innerHTML=meterRecordInOut[1];
}
async function _getDataConsumeDeal(_address){
    let dataConsumeDeal =await contract.methods.getDataConsumeDeal(_address).call()
    document.getElementById("_pricec").innerHTML=dataConsumeDeal[0];
    document.getElementById("_pricecP").innerHTML=dataConsumeDeal[1];
    document.getElementById("_amountIn").innerHTML=dataConsumeDeal[2];
    document.getElementById("_amountInP").innerHTML=dataConsumeDeal[3];
}

async function _getDataProduceDeal(_address){
    let dataProduceDeal =await contract.methods.getDataProduceDeal(_address).call()
    document.getElementById("_pricep").innerHTML=dataProduceDeal[0];
    document.getElementById("_pricepP").innerHTML=dataProduceDeal[1];
    document.getElementById("_amountOut").innerHTML=dataProduceDeal[2];
    document.getElementById("_amountOutP").innerHTML=dataProduceDeal[3];


}
async function _meterInTh(_address){
    let meterInTh =await contract.methods.meterInTh(_address).call()
    document.getElementById("_startc").innerHTML=convert(meterInTh[0]);
    document.getElementById("_expirec").innerHTML=convert(meterInTh[2]);
    document.getElementById("_meterInLc").innerHTML=meterInTh[4];
    document.getElementById("_startcP").innerHTML=convert(meterInTh[1]);
    document.getElementById("_expirecP").innerHTML=convert(meterInTh[3]);
    document.getElementById("_meterInLcP").innerHTML=meterInTh[5];

}
async function _meterOutTh(_address){
    let meterOutTh =await contract.methods.meterOutTh(_address).call()
    document.getElementById("_startp").innerHTML=convert(meterOutTh[0]);
    document.getElementById("_expirep").innerHTML=convert(meterOutTh[2]);
    document.getElementById("_meterOutLp").innerHTML=meterOutTh[4];
    document.getElementById("_startpP").innerHTML=convert(meterOutTh[1]);
    document.getElementById("_expirepP").innerHTML=convert(meterOutTh[3]);
    document.getElementById("_meterOutLpP").innerHTML=meterOutTh[5];
}

function convert(inputTs){


    var unixtimestamp = inputTs;


    var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


    var date = new Date(unixtimestamp*1000);


    var year = date.getFullYear();


    var month = months_arr[date.getMonth()];


    var day = date.getDate();


    var hours = date.getHours();

    // Minutes
    var minutes = "0" + date.getMinutes();

    // Seconds
    var seconds = "0" + date.getSeconds();

    // Display date time in MM-dd-yyyy h:m:s format
    return  month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);



}



function _onloadSelf() {
    _checkBySelf();
    setTimeout(function () { location.reload(1); }, 30000);
}

function _onLoadAdmin() {
    document.getElementById("_addressMeter").innerHTML=current_account;
    setTimeout(function () { location.reload(1); }, 30000);
}




const Tx = require('ethereumjs-tx').Transaction;
const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda'));
const readline = require('readline-sync')
const fetch = require("node-fetch");


//Blockchain Part
let url= 'https://energydapp.000webhostapp.com/abi.json'
//'http://192.168.100.6:8080/abi.json'
//'https://energydapp.000webhostapp.com/abi.json'
//'https://raw.githubusercontent.com/naufalikhsan85/Decentralized_Energy_Transaction/master/contract/abi.json'


let dataABI
let contract_Address;
let abi;
let contract

async function fetchData(){
    let response = await fetch(url);
    //console.log(response)
    let data = await response.json();
    data = JSON.stringify(data);
    data = JSON.parse(data);
    return data;
}

async function getDataABI(){
    dataABI = await fetchData();
    contract_Address=dataABI.address;
    abi=dataABI.abi;

}
async function instanceContract() {
    contract = new web3.eth.Contract(abi, contract_Address);
}

let input_privateKey = readline.question("Input Private Key? ");
let hexKey = "0x" + input_privateKey;
let acc = web3.eth.accounts.privateKeyToAccount(hexKey);
let current_account = acc.address;
web3.eth.defaultAccount = current_account;
let current_privateKey = Buffer.from(input_privateKey, 'hex');

async function sendSign(myData, myGas) {
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

let meterData=4220


async function _meterRecordIn() {

    let myDataIn = contract.methods.meterRecordIn(meterData).encodeABI();
    sendSign(myDataIn, 100000);
}


function input() {
    getDataABI()
    setTimeout( instanceContract,3000)
    setTimeout( _meterRecordIn,4000)
}

input()
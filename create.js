const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda');
const web3 = new Web3(provider);

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


function generate() {
    let dataAcc= web3.eth.accounts.create()
    let newPass=document.getElementById('_newPass').value;
    encryptPrivateKey(dataAcc.privateKey,dataAcc.address,newPass)
}


function encryptOldPrivateKey() {
    let privateKeyOld=document.getElementById('_privateKey').value;
    let hexKey="0x"+privateKeyOld;
    let acc= web3.eth.accounts.privateKeyToAccount(hexKey);
    let current_account= acc.address;
    let encPass=document.getElementById('_keyEncPass').value;
    encryptPrivateKey(hexKey,current_account,encPass)
}



function encryptPrivateKey(privateKey,address,pass) {
    let encryptData=web3.eth.accounts.encrypt(privateKey,pass)
    console.log("encryptData",encryptData)
    let ts = Math.round((new Date()).getTime() / 1000);
    let fileName = 'keystore_'+address+'_'+convert(ts)+'.json';
    console.log(fileName)

    let fileToSave = new Blob([JSON.stringify(encryptData)], {
        type: 'text/json',
        name: fileName
    });

    saveAs(fileToSave, fileName);

}
function decryptKeyStore() {
    let objKeyStore = JSON.parse(keyStoreEnc);
    let decpassword=document.getElementById('_keyDecPass').value;
    let decryptData=web3.eth.accounts.decrypt(objKeyStore, decpassword);
    console.log("decryptData",decryptData)
    console.log("privateKey",decryptData.privateKey)
    document.getElementById("_address").innerHTML=decryptData.address;
    document.getElementById("_privateKey1").innerHTML=decryptData.privateKey.substring(2);

}

let keyStoreEnc

function readFile(input) {
    let file = input.files[0];

    let reader = new FileReader();

    reader.readAsText(file);

    reader.onload = function() {
        console.log(reader.result);
        keyStoreEnc=reader.result

    };

    reader.onerror = function() {
        console.log(reader.error);
    };

}


const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda');
const web3 = new Web3(provider);


let url='https://raw.githubusercontent.com/naufalikhsan85/Decentralized_Energy_Transaction/master/contract/abi.json'
//'http://192.168.100.6:8080/abi.json'
//'https://energydapp.000webhostapp.com/abi.json'
//'https://raw.githubusercontent.com/naufalikhsan85/Decentralized_Energy_Transaction/master/contract/abi.json'
let dataABI
async function fetchData(){
    let response = await fetch(url);
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


function connection(){
    //let filename=document.getElementById('_keyStore').value
    //console.log((filename.substring(12)).slice(0,-5))
    //sessionStorage.setItem("filename",(filename.substring(12)).slice(0,-5));

    let objKeyStore = JSON.parse(keyStoreEnc);
    let decpassword=document.getElementById('_keyDecPass').value;
    let decryptData=web3.eth.accounts.decrypt(objKeyStore, decpassword)
    let keyOwner=decryptData.privateKey.substring(2);

    sessionStorage.setItem("privKey",keyOwner);
    let hexKey="0x"+keyOwner;
    let acc= web3.eth.accounts.privateKeyToAccount(hexKey);
    let current_account= acc.address;

    document.getElementById("_valid").innerHTML=Web3.utils.isAddress(current_account)
    document.getElementById("_address").innerHTML=current_account;
    document.getElementById("_privateKey1").innerHTML=keyOwner;

    web3.eth.net.isListening()
        .then(() => document.getElementById("_network").innerHTML="Network is connected")
        .catch(e => document.getElementById("_network").innerHTML="Wow. Something went wrong")

    checkUser(current_account);
}

function logout(){
    sessionStorage.removeItem("privKey");
    sessionStorage.removeItem('contract');
    document.location.href="/index.html";
}

async function checkUser(current_account) {
    let dataABI= await getABI()
    console.log(dataABI)
    let dataAddress= await getAddress()
    console.log(dataAddress)
    const contract = new web3.eth.Contract(dataABI, dataAddress);
    sessionStorage.setItem("abi",JSON.stringify(dataABI));
    sessionStorage.setItem("address",dataAddress);
    let _status= await contract.methods.checkUser(current_account).call()
    document.getElementById("_status").innerHTML=_status;

            if(_status==="Owner"){
                setTimeout(function(){ document.location.href="/userAdmin.html"; }, 2000);

            }
            else if(_status==="Registered User"){
                setTimeout(function(){ document.location.href="/user.html"; }, 2000);

            }
            else{
                setTimeout(function(){ document.location.href="/index.html"; }, 2000);

            }
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


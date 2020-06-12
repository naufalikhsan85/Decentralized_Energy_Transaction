const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/07d2bc437e6043ebb25b51afb4760fda');
const web3 = new Web3(provider);

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
let privateKey1 = new ethereumjs.Buffer.Buffer(keyOwner, 'hex');

let myData;

//Gas Price
//let veryCheapSpeed=3;
let cheapSpeed="6";
//let mediumSpeed=9;
//let fastSpeed=12;
//let veryFastSpeed=15;

//Gas Limit
//let xxxlTx=1000000;
//let xxlTx=750000;
let xlTx=500000;
//let lTx=250000;
let mTx=150000;
let sTx=100000;
let xsTx=50000;

let setGasPrice=cheapSpeed;
function sendSign(myData,gasLimit){
    web3.eth.getTransactionCount(current_account, (err, txCount) => {
        // Build the transaction
        const txObject = {
            nonce:    web3.utils.toHex(txCount),
            to:       contract_Address,
            value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
            gasLimit: web3.utils.toHex(gasLimit),
            gasPrice: web3.utils.toHex(web3.utils.toWei(setGasPrice, 'gwei')),
            data:myData
        }
        // Sign the transaction
        const tx =new ethereumjs.Tx(txObject);
        tx.sign(privateKey1);

        const serializedTx = tx.serialize();
        const raw = '0x' + serializedTx.toString('hex');

        // Broadcast the transaction
        const transaction = web3.eth.sendSignedTransaction(raw)
            .on('transactionHash', hash => {
                console.log('TX Hash', hash)
                alert('Transaction was send, please wait ... ')
                document.getElementById("_tx").innerHTML="https://ropsten.etherscan.io/tx/"+ hash;
                document.getElementById("_mined").innerHTML= "Please Wait..."
                document.getElementById("_result").innerHTML="Please Wait..."

            })
            .then(receipt => {
                console.log('Mined', receipt)
                document.getElementById("_mined").innerHTML= "Your transaction was mined...";
                console.log(receipt.status)
                _reload()
                if(receipt.status === true ){
                    console.log('Transaction Success')
                    alert('Transaction Success')
                    document.getElementById("_result").innerHTML=receipt.status;
                }
                else if(receipt.status === false)
                    console.log('Transaction Failed')
                    document.getElementById("_result").innerHTML=receipt.status;
            })
            .catch( err => {
                console.log('Error', err)
                alert('Transaction Failed')
            })
            .finally(() => {
                console.log('Extra Code After Everything')
            })
    });
}



function _createUser() {
    myData = contract.methods.createUser(document.getElementById("_userAddress").value,pinUser).encodeABI();
    sendSign(myData,mTx);
}

function _deleteUser(){
    myData = contract.methods.deleteUser(document.getElementById("_userAddress").value,pinUser).encodeABI();
    sendSign(myData,sTx);
}

function _checkActive(){
    myData = contract.methods.checkActive().encodeABI();
    sendSign(myData,xlTx);
    _getCheckActive()
}

async function _getCheckActive(){
    let checkActive = await contract.methods.getCheckActive().call()
    document.getElementById("_total").innerHTML=checkActive[0];
    document.getElementById("_addresses").innerHTML=checkActive[1];
}

async function _checkUser(){
    document.getElementById("_log1").innerHTML= await contract.methods.checkUser(document.getElementById("_addressTest").value).call()


    let userData =await contract.methods.getMyUserdata(document.getElementById("_addressTest").value).call()
    document.getElementById("_log2").innerHTML=userData[1];
    document.getElementById("_log4").innerHTML=userData[2];
    document.getElementById("_log3").innerHTML=userData[3];

    let capData =await contract.methods.getMyCapacity(document.getElementById("_addressTest").value).call()
    document.getElementById("_log5").innerHTML=capData[0];
    document.getElementById("_log6").innerHTML=capData[1];
}


function _updateMyUserData() {
    myData = contract.methods.updateMyUserData
    (
        document.getElementById("_username").value,
        document.getElementById("_location").value,
        document.getElementById("_email").value,
        pinUser
    ).encodeABI();
    sendSign(myData,mTx);
}

function _updateMyCapacity() {
    myData = contract.methods.updateMyCapacity
    (
        document.getElementById("_produceCap").value,
        document.getElementById("_consumeCap").value,
        pinUser
    ).encodeABI();
    sendSign(myData,mTx);
}


async function _getMyUserdata(){
    let userData =await contract.methods.getMyUserdata(current_account).call()
    document.getElementById("_username").value=userData[1];
    document.getElementById("_email").value=userData[2];
    document.getElementById("_location").value=userData[3];
}

async function _getMyCapacity(){
    let capData =await contract.methods.getMyCapacity(current_account).call()
    document.getElementById("_consumeCap").value=capData[0];
    document.getElementById("_produceCap").value=capData[1];
}


function _changeMyPINUser() {
    let oldPIN =web3.utils.soliditySha3(web3.utils.soliditySha3(document.getElementById("_oldPIN").value));
    let newPIN =web3.utils.soliditySha3(document.getElementById("_newPIN").value);

    myData = contract.methods.changeMyPINUser(oldPIN,newPIN).encodeABI();
    sendSign(myData,mTx);
}

function _changeOwner() {
    myData = contract.methods.changeOwner
    (
        document.getElementById("_newOwner").value
    ).encodeABI();
    sendSign(myData,xsTx);
}

function _reload(){
    _onload()
    setTimeout(function () { location.reload(1); }, 1000);
}

function _onload(){
    _getMyUserdata();
    _getMyCapacity();
    _getCheckActive();
    document.getElementById("_addressAdmin").innerHTML=current_account;
    setTimeout(function () { location.reload(1); }, 300000);

}
let pinUser;

async function inputPIN(){

    let inputPINuser=prompt("Please Enter Your 6 PIN Number to Continue:");
    if(inputPINuser === null){
        alert("PIN Must Not Empty")
        inputPIN()
    }
    else{
        pinUser= web3.utils.soliditySha3(web3.utils.soliditySha3(inputPINuser));
    }
    //console.log(pinUser)

    let statusPIN= await contract.methods.checkPINInput(current_account,pinUser).call()
    console.log(statusPIN)

    if(statusPIN === "True"){
        alert("Welcome")
    }
    else{
        alert("Wrong PIN")
        setTimeout(inputPIN, 1000);
    }

}

window.onload=_onload();
window.onload=inputPIN();
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
//let xlTx=500000;
//let lTx=250000;
//let mTx=150000;
let sTx=100000;
//let xsTx=50000;

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
                _reload()
                console.log(receipt.status)
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

function _depositIDR() {
    myData = contract.methods.depositIDR
    (
        document.getElementById("_addressDW").value,
        document.getElementById("_amountIDR").value,
        pinUser
    ).encodeABI();
    sendSign(myData,sTx);
}

function _withdrawIDR() {
    myData = contract.methods.withdrawIDR
    (
        document.getElementById("_addressDW").value,
        document.getElementById("_amountIDR").value,
        pinUser
    ).encodeABI();
    sendSign(myData,sTx);
}

function _toTransferIDR() {
    myData = contract.methods.toTransferIDR
    (
        document.getElementById("_addressT").value,
        document.getElementById("_transfer").value,
        pinUser
    ).encodeABI();
    sendSign(myData,sTx);
}

function _reload(){
    _onload();
    setTimeout(function () { location.reload(1); }, 1000);
}

async function _checkBalances(){
    document.getElementById("_balancesUser").innerHTML= await contract.methods.getMyBalanceIDR(document.getElementById("_addrCheckBalances").value).call()
    web3.eth.getBalance(document.getElementById("_addrCheckBalances").value, function (error, wei) {
        if (!error) {
            var balance = web3.utils.fromWei(wei, 'ether');
            console.log(balance + " ETH");
            document.getElementById("_ETHUser").innerHTML=balance;
        }
    });
}

async function _getMyBalanceIDR() {
    document.getElementById("_balances").innerHTML= await contract.methods.getMyBalanceIDR(current_account).call()
    document.getElementById("_addressFund").innerHTML=current_account
}
async function _getCirculateIDR(){
    document.getElementById("_circulateIDR").innerHTML=await contract.methods.getCirculateIDR().call()
}


function _onload(){
    _getMyBalanceIDR();
    _getCirculateIDR()
    setTimeout(function () { location.reload(1); }, 300000);
    web3.eth.getBalance(current_account, function (error, wei) {
        if (!error) {
            var balance = web3.utils.fromWei(wei, 'ether');
            console.log(balance + " ETH");
            document.getElementById("_ETH").innerHTML=balance;
        }
    });
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
window.onload = _onload();
window.onload=inputPIN();

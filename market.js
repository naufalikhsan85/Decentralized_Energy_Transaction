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
let lTx=250000;
//let mTx=150000;
//let sTx=100000;
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




async function _getPrice() {
    let priceData=await contract.methods.getPrice().call()
    document.getElementById("_currentPrice").innerHTML=priceData[0];
    document.getElementById("_declareDate").innerHTML=convert(priceData[1]);
    document.getElementById("_startDate").innerHTML=convert(priceData[2]);
    document.getElementById("_expireDate").innerHTML=convert(priceData[3]);
}


async function _getAllRequest() {
    let allRequestData=await contract.methods.getAllRequest().call()
    document.getElementById("_totalReq").innerHTML=allRequestData[0];
    document.getElementById("_totalTaken").innerHTML=allRequestData[1];
}

async function _getMaxConProdCap() {
    let conProdCapData=await contract.methods.getMaxConProdCap().call()
    document.getElementById("_maxCon").innerHTML=conProdCapData[0];
    document.getElementById("_maxProd").innerHTML=conProdCapData[1];
    document.getElementById("_addressMarket").innerHTML=current_account;
}

async function _getTotalConProdPrevious() {
    let totalConProdPreviousData=await contract.methods.getTotalConProdPrevious().call();
    document.getElementById("_totalCon").innerHTML=totalConProdPreviousData[0];
    document.getElementById("_totalProd").innerHTML=totalConProdPreviousData[1];
}
function _requestToConsume(){
    myData = contract.methods.requestToConsume
    (
        document.getElementById("_reqEnergy").value,
        pinUser
    ).encodeABI();
    sendSign(myData,lTx);
}

function _takeToProduce(){
    myData = contract.methods.takeToProduce
    (
        document.getElementById("_takeEnergy").value,
        pinUser
    ).encodeABI();
    sendSign(myData,lTx);
}

function _setPricePeriod() {
    myData = contract.methods.setPricePeriod
    (
        document.getElementById("_setPrice").value,
        document.getElementById("_day").value,
        pinUser
    ).encodeABI();
    sendSign(myData,xlTx);
}
function _reload(){
    _checkMarket()
    setTimeout(function () { location.reload(1); }, 1000);
}
function _checkMarket() {
    _getPrice()
    _getAllRequest()
    _getMaxConProdCap()
    _getTotalConProdPrevious()

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

function convert(inputTs){

    // Unixtimestamp
    var unixtimestamp = inputTs;

    // Months array
    var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Convert timestamp to milliseconds
    var date = new Date(unixtimestamp*1000);

    // Year
    var year = date.getFullYear();

    // Month
    var month = months_arr[date.getMonth()];

    // Day
    var day = date.getDate();

    // Hours
    var hours = date.getHours();

    // Minutes
    var minutes = "0" + date.getMinutes();

    // Seconds
    var seconds = "0" + date.getSeconds();

    // Display date time in MM-dd-yyyy h:m:s format
    return  month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);



}
window.onload=_checkMarket();
window.onload=inputPIN();


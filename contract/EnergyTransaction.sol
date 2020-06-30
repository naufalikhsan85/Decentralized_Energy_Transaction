pragma solidity ^0.6.3;

import "VPPToken.sol";
import "SafeMath.sol";
import "DigitalIDR.sol";

contract EnergyDapp is VPPToken, Digital_IDR{
    using SafeMath for uint256;

    uint256 private tempNumber;

    uint256 priceEnergy; //Harga Energi saat ini
    uint256 priceEnergyPrev;//Harga Energi sebelumnya

    uint256 declareDate;//Waktu deklarasi kontrak
    uint256 startDate;//Waktu awal kontrak harga
    uint256 expireDate;//Waktu kadaluarsa kontrak harga

    uint256 declareDatePrev;//Waktu deklarasi kontrak
    uint256 startDatePrev;//Waktu awal kontrak harga
    uint256 expireDatePrev;//Waktu kadaluarsa kontrak harga


    uint256 maxProductionCapacity; //Kapasitas keseluruhan produsen
    uint256 maxConsumptionCapacity;//Kapasitas keseluruhan konsumen

    uint256 requestLoadPool;//Penampung request konsumen
    uint256 takenRequestPool;//Penampung request yang diambil

    uint256 totalConsumption;//total consumption yang dikonsumsi
    uint256 totalProduction;//total production yang diproduksi

    address owner;//Alamat pemilik kontrak/admin

    bytes32 private _defaultPIN;

    mapping (address => bytes32) private userPIN; //Menyimpan PIN pengguna
    mapping (address => bool) public isUser; //Menyimpan pengguna aktif
    mapping (address => UserDB) private userdbs; //Menyimpan data pengguna
    mapping (address => MeterDB) private mdbs; //Menyimpan data meter
    mapping (address => DealDB) private dealdbs;//Menyimpan data kesepakatan kontrak

    uint256 counterUsers;

    //Menyimpan alamat pengguna dengan index
    mapping (uint256 => address) public users;

    //Menyimpan status tagihan
    mapping (address => uint256) public isDebt;

    address[] userCheck;

    struct MeterDB {
        //meter import
        uint256 currentMeterIn; //Rekaman saat ini konsumsi listrik
        uint256 startMeterIn; //Pencatat batas awal konsumsi
        uint256 limitMeterIn; //Pencatat batas akhir konsumsi

        uint256 currentMeterInPrev; //Rekaman saat ini konsumsi listrik
        uint256 startMeterInPrev; //Pencatat batas awal konsumsi
        uint256 limitMeterInPrev; //Pencatat batas akhir konsumsi

        //meter export
        uint256 currentMeterOut; //Rekaman saat ini produksi listrik
        uint256 startMeterOut; //Pencatat batas awal produksi
        uint256 limitMeterOut; //Pencatat batas akhir produksi

        uint256 currentMeterOutPrev; //Rekaman saat ini produksi listrik
        uint256 startMeterOutPrev; //Pencatat batas awal produksi
        uint256 limitMeterOutPrev; //Pencatat batas akhir produksi
    }


    struct DealDB {
        //deal import
        uint256 dealEnergyIn;//Jumlah energi yang disepakati
        uint256 dealPriceIn; //Harga yang disepakati
        uint256 dealStartIn; //Awal waktu yang disepakati
        uint256 dealExpireIn; //Batas waktu yang disepakati

        uint256 dealEnergyInPrev;//Jumlah energi yang disepakati
        uint256 dealPriceInPrev; //Harga yang disepakati
        uint256 dealStartInPrev; //Awal waktu yang disepakati
        uint256 dealExpireInPrev; //Batas waktu yang disepakati



        //deal export
        uint256 dealEnergyOut;//Jumlah energi yang disepakati
        uint256 dealPriceOut; //Harga yang disepakati
        uint256 dealStartOut; //Awal waktu yang disepakati
        uint256 dealExpireOut; //Batas waktu yang disepakati

        uint256 dealEnergyOutPrev;//Jumlah energi yang disepakati
        uint256 dealPriceOutPrev; //Harga yang disepakati
        uint256 dealStartOutPrev; //Awal waktu yang disepakati
        uint256 dealExpireOutPrev; //Batas waktu yang disepakati
    }

    struct UserDB {

        uint256 index; //No urut pengguna

        uint256 productionCapacity; //Kapasitas produksi
        uint256 consumptionCapacity; //Kapasitas konsumsi

        string  userName; //Nama pengguna
        string  userLocation; //Lokasi pengguna
        string  userEmail; //Email pengguna

    }

//  Rules
    modifier onlyOwner(){ //hanya untuk admin
        require(owner == msg.sender, "Error!! Only-owner");
        _;
    }

    modifier userNotExist(address _UserAddress) { //hanya untuk user tidak terdaftar
        require(!isUser[_UserAddress], "User Already Exist");
        _;
    }


    modifier userExist (address _UserAddress){ //hanya untuk user terdaftar
        require(isUser[_UserAddress], "User Not Exist");
        _;
    }

    modifier pinCheck (bytes32 _UserPIN){ //cek PIN pengguna
        require(userPIN[msg.sender] == _UserPIN, "Wrong PIN");
        _;
    }

    modifier contractNotStarted(){ //Hanya ketika kontrak belum dimulai
        require(now < startDate, "Contract Was Started");
        _;
    }

    modifier contractStarted(){
        require(now > startDate, "Contract Was Not Started");
        _;
    }

    modifier contractNotExpired(){
        require(now < expireDate,"Contract Was Expired");
        _;
    }

    modifier contractExpired(){
        require(now > expireDate,"Contract Was Not Expired");
        _;
    }

    modifier inDeclarationTime(){
        require(now >declareDate,"Out of Declaration Time");
        _;
    }

    event LogUserRegDel(string _KindOfFunction,address _UserAddress, uint index, uint256 _TimeStamp);
    event LogupdateMyUserData(string _KindOfFunction, address _UserAddress, string  _UserName, uint256 _TimeStamp);
    event LogUpdateMyCapacity(string _KindOfFunction,uint256 _ProductionCapacity,uint256 _ConsumptionCapacity, uint256 _TimeStamp);
    event LogChangePIN(address _UserAddress,uint256 _TimeStamp);

    event LogDepositIDR(address _UserAddress, uint256 _AmountIDR,uint256 _TimeStamp);
    event LogWithdrawIDR(address _UserAddress, uint256 _AmountIDR,uint256 _TimeStamp);

    event LogSetPrice(string _KindOfFunction,uint256 _SetPrice,uint256 _Declare,uint256 _Start, uint256 _End, uint256 _TimeStamp);

    event LogDealConsume(address _UserAddress, uint256 _AmountEnergy, uint256 _priceEnergy,uint256 startDate,uint256 expireDate, uint256 _StartMeterIn, uint256 _TimeStamp);
    event LogDealProduce(address _UserAddress, uint256 _AmountEnergy, uint256 _priceEnergy,uint256 startDate,uint256 expireDate, uint256 _StartMeterOut, uint256 _TimeStamp);

    event LogPayBill(address _UserAddress,uint256 _Bill,uint256 _TimeStamp);
    event LogPayRevenue(address _UserAddress,uint256 _Revenue,uint256 _TimeStamp);

    event LogMeterInRecord(address _UserAddress, uint256 _MeterIn, uint256 _TimeStamp);
    event LogMeterOutRecord(address _UserAddress, uint256 _MeterOut, uint256 _TimeStamp);

    event LogChangeOwner(address _OwnerBefore, address _OwnerAfter, uint256 _TimeStamp);

    constructor() public{

        owner=msg.sender; //Simpan owner

        uint256 inPIN=123456;
        _defaultPIN=keccak256(abi.encodePacked(inPIN)); //Create PIN

        userPIN[owner]=keccak256(abi.encodePacked(_defaultPIN)); //Set PIN

        isUser[owner]=true; //set user aktif

        counterUsers++; //set index user
        users[counterUsers] = owner; //simpan alamat dengan index
        userdbs[owner].index =counterUsers;//simpan index dengan alamat

        emit LogUserRegDel("Create Owner",owner,userdbs[owner].index, now);
    }

//************************************User function**************************************

//  Mendaftarkan pengguna baru
    function createUser(address _NewUserAddress,bytes32 _PIN) public
    onlyOwner
    pinCheck(_PIN)
    userNotExist(_NewUserAddress){
        require(_NewUserAddress !=address(0),"Not an ETH address");
        isUser[_NewUserAddress]=true; //set aktif

        counterUsers++; //set index
        users[counterUsers] = _NewUserAddress; //simpan alamat dengan index

        userdbs[_NewUserAddress].index =counterUsers;//simpan index dengan alamat

        userPIN[_NewUserAddress]=keccak256(abi.encodePacked(_defaultPIN));//Set PIN

        emit LogUserRegDel("Create User",_NewUserAddress,userdbs[_NewUserAddress].index, now);
    }

//	Menghapus User yang ingin melepaskan diri dari jaringan VPP
    function deleteUser(address _TargetUserAddress, bytes32 _PIN) public
    onlyOwner
    pinCheck(_PIN)
    userExist(_TargetUserAddress){

        isUser[_TargetUserAddress] = false;
        emit LogUserRegDel("Delete User",_TargetUserAddress,userdbs[_TargetUserAddress].index, now);
    }

//  Melakukan update data user
    function updateMyUserData(string memory _NewUserName, string memory _NewLocation, string memory _NewUserEmail, bytes32 _PIN)
    public
    pinCheck(_PIN)
    userExist(msg.sender){

        userdbs[msg.sender].userName         =_NewUserName;
        userdbs[msg.sender].userLocation     =_NewLocation;
        userdbs[msg.sender].userEmail        =_NewUserEmail;

        emit LogupdateMyUserData("Update User Data",msg.sender,_NewUserName, now);
    }

//  Melihat data user
    function getMyUserdata(address _UserAddress) public view
    userExist(_UserAddress)
    returns(uint256, string memory,string memory,string memory){

        return(
            userdbs[_UserAddress].index,
            userdbs[_UserAddress].userName,
            userdbs[_UserAddress].userEmail,
            userdbs[_UserAddress].userLocation
            );
    }

//  Melakukan update kapasitas produksi dan konsumsi
    function updateMyCapacity(uint256 _ProductionCapacity, uint256 _ConsumptionCapacity, bytes32 _PIN)
    public
    pinCheck(_PIN)
    userExist(msg.sender)
    {
        tempNumber=userdbs[msg.sender].productionCapacity;
        maxProductionCapacity=(maxProductionCapacity.sub(tempNumber)).add(_ProductionCapacity);
        userdbs[msg.sender].productionCapacity=_ProductionCapacity;

        tempNumber=userdbs[msg.sender].consumptionCapacity;
        maxConsumptionCapacity=(maxConsumptionCapacity.sub(tempNumber)).add(_ConsumptionCapacity);
        userdbs[msg.sender].consumptionCapacity=_ConsumptionCapacity;

        emit LogUpdateMyCapacity("updateMyCapacity",_ProductionCapacity,_ConsumptionCapacity, now);
    }

    function getMyCapacity(address _UserAddress) public view
    userExist(_UserAddress)
    returns(uint256,uint256){
        return(
            userdbs[_UserAddress].consumptionCapacity,
            userdbs[_UserAddress].productionCapacity
            );
    }

    function changeMyPINUser(bytes32 _OldPIN,bytes32 _NewPIN)
    public
    userExist(msg.sender)
    pinCheck(_OldPIN){

        userPIN[msg.sender]=keccak256(abi.encodePacked(_NewPIN));

        emit LogChangePIN (msg.sender,now);
    }
//*************************************IDR function***************************************************

//  Deposit dam Withdraw IDR

//  Mengirim saldo IDR ke dompet pengguna
    function depositIDR(address _AddressDeposit, uint256 _AmountIDR, bytes32 _PIN) public
    pinCheck(_PIN)
    userExist(_AddressDeposit){

        _mintIDR(_AddressDeposit,_AmountIDR);

        emit LogDepositIDR(_AddressDeposit, _AmountIDR, now);
    }

//  Menarik saldo IDR dari dompet pengguna
    function withdrawIDR(address _AddressWithdraw, uint256 _AmountIDR, bytes32 _PIN) public
    pinCheck(_PIN)
    userExist(_AddressWithdraw){

        _burnIDR(_AddressWithdraw,_AmountIDR);

        emit LogWithdrawIDR(_AddressWithdraw, _AmountIDR, now);
    }

// Mengirim saldo ke pengguna lain
    function toTransferIDR(address _recipient, uint256 _AmountIDR, bytes32 _PIN) public pinCheck(_PIN) userExist(_recipient) {

        transferIDR(_recipient,_AmountIDR);
    }

//	Melihat saldo IDR
    function getMyBalanceIDR(address _UserAddress) public view
    userExist(_UserAddress)
    returns(uint256){
        return balanceOfIDR(_UserAddress);
    }


//************************Recording function*******************************************

    function meterRecordIn(uint256 _InMeterNow) public userExist(msg.sender) {
        //hanya diizinkan ketika belum expire dan dibawah batas
        require(_InMeterNow <= mdbs[msg.sender].limitMeterIn,"Meter over the energy limit");
        require(now <=dealdbs[msg.sender].dealExpireIn,"Meter Expired");
        require(now >=dealdbs[msg.sender].dealStartIn,"Meter not Started");

        mdbs[msg.sender].currentMeterIn=_InMeterNow; //meter konsumsi

        emit LogMeterInRecord(msg.sender, _InMeterNow, now);
    }

    function meterRecordOut(uint256 _OutMeterNow) public userExist(msg.sender) {
        //hanya diizinkan ketika belum expire dan dibawah batas
        require(_OutMeterNow <= mdbs[msg.sender].limitMeterOut,"Meter over the energy limit");
        require(now <=dealdbs[msg.sender].dealExpireOut,"Meter Expired");
        require(now >=dealdbs[msg.sender].dealStartOut,"Meter not Started");


        uint256 createToken=_OutMeterNow.sub(mdbs[msg.sender].currentMeterOut); //meter saat ini dikurang meter sebelumnya


        if (createToken >0){
            _mint(msg.sender,createToken); //Cetak bukti produksi
            mdbs[msg.sender].currentMeterOut=_OutMeterNow; //meter produksi
        }
        else{
            mdbs[msg.sender].currentMeterOut=_OutMeterNow;
        }

        emit LogMeterOutRecord(msg.sender, _OutMeterNow, now);

    }

    function getMeterRecordInOut(address _UserAddress) public userExist(_UserAddress) view returns(uint256,uint256){
        return(
            mdbs[_UserAddress].currentMeterIn,
            mdbs[_UserAddress].currentMeterOut
            );
    }


    function getDataConsumeDeal(address _UserAddress) public userExist(_UserAddress) view returns(uint256,uint256,uint256,uint256){
        return(
            dealdbs[_UserAddress].dealPriceIn,
            dealdbs[_UserAddress].dealPriceInPrev,
            dealdbs[_UserAddress].dealEnergyIn,
            dealdbs[_UserAddress].dealEnergyInPrev
            );
    }


    function getDataProduceDeal(address _UserAddress) public userExist(_UserAddress) view returns(uint256,uint256,uint256,uint256){
        return(
            dealdbs[_UserAddress].dealPriceOut,
            dealdbs[_UserAddress].dealPriceOutPrev,
            dealdbs[_UserAddress].dealEnergyOut,
            dealdbs[_UserAddress].dealEnergyOutPrev
            );
    }

    function meterInTh(address _UserAddress) public userExist(_UserAddress) view returns(uint256,uint256,uint256,uint256,uint256,uint256){
        return (
            dealdbs[_UserAddress].dealStartIn,
            dealdbs[_UserAddress].dealStartInPrev,
            dealdbs[_UserAddress].dealExpireIn,
            dealdbs[_UserAddress].dealExpireInPrev,
            mdbs[_UserAddress].limitMeterIn,
            mdbs[_UserAddress].limitMeterInPrev
            );
    }

    function meterOutTh(address _UserAddress) public userExist(_UserAddress) view returns(uint256,uint256,uint256,uint256,uint256,uint256){
        return (
            dealdbs[_UserAddress].dealStartOut,
            dealdbs[_UserAddress].dealStartOutPrev,
            dealdbs[_UserAddress].dealExpireOut,
            dealdbs[_UserAddress].dealExpireOutPrev,
            mdbs[_UserAddress].limitMeterOut,
            mdbs[_UserAddress].limitMeterOutPrev
            );
    }

//******************************Set Price function**********************************

    function setPricePeriod(uint256 _SetPrice, uint256 _DayDeclare, uint256 _DayValid, bytes32 _PIN) public onlyOwner pinCheck(_PIN) contractExpired
    {

    savePrevPricePeriode();


        if((_DayDeclare>0) && (_DayValid>0) && (_SetPrice>0)){

            priceEnergy=_SetPrice;
            declareDate=now;
            startDate=now.add(_DayDeclare.mul(1 minutes));
            expireDate=startDate.add(( _DayValid.mul( 1 minutes)));

        }
        else if((_DayDeclare==0) && (_DayValid==0) && (_SetPrice==0)){

            priceEnergy=0;
            declareDate=now;
            startDate=now;
            expireDate=now;

         }

        if(priceEnergyPrev>0){

            _takeProfit();

        }

        emit LogSetPrice("setPricePeriod",_SetPrice,declareDate,startDate,expireDate,now);
    }

    function getPrice() public view returns(uint256, uint256, uint256, uint256){
        return(priceEnergy,declareDate, startDate, expireDate);
    }

    function savePrevPricePeriode() internal{
     priceEnergyPrev=priceEnergy;
     declareDatePrev=declareDate;
     startDatePrev=startDate;
     expireDatePrev=expireDate;
    }

//******************************Request function************************************

    function requestToConsume(uint256 _AmountEnergyReq, bytes32 _PIN) public pinCheck(_PIN) inDeclarationTime contractNotStarted userExist(msg.sender)
    {
        //Permintaan Energy
        //Permintaan wajib dibawah kapasitas produsen
        require(_AmountEnergyReq <= maxProductionCapacity,"Demand exceeds the maximum capacity of power plant");
        //Permintaan wajib dibawah kapasitas konsumsi
        require((_AmountEnergyReq <= (userdbs[msg.sender].consumptionCapacity)) && ((userdbs[msg.sender].consumptionCapacity)>0),"Request exceed the maximum your consumption capacity");
        //Saldo wajib cukup untuk membayar
        require((balanceOfIDR(msg.sender)) >= (priceEnergy.mul(_AmountEnergyReq)),"Insufficient IDR balance for pay, please deposit again");
        requestLoadPool=requestLoadPool.add(_AmountEnergyReq);

        saveReqDealPrev();
        //Input kesepakatan
        dealdbs[msg.sender].dealEnergyIn=_AmountEnergyReq;
        dealdbs[msg.sender].dealPriceIn=priceEnergy;
        dealdbs[msg.sender].dealStartIn=startDate;
        dealdbs[msg.sender].dealExpireIn=expireDate;


        //Input kesepakatan meter
        uint256 meterNow=mdbs[msg.sender].currentMeterIn;
        mdbs[msg.sender].startMeterIn=meterNow;
        mdbs[msg.sender].limitMeterIn=(meterNow.add(_AmountEnergyReq));

        //Set status isDebt
        isDebt[msg.sender]=1;


        emit LogDealConsume(msg.sender,_AmountEnergyReq,priceEnergy,startDate,expireDate,meterNow,now);
    }

    function saveReqDealPrev() internal{

        dealdbs[msg.sender].dealEnergyInPrev=dealdbs[msg.sender].dealEnergyIn;
        dealdbs[msg.sender].dealPriceInPrev=dealdbs[msg.sender].dealPriceIn;
        dealdbs[msg.sender].dealStartInPrev=dealdbs[msg.sender].dealStartIn;
        dealdbs[msg.sender].dealExpireInPrev=dealdbs[msg.sender].dealExpireIn;

        mdbs[msg.sender].startMeterInPrev=mdbs[msg.sender].startMeterIn;
        mdbs[msg.sender].limitMeterInPrev=mdbs[msg.sender].limitMeterIn;
    }

//******************************Take function***************************************

    function takeToProduce(uint256 _AmountEnergyTake, bytes32 _PIN) public pinCheck(_PIN) inDeclarationTime contractNotStarted userExist(msg.sender)
    {
        //Produksi Energy
        //Produksi wajib dibawah kemampuan konsumen
        require(_AmountEnergyTake <= maxConsumptionCapacity,"Amount energy exceeds the maximum consumption capacity of all consumer");
        //Produksi wajib dibawah kemampuan produksi
        require((_AmountEnergyTake <= (userdbs[msg.sender].productionCapacity)) && ((userdbs[msg.sender].productionCapacity) > 0),"Request exceed the maximum your production capacity");
        //Produksi wajib dibawah permintaan konsumen
        require(_AmountEnergyTake <= requestLoadPool,"Amount energy exceeds the current request from consumer");
        requestLoadPool=requestLoadPool.sub(_AmountEnergyTake);
        takenRequestPool=takenRequestPool.add(_AmountEnergyTake);

        saveTakeDealPrev();

        //Input kesepakatan
        dealdbs[msg.sender].dealEnergyOut=_AmountEnergyTake;
        dealdbs[msg.sender].dealPriceOut=priceEnergy;
        dealdbs[msg.sender].dealStartOut=startDate;
        dealdbs[msg.sender].dealExpireOut=expireDate;

        //Input kesepakatan meter
        uint256 meterNow=mdbs[msg.sender].currentMeterOut;
        mdbs[msg.sender].startMeterOut=meterNow;
        mdbs[msg.sender].limitMeterOut=(meterNow.add(_AmountEnergyTake));

        emit LogDealProduce(msg.sender, _AmountEnergyTake, priceEnergy,startDate,expireDate, meterNow,now);
    }

    function saveTakeDealPrev() internal{

        dealdbs[msg.sender].dealEnergyOutPrev=dealdbs[msg.sender].dealEnergyOut;
        dealdbs[msg.sender].dealPriceOutPrev=dealdbs[msg.sender].dealPriceOut;
        dealdbs[msg.sender].dealStartOutPrev=dealdbs[msg.sender].dealStartOut;
        dealdbs[msg.sender].dealExpireOutPrev=dealdbs[msg.sender].dealExpireOut;

        mdbs[msg.sender].startMeterOutPrev=mdbs[msg.sender].startMeterOut;
        mdbs[msg.sender].limitMeterOutPrev=mdbs[msg.sender].limitMeterOut;

    }
//******************************Bill function***************************************
    function _payBill(address _UserAddress) internal{

        //Mengambil data untuk kalkulasi tagihan dan denda;
        uint256 checkEnergy =     dealdbs[_UserAddress].dealEnergyIn;
        uint256 checkPrice  =     dealdbs[_UserAddress].dealPriceIn;
        uint256 checkMeter  =     mdbs[_UserAddress].currentMeterIn;
        uint256 checkStart  =     mdbs[_UserAddress].startMeterIn;
        uint256 checkLimit  =     mdbs[_UserAddress].limitMeterIn;


        if(checkMeter > checkStart){
            uint256 bill        = (checkMeter.sub(checkStart)).mul(checkPrice);
            totalConsumption    = totalConsumption.add(checkMeter.sub(checkStart));


            if(bill >0){
                if(checkMeter < checkLimit){

                    uint256 remainEnergy=checkLimit.sub(checkMeter);
                    uint256 percenRemain=(remainEnergy.mul(100)).div(checkEnergy);
                    uint256 remainBill=remainEnergy.mul(checkPrice);
                    uint256 penalty=(remainBill.mul(percenRemain)).div(100);

                    uint256 bp=bill.add(penalty);
                    _transferBill(_UserAddress,bp);
                }

                else{
                    _transferBill(_UserAddress,bill);
                }
            }
        }
        else{

                uint256 mustPay=checkEnergy.mul(checkPrice);
                totalConsumption    = totalConsumption.add(checkEnergy);
                _transferBill(_UserAddress,mustPay);
        }

    }

    //Memanggil fungsi transfer IDR dari kontrak ERC20
    function _transferBill(address _UserAddress, uint256 _Bill) internal{
        require(_Bill > 0,"Bill must not zero");

        //Dikirim ke alamat admin
        _transferIDR(_UserAddress, owner, _Bill);

        isDebt[_UserAddress]=0;

        emit LogPayBill(_UserAddress,_Bill,now);
    }


//******************************Take Profit function***************************************
    function _takeProfit() internal{
        //Reset total konsumsi
        totalConsumption=0;

        //Melakukan pengecekan dan penarikan tagihan pada pengguna
        for (uint i = 1; i <= counterUsers; i++){

            if(isDebt[users[i]]>0){

                _payBill(users[i]);

            }
        }

        _shareProfit();
    }

//******************************Share function**************************************
    function _shareProfit() internal{

        //Mengambil seluruh bukti produksi
        totalProduction = totalSupply();

        //Konsumsi < Produksi
        if(totalConsumption < totalProduction){
            _shareProfitUser(totalProduction);
        }

        //Konsumsi > Produksi
        else if(totalConsumption > totalProduction){
            _shareProfitUser(totalConsumption);
            _burn(owner,balanceOf(owner));
        }

        //Konsumsi = Produksi
        else{
            _shareProfitUser(totalProduction);
        }

        requestLoadPool=0;
        takenRequestPool=0;
    }

    function _shareProfitUser(uint256 _DivideTotal) internal{
        require((balanceOfIDR(owner) > 0 && counterUsers > 0),"Owner doesn't have enough balance ");

        //Mengambil data profit yang dikumpulkan dari setiap tagihan


            uint256 allProfit=balanceOfIDR(owner);


        for (uint i = 1; i <= counterUsers; i++){

            //Memeriksa bukti produksi
            uint256 currentProduction = balanceOf(users[i]);
                //Jika terdapat bukti produksi
                if (currentProduction > 0){
                //kalkulasi profit yang didapatkan berdasarkan produksi
                uint256 amount = (allProfit * currentProduction) / _DivideTotal;

                //Mengirim profit ke producer
                _transferProfit(amount,users[i]);

                //Membakar bukti produksi setelah producer menerima profit
                _burn(users[i],currentProduction);
                }
        }
    }

    function _transferProfit(uint256 _Profit, address _UserAddress) internal{

        //Mengirim profit dari alamat admin ke producer
        _transferIDR(owner,_UserAddress,_Profit);

        emit LogPayRevenue(_UserAddress,_Profit,now);
    }

//******************************View function***************************************

    function getAllRequest() public view returns(uint256,uint256){
        return(requestLoadPool,takenRequestPool);
    }

    function getMaxConProdCap() public view returns(uint256,uint256){
        return(maxConsumptionCapacity,maxProductionCapacity);
    }

    function getCirculateIDR() public view returns(uint256){
        return totalSupplyIDR();
    }

    function getTotalConProdPrevious() public view returns(uint256,uint256){
        return(totalConsumption,totalProduction);
    }

//*****************************Check All User***************************************
    function checkActive() public{
        delete userCheck;
        require(userCheck.length==0);

        for (uint i = 1; i <= counterUsers; i++){
            if (isUser[users[i]] == true){
                userCheck.push(users[i]);
            }
        }
    }

    function getCheckActive() public view returns (uint256,address[] memory){
        return(userCheck.length,userCheck);
    }

    function checkUser(address _UserAddress) public view returns(string memory){
        if((isUser[_UserAddress]) && (_UserAddress ==owner)){
            return "Owner";
        }
        else if((isUser[_UserAddress]) && (_UserAddress != owner)){
            return "Registered User";
        }
        else{
            return "Not Registered";
        }
    }

    function changeOwner(address _NewOwner,bytes32 _PIN) public onlyOwner{

        createUser(_NewOwner,_PIN);
        owner=_NewOwner;

        emit LogChangeOwner(msg.sender, _NewOwner, now);

    }

    function checkPINInput(address _UserAddress, bytes32 _PIN) public view returns(string memory){
        if(userPIN[_UserAddress] == _PIN){
            return "True";
        }
        else{
            return "False";
        }
    }
}
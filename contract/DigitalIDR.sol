pragma solidity ^0.6.3;

//Kontrak IDR Coin
import "SafeMath.sol";
import "Address.sol";
import "Context.sol";

contract Digital_IDR is Context{
    using SafeMath for uint256;
    using Address for address;
    
    mapping (address => uint256) private _balancesIDR;

    mapping (address => mapping (address => uint256)) private _allowancesIDR;

    uint256 private _totalSupplyIDR;

    string private _nameIDR;
    string private _symbolIDR;
    uint8 private _decimalsIDR;
    
    
    event ApprovalIDR(address indexed owner, address indexed spender, uint256 value);
    event TransferIDR(address indexed from, address indexed to, uint256 value);
    
    constructor () public{
        _nameIDR = "DigitalIDR";
        _symbolIDR = "IDRC";
        _decimalsIDR = 18;
        
    }
    
    

    function nameIDR() internal view returns (string memory) {
        return _nameIDR;
    }


    function symbolIDR() internal view returns (string memory) {
        return _symbolIDR;
    }

    function decimalsIDR() internal view returns (uint8) {
        return _decimalsIDR;
    }

    function totalSupplyIDR() internal view  returns (uint256) {
        return _totalSupplyIDR;
    }


    function balanceOfIDR(address account) internal view  returns (uint256) {
        return _balancesIDR[account];
    }


    function transferIDR(address recipient, uint256 amount) internal virtual  returns (bool) {
        _transferIDR(_msgSender(), recipient, amount);
        return true;
    }


    function allowanceIDR(address owner, address spender) internal view virtual  returns (uint256) {
        return _allowancesIDR[owner][spender];
    }


    function approveIDR(address spender, uint256 amount) internal virtual  returns (bool) {
        _approveIDR(_msgSender(), spender, amount);
        return true;
    }


    function transferFromIDR(address sender, address recipient, uint256 amount) internal virtual  returns (bool) {
        _transferIDR(sender, recipient, amount);
        _approveIDR(sender, _msgSender(), _allowancesIDR[sender][_msgSender()].sub(amount, "IDR Coin: transfer amount exceeds allowance"));
        return true;
    }


    function increaseAllowanceIDR(address spender, uint256 addedValue) internal virtual returns (bool) {
        _approveIDR(_msgSender(), spender, _allowancesIDR[_msgSender()][spender].add(addedValue));
        return true;
    }


    function decreaseAllowanceIDR(address spender, uint256 subtractedValue) internal virtual returns (bool) {
        _approveIDR(_msgSender(), spender, _allowancesIDR[_msgSender()][spender].sub(subtractedValue, "IDR Coin: decreased allowance below zero"));
        return true;
    }


    function _transferIDR(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "IDR Coin: transfer from the zero address");
        require(recipient != address(0), "IDR Coin: transfer to the zero address");

        _beforeTokenTransferIDR(sender, recipient, amount);

        _balancesIDR[sender] = _balancesIDR[sender].sub(amount, "IDR Coin: transfer amount exceeds balance");
        _balancesIDR[recipient] = _balancesIDR[recipient].add(amount);
        emit TransferIDR(sender, recipient, amount);
    }


    function _mintIDR(address account, uint256 amount) internal virtual {
        require(account != address(0), "IDR Coin: mint to the zero address");

        _beforeTokenTransferIDR(address(0), account, amount);

        _totalSupplyIDR = _totalSupplyIDR.add(amount);
        _balancesIDR[account] = _balancesIDR[account].add(amount);
        emit TransferIDR(address(0), account, amount);
    }

    function _burnIDR(address account, uint256 amount) internal virtual {
        require(account != address(0), "IDR Coin: burn from the zero address");

        _beforeTokenTransferIDR(account, address(0), amount);

        _balancesIDR[account] = _balancesIDR[account].sub(amount, "IDR Coin: burn amount exceeds balance");
        _totalSupplyIDR = _totalSupplyIDR.sub(amount);
        emit TransferIDR(account, address(0), amount);
    }


    function _approveIDR(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "IDR Coin: approve from the zero address");
        require(spender != address(0), "IDR Coin: approve to the zero address");

        _allowancesIDR[owner][spender] = amount;
        emit ApprovalIDR(owner, spender, amount);
    }


    function _setupDecimalsIDR(uint8 decimals_) internal {
        require(!address(this).isContract(), "IDR Coin: decimals cannot be changed after construction");
        _decimalsIDR = decimals_;
    }


    function _beforeTokenTransferIDR(address from, address to, uint256 amount) internal virtual { }

}
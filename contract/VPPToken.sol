pragma solidity ^0.6.3;
//kontrak VPP Token

import "Context.sol";
import "SafeMath.sol";
import "Address.sol";


contract VPPToken is Context {
    using SafeMath for uint256;
    using Address for address;

    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor () public {
        _name = "VPP";
        _symbol = "VPP";
        _decimals = 18;
    }


    function name() internal view returns (string memory) {
        return _name;
    }


    function symbol() internal view returns (string memory) {
        return _symbol;
    }

    function decimals() internal view returns (uint8) {
        return _decimals;
    }

    function totalSupply() internal view  returns (uint256) {
        return _totalSupply;
    }


    function balanceOf(address account) internal view  returns (uint256) {
        return _balances[account];
    }


    function transfer(address recipient, uint256 amount) internal virtual  returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }


    function allowance(address owner, address spender) internal view virtual  returns (uint256) {
        return _allowances[owner][spender];
    }


    function approve(address spender, uint256 amount) internal virtual  returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }


    function transferFrom(address sender, address recipient, uint256 amount) internal virtual  returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "VPP Coin: transfer amount exceeds allowance"));
        return true;
    }


    function increaseAllowance(address spender, uint256 addedValue) internal virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }


    function decreaseAllowance(address spender, uint256 subtractedValue) internal virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue, "VPP Coin: decreased allowance below zero"));
        return true;
    }


    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "VPP Coin: transfer from the zero address");
        require(recipient != address(0), "VPP Coin: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        _balances[sender] = _balances[sender].sub(amount, "VPP Coin: transfer amount exceeds balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }


    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "VPP Coin: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply = _totalSupply.add(amount);
        _balances[account] = _balances[account].add(amount);
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "VPP Coin: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        _balances[account] = _balances[account].sub(amount, "VPP Coin: burn amount exceeds balance");
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }


    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "VPP Coin: approve from the zero address");
        require(spender != address(0), "VPP Coin: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }


    function _setupDecimals(uint8 decimals_) internal {
        require(!address(this).isContract(), "VPP Coin: decimals cannot be changed after construction");
        _decimals = decimals_;
    }


    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual { }
}

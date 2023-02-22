// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract Vault is Ownable, AccessControlEnumerable {
    IERC20 private token;
    uint256 public maxWithdrawAmount;
    bool public withdrawEnable;
    using SafeERC20 for IERC20;

    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    function setWithdrawEnable(bool _isEnable) external onlyOwner {
        withdrawEnable = _isEnable;
    }

    function setMaxWithdrawAmount(uint256 _maxAmount) external onlyOwner {
        maxWithdrawAmount = _maxAmount;
    }

    function setToken(IERC20 _token) external onlyOwner {
        token = _token;
    }

    modifier onlyWithdrawer() {
        require(
            hasRole(WITHDRAWER_ROLE, _msgSender()),
            "Caller is not a withdrawer"
        );
        _;
    }

    constructor() {
        address owner = _msgSender();
        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(WITHDRAWER_ROLE, owner);
    }

    function withdraw(uint256 _amount, address _to) external onlyWithdrawer {
        require(withdrawEnable, "Withdraw is not available");
        require(_amount <= maxWithdrawAmount, "Exceed maximum amount");
        token.safeTransfer(_to, _amount);
    }

    function deposit(uint256 _amount) external {
        address _sender = _msgSender();
        require(
            token.balanceOf(_sender) >= _amount,
            "Insufficient account balance"
        );
        token.safeTransferFrom(_sender, address(this), _amount);
    }
}

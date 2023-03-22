// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./libraries/Roles.sol";
import "./libraries/Constants.sol";

contract FLPCrowdsale is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
	using SafeMathUpgradeable for uint256;

    uint256 private token_rate;
    uint256 private native_rate;
    address public receiver_address;
    IERC20Upgradeable public payment_token;
    IERC20Upgradeable public ico_token;


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint _nativeRate,
        uint _tokenRate,
        address _paymentToken,
        address _receiver,
        address _icoToken
    ) public initializer {
        native_rate = _nativeRate;
        token_rate = _tokenRate;
        payment_token = IERC20Upgradeable(_paymentToken);
        receiver_address = _receiver;
        ico_token = IERC20Upgradeable(_icoToken);
        __AccessControl_init();
        __UUPSUpgradeable_init();
        address sender = _msgSender();

        _grantRole(DEFAULT_ADMIN_ROLE, sender);
        _grantRole(Roles.PAUSER_ROLE, sender);
        _grantRole(Roles.UPGRADER_ROLE, sender);
        _grantRole(Roles.WITHDRAWER_ROLE, sender);
    }

    event PaymentTokenChanged(IERC20Upgradeable _newToken);
    event TokenRateChanged(uint256 _newTokenRate);
    event NativeRateChanged(uint256 _newNativeRate);
    event ReceiverAddressChanged(address _newReceiver);
    event ICOTokenChanged(IERC20Upgradeable _newToken);

    function pause() public onlyRole(Roles.PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(Roles.PAUSER_ROLE) {
        _unpause();
    }

    function setPaymentToken(
        IERC20Upgradeable _newToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        payment_token = _newToken;
        emit PaymentTokenChanged(_newToken);
    }
    function setIcoToken(
        IERC20Upgradeable _newToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ico_token = _newToken;
        emit ICOTokenChanged(_newToken);
    }

    function setNativeRate(
        uint256 _nativeRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        native_rate = _nativeRate;
        emit NativeRateChanged(_nativeRate);
    }

    function setTokenRate(
        uint256 _tokenRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        token_rate = _tokenRate;
        emit TokenRateChanged(_tokenRate);
    }

    function setReceiverAddress(
        address _receiver
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        receiver_address = _receiver;
        emit ReceiverAddressChanged(_receiver);
    }

    function withdrawNative() external onlyRole(Roles.WITHDRAWER_ROLE) {
        uint balance = address(this).balance;
        require(balance > 0, "Withdraw: Balance is zero");
        (bool sent, ) = payable(msg.sender).call{value: balance}("");
        require(sent, "Failed to sent");
    }

    function withdrawToken() external onlyRole(Roles.WITHDRAWER_ROLE) {
        uint256 amountToken = payment_token.balanceOf(address(this));
        require(amountToken > 0, "Withdraw: Token's amount is zero");
        payment_token.safeTransfer(_msgSender(), amountToken);
    }

    function buyByNative() external payable whenNotPaused {
        uint256 _nativeAmount = msg.value;
        (bool success, uint256 amountICOToken) = _getICOTokenAmount(
            address(0),
            _nativeAmount
        );
        assert(success);
        require(amountICOToken > 0, "Amount is zero");
        require(
            ico_token.balanceOf(address(this)) >= amountICOToken,
            "Insufficient account balance"
        );
        (bool sent, ) = payable(receiver_address).call{value: _nativeAmount}(
            ""
        );
        require(sent, "Failed to sent");
        ico_token.safeTransfer(_msgSender(), amountICOToken);
    }

    function buyByToken(uint256 _paymentAmount) external whenNotPaused {
        address caller = _msgSender();
        require(
            payment_token.balanceOf(caller) >= _paymentAmount,
            "Insufficient account balance"
        );
        (bool success, uint256 amountICOToken) = _getICOTokenAmount(
            address(payment_token),
            _paymentAmount
        );
        assert(success);
        require(amountICOToken > 0, "Amount is zero");
        require(
            ico_token.balanceOf(address(this)) >= amountICOToken,
            "Insufficient account balance"
        );
        payment_token.safeTransferFrom(caller, receiver_address, _paymentAmount);
        ico_token.safeTransfer(caller, amountICOToken);
    }

    function _getICOTokenAmount(
        address _payment,
        uint256 _paymentAmount
    ) internal view returns (bool success, uint256 value) {
        if (_payment == address(0)) {
            return (true, _paymentAmount.div(getNativeRate()));
        } else if (_payment == address(payment_token)) {
            return (true, _paymentAmount.div(getTokenRate()));
        } else {
            return (false, 0);
        }
    }
	function getNeededAmount(address _payment, uint _icoAmount) public view returns (bool success, uint256 value){
        if (_payment == address(0)) {
            return (true, _icoAmount.mul(getNativeRate()));
        } else if (_payment == address(payment_token)) {
            return (true, _icoAmount.mul(getTokenRate()));
        } else {
            return (false, 0);
        }
	}

	function getNativeRate() public view returns (uint256){
		return native_rate.div(Constant.PERCENTAGE_FRACTION);
	}
	
	function getTokenRate() public view returns (uint256){
		return token_rate.div(Constant.PERCENTAGE_FRACTION);
	}
    receive() external payable {}

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(Roles.UPGRADER_ROLE) {}
}

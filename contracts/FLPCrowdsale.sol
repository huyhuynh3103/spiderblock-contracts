// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/Roles.sol";

contract FLPCrowdsale is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    uint256 public constant PERCENTAGE_FRACTION = 10_000;
    uint256 public token_rate;
    uint256 public native_rate;
    address public receiver_address;
    IERC20 public payment_token;
    IERC20 public ico_token;

    using SafeERC20 for IERC20;

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
        payment_token = IERC20(_paymentToken);
        receiver_address = _receiver;
        ico_token = IERC20(_icoToken);
        __AccessControl_init();
        __UUPSUpgradeable_init();
        address sender = _msgSender();

        _grantRole(DEFAULT_ADMIN_ROLE, sender);
        _grantRole(Roles.PAUSER_ROLE, sender);
        _grantRole(Roles.UPGRADER_ROLE, sender);
        _grantRole(Roles.WITHDRAWER_ROLE, sender);
    }

    event PaymentTokenChanged(IERC20 _newToken);
    event TokenRateChanged(uint256 _newTokenRate);
    event NativeRateChanged(uint256 _newNativeRate);
    event ReceiverAddressChanged(address _newReceiver);

    function pause() public onlyRole(Roles.PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(Roles.PAUSER_ROLE) {
        _unpause();
    }

    function setPaymentToken(
        IERC20 _newToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        payment_token = _newToken;
        emit PaymentTokenChanged(_newToken);
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
        (bool success, uint256 amountICOToken) = getICOTokenAmount(
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

    function buyByToken(uint256 _amount) external whenNotPaused {
        address caller = _msgSender();
        require(
            payment_token.balanceOf(caller) >= _amount,
            "Insufficient account balance"
        );
        (bool success, uint256 amountICOToken) = getICOTokenAmount(
            address(payment_token),
            _amount
        );
        assert(success);
        require(amountICOToken > 0, "Amount is zero");
        require(
            ico_token.balanceOf(address(this)) >= amountICOToken,
            "Insufficient account balance"
        );
        payment_token.safeTransferFrom(caller, receiver_address, _amount);
        ico_token.safeTransfer(caller, amountICOToken);
    }

    function getICOTokenAmount(
        address _payment,
        uint256 _amount
    ) public view returns (bool success, uint256 value) {
        if (_payment == address(0)) {
            return (true, (_amount / native_rate) * PERCENTAGE_FRACTION);
        } else if (_payment == address(payment_token)) {
            return (true, (_amount / token_rate) * PERCENTAGE_FRACTION);
        } else {
            return (false, 0);
        }
    }

    receive() external payable {}

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(Roles.UPGRADER_ROLE) {}
}

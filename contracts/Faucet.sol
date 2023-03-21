// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/Roles.sol";
import "./libraries/Constants.sol";

contract Faucet is Initializable, AccessControlUpgradeable, UUPSUpgradeable {

    using SafeERC20Upgradeable for IERC20Upgradeable;
    IERC20Upgradeable public faucet_token;
	uint public mint_amount;
	mapping(address => uint) last_fauceting;
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        IERC20Upgradeable _token,
        uint _mintAmount
    ) public initializer {

		faucet_token = _token;
		mint_amount = _mintAmount;

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(Roles.UPGRADER_ROLE, msg.sender);
	}

    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override {}

	function createFaucet() external {
		address sender = _msgSender();
		uint lastUpdated = last_fauceting[sender];
		require(block.timestamp - lastUpdated > Constant.DAY_IN_TIMESTAMP, "Already faucet in same day");
		(bool success, ) = address(faucet_token).call(abi.encodeWithSignature("mint(address,uint256)", sender, mint_amount));
		if(!success){
			revert("Mint failed");
		}
		last_fauceting[sender] = block.timestamp;
	}

	function setFaucetToken(IERC20Upgradeable _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
		faucet_token = _token;
	}

	function setMintAmount(uint _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
		mint_amount = _amount;
	}
}
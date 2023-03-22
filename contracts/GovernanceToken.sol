// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./libraries/Roles.sol";

contract GovernanceToken is
    Initializable,
    ERC20Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    UUPSUpgradeable
{

    function initialize(
		string calldata _tokenName,
		string calldata _tokenSymbol
	) public initializer {
        __Pausable_init_unchained();
        __AccessControl_init_unchained();
        __UUPSUpgradeable_init_unchained();
        __ERC20Permit_init_unchained(_tokenName);
        __ERC20_init_unchained(_tokenName, _tokenSymbol);

        address sender = _msgSender();

        _grantRole(Roles.PAUSER_ROLE, sender);
        _grantRole(Roles.MINTER_ROLE, sender);
        _grantRole(Roles.UPGRADER_ROLE, sender);
        _grantRole(DEFAULT_ADMIN_ROLE, sender);

        _mint(sender, 100_000_000 * 10 ** decimals());
    }

    function pause() external onlyRole(Roles.PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(Roles.PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) external onlyRole(Roles.MINTER_ROLE) {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(Roles.UPGRADER_ROLE) {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library Roles {
	bytes32 internal constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
	bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
	bytes32 internal constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
}

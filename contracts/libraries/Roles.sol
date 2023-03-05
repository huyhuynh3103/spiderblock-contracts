// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library Roles {
    bytes32 internal constant UPGRADER_ROLE =
        0x189ab7a9244df0848122154315af71fe140f3db0fe014031783b0946b8c9d2e3;
    bytes32 internal constant PAUSER_ROLE =
        0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a;
    bytes32 internal constant WITHDRAWER_ROLE =
        0x10dac8c06a04bec0b551627dad28bc00d6516b0caacd1c7b345fcdb5211334e4;
    bytes32 internal constant MINTER_ROLE =
        0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6;
}

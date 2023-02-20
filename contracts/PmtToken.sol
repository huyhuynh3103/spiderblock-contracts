// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract PmtToken {
    mapping (address => uint) private _minterToLastUpdated;
    uint public MINT_TIME;
    constructor(uint _mintTime) {
        MINT_TIME = _mintTime;
    }
}
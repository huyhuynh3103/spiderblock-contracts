/**
 *Submitted for verification at BscScan.com on 2023-03-15
 */

/*
___  ___     _       ______ _ _       
|  \/  |    | |      |  ___| (_)      
| .  . | ___| |_ __ _| |_  | |_ _ __  
| |\/| |/ _ \ __/ _` |  _| | | | '_ \ 
| |  | |  __/ || (_| | |   | | | |_) |
\_|  |_/\___|\__\__,_\_|   |_|_| .__/ 
                               | |    
                               |_|  

*/

// SPDX-License-Identifier: MIT

// File:

pragma solidity ^0.8.17;

contract ContractWithReflectToOwners {
    function reflectToOwners(uint256) public payable {}
}

interface IReflectingContract {
    function reflectToOwners() external payable;
}

// File:

pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MetaFlip is Ownable, VRFConsumerBaseV2, ReentrancyGuard {
    VRFCoordinatorV2Interface COORDINATOR;
    LinkTokenInterface LINKTOKEN;
    address payable externalAddress;
    address payable marketAddress;
    address payable devAddress;
    address payable artistAddress;
    address payable modAddress;

    /* Storage:
     ***********/

    address constant vrfCoordinator =
        0xc587d9053cd1118f25F645F9E08BB98c9712A4EE;
    address constant link_token_contract =
        0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    bytes32 constant keyHash =
        0xba6e730de88d94a5510ae6613898bfb0c3de5d16e609c5b7da808747125506f7;
    uint16 constant requestConfirmations = 3;
    uint32 constant callbackGasLimit = 1e5;
    uint32 constant numWords = 1;
    uint64 subscriptionId;
    uint256 private contractBalance;

    IReflectingContract reflectingContract =
        IReflectingContract(0xf262Dc22ca5B2f1F4Ba5FefA6453Ff1c030A99b2);

    struct Temp {
        uint256 id;
        uint256 result;
        address playerAddress;
    }

    struct PlayerByAddress {
        uint256 balance;
        uint256 betAmount;
        uint256 betChoice;
        address playerAddress;
        bool betOngoing;
        uint256 finalAmount;
    }

    mapping(address => PlayerByAddress) public playersByAddress; //to check who is the player
    mapping(uint256 => Temp) public temps; //to check who is the sender of a pending bet by Id

    /* Events:
     *********/

    event DepositToContract(
        address user,
        uint256 depositAmount,
        uint256 newBalance
    );
    event Withdrawal(address player, uint256 amount);
    event NewIdRequest(address indexed player, uint256 requestId);
    event GeneratedRandomNumber(uint256 requestId, uint256 randomNumber);
    event BetResult(address indexed player, bool victory, uint256 amount);

    /* Constructor:
     **************/

    constructor(
        uint64 _subscriptionId,
        address payable _externalAddress,
        address payable _marketAddress,
        address payable _devAddress,
        address payable _artistAddress,
        address payable _modAddress
    ) payable initCosts(0.01 ether) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        LINKTOKEN = LinkTokenInterface(link_token_contract);
        subscriptionId = _subscriptionId;
        contractBalance += msg.value;
        externalAddress = _externalAddress;
        marketAddress = _marketAddress;
        devAddress = _devAddress;
        artistAddress = _artistAddress;
        modAddress = _modAddress;
    }

    /* Modifiers:
     ************/

    modifier initCosts(uint256 initCost) {
        require(msg.value >= initCost, "Contract needs some ETH.");
        _;
    }

    modifier betConditions() {
        require(
            msg.value >= 0.001 ether,
            "Insuffisant amount, please increase your bet!"
        );
        require(
            msg.value <= getContractBalance() / 5,
            "Can't bet more than 20% the contract's balance!"
        );
        require(
            !playersByAddress[msg.sender].betOngoing,
            "Bet already ongoing with this address"
        );
        _;
    }

    /* Functions:
     *************/

    function bet(uint256 _betChoice) public payable betConditions nonReentrant {
        require(_betChoice == 0 || _betChoice == 1, "Must be either 0 or 1");

        playersByAddress[msg.sender].playerAddress = msg.sender;
        playersByAddress[msg.sender].betChoice = _betChoice;
        playersByAddress[msg.sender].betOngoing = true;

        // Calculate the after tax amount and the tax amount
        uint256 betAmount = msg.value - ((msg.value * 3) / 100);
        uint256 nftAmount = msg.value - ((msg.value * 97) / 100);
        uint256 taxAmount = msg.value - ((msg.value * 90) / 100);
        uint256 finalAmount = msg.value - taxAmount - (nftAmount * 5);
        playersByAddress[msg.sender].betAmount = betAmount;
        playersByAddress[msg.sender].finalAmount = finalAmount;
        contractBalance += playersByAddress[msg.sender].finalAmount;

        uint256 requestId = requestRandomWords();
        temps[requestId].playerAddress = msg.sender;
        temps[requestId].id = requestId;

        emit NewIdRequest(msg.sender, requestId);

        // Send the tax amount to the external addresses
        externalAddress.transfer(taxAmount);
        marketAddress.transfer(nftAmount);
        devAddress.transfer(nftAmount);
        artistAddress.transfer(nftAmount);
        modAddress.transfer(nftAmount);
        reflectingContract.reflectToOwners{value: nftAmount}();
    }

    /// @notice Assumes the subscription is funded sufficiently.
    function requestRandomWords() public returns (uint256) {
        return
            COORDINATOR.requestRandomWords(
                keyHash,
                subscriptionId,
                requestConfirmations,
                callbackGasLimit,
                numWords
            );
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        uint256 randomResult = _randomWords[0] % 2;
        temps[_requestId].result = randomResult;

        checkResult(randomResult, _requestId);
        emit GeneratedRandomNumber(_requestId, randomResult);
    }

    function checkResult(
        uint256 _randomResult,
        uint256 _requestId
    ) private returns (bool) {
        address player = temps[_requestId].playerAddress;
        bool win = false;
        uint256 amountWon = 0;
        if (playersByAddress[player].betChoice == _randomResult) {
            win = true;
            amountWon = playersByAddress[player].betAmount * 2;
            playersByAddress[player].balance =
                playersByAddress[player].balance +
                amountWon;
            contractBalance -= amountWon;
        }

        emit BetResult(player, win, amountWon);

        playersByAddress[player].betAmount = 0;
        playersByAddress[player].finalAmount = 0;
        playersByAddress[player].betOngoing = false;
        delete (temps[_requestId]);
        return win;
    }

    function clearPlayerCache(address playerAddress) public {
        playersByAddress[playerAddress].betAmount = 0;
        playersByAddress[playerAddress].finalAmount = 0;
        playersByAddress[playerAddress].betOngoing = false;
    }

    function deposit() external payable {
        require(msg.value > 0);
        contractBalance += msg.value;
        emit DepositToContract(msg.sender, msg.value, contractBalance);
    }

    function depositExt() external payable {
        require(msg.value > 0);
    }

    receive() external payable {}

    function withdrawPlayerBalance() external nonReentrant {
        require(msg.sender != address(0), "This address doesn't exist.");
        require(
            playersByAddress[msg.sender].balance > 0,
            "You don't have any fund to withdraw."
        );
        require(
            !playersByAddress[msg.sender].betOngoing,
            "This address still has an open bet."
        );

        uint256 amount = playersByAddress[msg.sender].balance;
        payable(msg.sender).transfer(amount);
        delete (playersByAddress[msg.sender]);

        emit Withdrawal(msg.sender, amount);
    }

    /* View functions:
     *******************/

    function getPlayerBalance() external view returns (uint256) {
        return playersByAddress[msg.sender].balance;
    }

    function getContractBalance() public view returns (uint256) {
        return contractBalance;
    }

    function getMinimumBet() public view returns (uint256) {
        return contractBalance / 5;
    }

    /* PRIVATE :
     ***********/

    function withdrawContractBalance() external onlyOwner {
        _payout(payable(msg.sender));
        if (LINKTOKEN.balanceOf(address(this)) > 0) {
            bool isSuccess = LINKTOKEN.transfer(
                msg.sender,
                LINKTOKEN.balanceOf(address(this))
            );
            require(isSuccess, "Link withdraw failed");
        }
    }

    function addConsumer(address consumerAddress) external onlyOwner {
        COORDINATOR.addConsumer(subscriptionId, consumerAddress);
    }

    function removeConsumer(address consumerAddress) external onlyOwner {
        // Remove a consumer contract from the subscription.
        COORDINATOR.removeConsumer(subscriptionId, consumerAddress);
    }

    function cancelSubscription(
        address receivingWallet
    ) external onlyOwner nonReentrant {
        // Cancel the subscription and send the remaining LINK to a wallet address.
        COORDINATOR.cancelSubscription(subscriptionId, receivingWallet);
        subscriptionId = 0;
    }

    function _payout(address payable to) private returns (uint256) {
        require(contractBalance != 0, "No funds to withdraw");

        uint256 toTransfer = address(this).balance;
        contractBalance = 0;
        to.transfer(toTransfer);
        return toTransfer;
    }

    function withdrawDividends() public payable onlyOwner {
        (bool os, ) = payable(msg.sender).call{
            value: (address(this).balance * 3) / 100
        }("");
        contractBalance -= msg.value;
        require(os);
    }

    function setExternalAddress(
        address payable _externalAddress
    ) public onlyOwner {
        externalAddress = _externalAddress;
    }

    function setMarketAddress(address payable _marketAddress) public onlyOwner {
        marketAddress = _marketAddress;
    }

    function setDevAddress(address payable _devAddress) public onlyOwner {
        devAddress = _devAddress;
    }

    function setArtistAddress(address payable _artistAddress) public onlyOwner {
        artistAddress = _artistAddress;
    }

    function setModAddress(address payable _modAddress) public onlyOwner {
        modAddress = _modAddress;
    }

    function cancelGame() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: contractBalance}("");
        contractBalance -= msg.value;
        require(success);
    }

    function emergencyCancel() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        contractBalance -= msg.value > 0 ? msg.value : 0;
        require(success);
    }
}

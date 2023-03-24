// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./libraries/Roles.sol";
import "./libraries/Constants.sol";

contract Auction is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IERC721ReceiverUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC721Upgradeable public nft;
    IERC20Upgradeable public token;
    uint public constant AUCTION_SERVICE_FEE_RATE = 3; // Percentage by 10_000
    uint public constant MINIMUM_BID_RATE = 110; // Percentage by 10_000

    struct AuctionInfo {
        address auctioneer;
        uint256 tokenId;
        uint256 initialPrice;
        address previousBidder;
        uint256 lastBid;
        address lastBidder;
        uint256 startTime;
        uint256 endTime;
        bool completed;
        bool active;
        uint256 auctionId;
    }

    AuctionInfo[] private _auctions;

    modifier onlyAuctioneer(uint256 _auctionId) {
        require(
            _auctions[_auctionId].auctioneer == _msgSender() ||
                hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "Not auctioneer or admin"
        );
        _;
    }
    modifier validAuctionId(uint256 _auctionId) {
        require(_auctionId < _auctions.length, "Invalid auction id");
        _;
    }
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
	function initialize(
        IERC20Upgradeable _token,
        IERC721Upgradeable _nft
    ) public initializer {
        token = _token;
        nft = _nft;
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(Roles.UPGRADER_ROLE, msg.sender);
    }


    function createAuction(
        uint256 _tokenId,
        uint256 _initialPrice,
        uint256 _startTime,
        uint256 _endTime
    ) external {
        require(
            block.timestamp <= _startTime,
            "Auction can not start in the past"
        );
        require(_startTime < _endTime, "Auction can not end before it start");
        require(
            0 < _initialPrice,
            "Auction initial price can not be smaller than 0"
        );
        address _sender = _msgSender();
        nft.safeTransferFrom(_sender, address(this), _tokenId);
        AuctionInfo memory _auctionItem = AuctionInfo(
            _sender,
            _tokenId,
            _initialPrice,
            address(0),
            _initialPrice,
            address(0),
            _startTime,
            _endTime,
            false,
            true,
            _auctions.length
        );
        _auctions.push(_auctionItem);
    }

    function joinAuction(
        uint256 _auctionId,
        uint256 _bid
    ) external validAuctionId(_auctionId) {
        AuctionInfo memory _auctionItem = _auctions[_auctionId];
        require(
            block.timestamp >= _auctionItem.startTime,
            "Auction has not started"
        );
        require(_auctionItem.completed == false, "Auction is already ended");
        require(_auctionItem.active, "Auction is not active");
        uint256 _minBid = _auctionItem.lastBidder == address(0)
            ? _auctionItem.initialPrice
            : _auctionItem.lastBid.mul(MINIMUM_BID_RATE).div(
                Constant.PERCENTAGE_FRACTION
            );
        require(
            _bid >= _minBid,
            "Bid price must be greater than the minimum price"
        );
        address _sender = _msgSender();
        require(
            _auctionItem.auctioneer != _sender,
            "Auction owner cannot join"
        );

        // transfer token to contract
        token.safeTransferFrom(_sender, address(this), _bid);
        // refund token to the last bidder
        if (_auctionItem.lastBidder != address(0)) {
            token.safeTransfer(_auctionItem.lastBidder, _auctionItem.lastBid);
        }

        // update auction inf0 in memory
        _auctionItem.previousBidder = _auctionItem.lastBidder;
        _auctionItem.lastBidder = _sender;
        _auctionItem.lastBid = _bid;

        // update those changes to storage
        _auctions[_auctionId] = _auctionItem;
    }

    function endAuction(
        uint256 _auctionId
    ) external validAuctionId(_auctionId) onlyAuctioneer(_auctionId) {
        AuctionInfo memory _auctionItem = _auctions[_auctionId];
        require(_auctionItem.completed == false, "Auction is already ended");
        require(_auctionItem.active, "Auction is not active");

        // transfer nft to highest bidder
        nft.safeTransferFrom(
            address(this),
            _auctionItem.lastBidder,
            _auctionItem.tokenId
        );

        // calculate service fee
        uint256 profit = _auctionItem.lastBid.sub(_auctionItem.initialPrice);
        uint256 serviceFee = profit.mul(AUCTION_SERVICE_FEE_RATE).div(
            Constant.PERCENTAGE_FRACTION
        );
        uint256 auctioneerReceive = _auctionItem.lastBid.sub(serviceFee);

        // transfer token to auctioneer
        token.safeTransfer(_auctionItem.auctioneer, auctioneerReceive);

        // update info
        _auctionItem.completed = true;
        _auctionItem.active = false;
        _auctions[_auctionId] = _auctionItem;
    }

    function cancelAuction(
        uint256 _auctionId
    ) external validAuctionId(_auctionId) onlyAuctioneer(_auctionId) {
        AuctionInfo memory _auctionItem = _auctions[_auctionId];
        require(_auctionItem.completed == false, "Auction is already ended");
        require(_auctionItem.active, "Auction is not active");

        // Returns NFT to auctioneer
        nft.safeTransferFrom(
            address(this),
            _auctionItem.auctioneer,
            _auctionItem.tokenId
        );

        // Refunds token to previous bidder
        if (_auctionItem.lastBidder != address(0)) {
            token.safeTransfer(_auctionItem.lastBidder, _auctionItem.lastBid);
        }

        _auctionItem.completed = true;
        _auctionItem.active = false;
		_auctions[_auctionId] = _auctionItem;
    }

    function getAuction(
        uint256 _auctionId
    ) public view returns (AuctionInfo memory) {
        return _auctions[_auctionId];
    }

    function getAuctionByState(
        bool _active
    ) public view returns (AuctionInfo[] memory) {
        uint auctionsLength = _auctions.length;
        uint resultLength = 0;
        for (uint i = 0; i < auctionsLength; ) {
            unchecked {
                if (_auctions[i].active == _active) resultLength++;
                ++i;
            }
        }

        AuctionInfo[] memory results = new AuctionInfo[](resultLength);
        uint j = 0;
        for (uint256 i = 0; i < auctionsLength; ) {
            unchecked {
                if (_auctions[i].active == _active) {
                    results[j] = _auctions[i];
                    j++;
                }
                i++;
            }
        }
        return results;
    }
	
	function setNft(IERC721Upgradeable _nft) external onlyRole(DEFAULT_ADMIN_ROLE){
		nft = _nft;
	}
	function setToken(IERC20Upgradeable _token) external onlyRole(DEFAULT_ADMIN_ROLE){
		token = _token;
	}

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }
    
	
	function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(Roles.UPGRADER_ROLE) {}
}

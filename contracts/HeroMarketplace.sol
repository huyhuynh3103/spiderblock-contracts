// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "./libraries/Roles.sol";
import "./libraries/Constants.sol";


contract HeroMarketplace is IERC721ReceiverUpgradeable, Initializable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
	using SafeERC20Upgradeable for IERC20Upgradeable;
	 /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
	

	struct ListDetail {
		address payable author;
		uint256 price;
		uint256 tokenId;
	}
	
	event NFTListed(address indexed _from, uint256 _tokenId, uint256 _price);
	event NFTUnlisted(address indexed _from, uint256 _tokenId);
	event NFTBought(address indexed _from, uint256 _tokenId, uint256 _price);
	event PriceUpdated(uint256 _tokenId, uint256 _price);
	event TokenSetted(IERC20Upgradeable _token);
	event TaxSetted(uint256 _tax);
	event NFTSetted(IERC721EnumerableUpgradeable _nft);

	IERC20Upgradeable private token;
	IERC721EnumerableUpgradeable private nft;
	uint256 private tax;
	mapping(uint256 => ListDetail) public listDetail;

    function initialize(
		IERC20Upgradeable _token, 
		IERC721EnumerableUpgradeable _nft,
		uint256 _tax
	) public initializer {
		token = _token;
		nft = _nft;
		tax = _tax;
		address sender = msg.sender;
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, sender);
        _grantRole(Roles.PAUSER_ROLE, sender);
        _grantRole(Roles.UPGRADER_ROLE, sender);
		_grantRole(Roles.WITHDRAWER_ROLE, sender);
    }
	modifier onlyListed(uint _tokenId) {
		require(nft.ownerOf(_tokenId) == address(this), "This NFT doesn't listed");
		_;
	}
	modifier onlyNftAuthor(uint _tokenId) {
		require(listDetail[_tokenId].author == _msgSender(), "Only Nft owner can call");
		_;	
	}
	function setTax(uint256 _tax) external onlyRole(DEFAULT_ADMIN_ROLE) {
		tax = _tax;
		emit TaxSetted(_tax);
	}
	function setNFT(IERC721EnumerableUpgradeable _nft) external onlyRole(DEFAULT_ADMIN_ROLE) {
		nft = _nft;
		emit NFTSetted(_nft);
	}
	function setToken(IERC20Upgradeable _token) external onlyRole(DEFAULT_ADMIN_ROLE){
		token = _token;
		emit TokenSetted(_token);
	}
	function getListedNft() public view returns (ListDetail [] memory) {
		uint balance  = nft.balanceOf(address(this));
		ListDetail[] memory myNft = new ListDetail[](balance);
		for(uint i=0;i<balance;){
			myNft[i] = listDetail[nft.tokenOfOwnerByIndex(address(this), i)];
		}
		return myNft;
	}

	function listNft(uint256 _tokenId, uint256 _price) external {
		address sender = _msgSender();
		listDetail[_tokenId] = ListDetail(payable(sender), _price, _tokenId);
		nft.safeTransferFrom(sender,address(this), _tokenId);
		emit NFTListed(sender, _tokenId, _price);
	}

	function updatePrice(uint256 _tokenId, uint _price) external onlyListed(_tokenId) onlyNftAuthor(_tokenId) {
		listDetail[_tokenId].price = _price;
		emit PriceUpdated(_tokenId, _price);
	}

	function unlistNft(uint256 _tokenId) external onlyListed(_tokenId) onlyNftAuthor(_tokenId) {
		address sender = _msgSender();
		nft.safeTransferFrom(address(this), sender, _tokenId);
		emit NFTUnlisted(sender, _tokenId);
	}

	function buyNft(uint256 _tokenId, uint256 _price) external onlyListed(_tokenId) {
		address sender = _msgSender();
		require(token.balanceOf(sender) >= _price, "Insufficient account balance");
		ListDetail memory item = listDetail[_tokenId];
		require(item.price <= _price, "Minimum price has not been reached");
		token.safeTransferFrom(sender, address(this), _price);
		token.safeTransfer(item.author, _amountReceive(_tokenId));
		nft.safeTransferFrom(address(this), sender, _tokenId);
		emit NFTBought(sender, _tokenId, _price);
	}
	function withdrawNative() external onlyRole(Roles.WITHDRAWER_ROLE) {
		uint balance = address(this).balance;
		require(balance>0, "Withdraw: Balance is zero");
		(bool sent,) = payable(msg.sender).call{value: balance}("");
		require(sent, "Failed to sent");
	}
	function withdrawToken() external onlyRole(Roles.WITHDRAWER_ROLE) {
		uint256 amountToken = token.balanceOf(address(this));
		require(amountToken > 0, "Withdraw: Token's amount is zero");
		token.safeTransfer(_msgSender(), amountToken);
	}

	function _amountReceive(uint256 _tokenId) internal view returns(uint256) {
		return listDetail[_tokenId].price * _receivePercent();
	}
	function _receivePercent() internal view returns(uint256){
		return (100 - (tax / Constant.PERCENTAGE_FRACTION))/100;
	}

	function onERC721Received(address, address, uint256, bytes calldata) external override pure returns(bytes4) {
		return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
	}

    function pause() public onlyRole(Roles.PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(Roles.PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(Roles.UPGRADER_ROLE)
        override
    {}
}
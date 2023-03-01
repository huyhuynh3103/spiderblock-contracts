// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./libraries/Roles.sol";

contract Hero is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, ERC721URIStorageUpgradeable, PausableUpgradeable, AccessControlUpgradeable, UUPSUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
	string private _url;
    CountersUpgradeable.Counter private _tokenIdCounter;
	event Minted(address indexed _to, uint indexed hero_type, uint256 tokenId);
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
	
    function initialize() public initializer {
        __ERC721_init("Stickman Hero", "hero");
        __ERC721Enumerable_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(Roles.PAUSER_ROLE, msg.sender);
        _grantRole(Roles.MINTER_ROLE, msg.sender);
        _grantRole(Roles.UPGRADER_ROLE, msg.sender);
    }
    function pause() public onlyRole(Roles.PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(Roles.PAUSER_ROLE) {
        _unpause();
    }

    function safeMint(address _to, uint256 _heroType) public onlyRole(Roles.MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
		emit Minted(_to, _heroType, tokenId);
    }

	function listTokenIds(address owner) external view returns (uint256[] memory tokenIds) {
		uint balance = balanceOf(owner);
		uint256[] memory ids = new uint256[](balance);
		for(uint i = 0; i<balance;){
			ids[i] = tokenOfOwnerByIndex(owner, i);
			unchecked {
				++i;
			}
		}
		return ids;
	}

	function _baseURI() internal view override returns (string memory) {
		return _url;
	}

	function setBaseUrl(string memory _newUrl) external onlyRole(DEFAULT_ADMIN_ROLE) {
		_url = _newUrl;
	}

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        whenNotPaused
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
	function _burn(uint256 tokenId)
        internal
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
    {
        super._burn(tokenId);
    }
	function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(Roles.UPGRADER_ROLE)
        override
    {}


    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
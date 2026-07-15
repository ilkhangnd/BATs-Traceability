// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Full ERC-721 baseline for agricultural traceability comparison.
/// Each agricultural event or batch is minted as a distinct NFT with a metadata URI
/// (e.g., ipfs://... or epcis event URI).
contract FullERC721TraceabilityBaseline is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("BATS Traceability Event Baseline", "BATSEVT") Ownable(msg.sender) {}

    function logTraceabilityEvent(address to, string memory uri) external returns (uint256 tokenId) {
        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}

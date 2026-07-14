// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Research-only baselines. These contracts are deliberately minimal and
/// must not be presented as full production ERC-721 or EPCIS implementations.
contract DirectEventLogBaseline {
    mapping(bytes32 => uint64) public loggedAt;

    function logEvent(bytes32 eventHash) external {
        require(loggedAt[eventHash] == 0, "duplicate");
        loggedAt[eventHash] = uint64(block.timestamp);
    }
}

contract MinimalBatchTokenBaseline {
    mapping(uint256 => address) public ownerOf;
    uint256 public nextTokenId;

    function mintBatch() external returns (uint256 tokenId) {
        tokenId = ++nextTokenId;
        ownerOf[tokenId] = msg.sender;
    }
}

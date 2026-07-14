// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BATS daily EPCIS event root registry
/// @notice Stores only immutable audit evidence; operational data remains off-chain.
contract BATSAnchor {
    address public immutable owner;

    struct Anchor {
        bytes32 merkleRoot;
        string schemaVersion;
        uint64 anchoredAt;
    }

    mapping(bytes32 => Anchor) private anchors;

    event DailyRootAnchored(
        bytes32 indexed dateKey,
        string batchDate,
        bytes32 indexed merkleRoot,
        string schemaVersion,
        uint64 anchoredAt
    );

    error Unauthorized();
    error InvalidRoot();
    error DateAlreadyAnchored();

    constructor() {
        owner = msg.sender;
    }

    function anchorDailyRoot(
        bytes32 merkleRoot,
        string calldata batchDate,
        string calldata schemaVersion
    ) external {
        if (msg.sender != owner) revert Unauthorized();
        if (merkleRoot == bytes32(0)) revert InvalidRoot();
        bytes32 dateKey = keccak256(bytes(batchDate));
        if (anchors[dateKey].anchoredAt != 0) revert DateAlreadyAnchored();

        anchors[dateKey] = Anchor(merkleRoot, schemaVersion, uint64(block.timestamp));
        emit DailyRootAnchored(
            dateKey,
            batchDate,
            merkleRoot,
            schemaVersion,
            uint64(block.timestamp)
        );
    }

    function verifyRoot(bytes32 merkleRoot, string calldata batchDate)
        external
        view
        returns (bool)
    {
        return anchors[keccak256(bytes(batchDate))].merkleRoot == merkleRoot;
    }

    function getAnchor(string calldata batchDate) external view returns (Anchor memory) {
        return anchors[keccak256(bytes(batchDate))];
    }
}

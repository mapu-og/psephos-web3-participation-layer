// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================
// 🪙 MyToken - ERC20 with Voting Power
// ============================================================
//
// 🎓 LEARNING NOTES:
// ---------------------------------------------------------
// This token is special because it has "VOTING MEMORY" 🧠
//
// Regular ERC20: "How many tokens do you have NOW?"
// ERC20Votes:    "How many tokens did you have at block #12345?"
//
// WHY IS THIS IMPORTANT?
// Imagine Alice votes, then sends her tokens to Bob, and Bob votes.
// Without history, they could "double vote" with the same tokens!
// ERC20Votes prevents this by taking a "snapshot" when voting starts.
//
// ⚡ KEY CONCEPT: DELEGATION
// ---------------------------------------------------------
// Tokens DON'T automatically count as votes!
// You must "activate" them by calling delegate(yourAddress)
//
// Think of it like:
// 📦 Token = Voting ticket in your pocket
// 🗳️ Delegate = Putting the ticket in the ballot box
//
// ============================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MyToken is ERC20, ERC20Permit, ERC20Votes {
    // 🏗️ CONSTRUCTOR: The "Birth" of our token
    // Initial supply: 1,000,000 tokens (with 18 decimals)
    constructor()
        ERC20("GovernanceToken", "GOV") // Name & Symbol
        ERC20Permit("GovernanceToken") // Enables gasless approvals
    {
        // Mint all tokens to the deployer
        // They can then distribute to DAO members
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // ============================================================
    // 🔧 REQUIRED OVERRIDES
    // ============================================================
    // Because we inherit from multiple contracts that have the same
    // functions, we must tell Solidity which one to use.
    // This is like being a child of two parents who both have
    // different recipes for the same dish - you pick one!

    /**
     * @dev Hook called on every transfer (mint, burn, transfer)
     * ERC20Votes needs this to update the voting checkpoints
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /**
     * @dev Returns current nonce for gasless permits
     */
    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }

    /**
     * @dev Clock used for voting snapshots (uses block number)
     * Required by ERC6372 / ERC20Votes
     */
    function clock() public view override returns (uint48) {
        return uint48(block.number);
    }

    /**
     * @dev Returns the clock mode (block number based)
     * Required by ERC6372
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=blocknumber&from=default";
    }
}

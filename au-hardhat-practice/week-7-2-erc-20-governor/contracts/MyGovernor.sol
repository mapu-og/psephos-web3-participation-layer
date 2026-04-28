// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================
// ⚖️ MyGovernor - The Voting Machine
// ============================================================
//
// 🎓 LEARNING NOTES:
// ---------------------------------------------------------
// The Governor is like a VOTING MACHINE at an election center.
// It doesn't hold any money - it just counts votes and
// executes decisions that the community makes.
//
// THE GOVERNANCE LIFECYCLE:
// ---------------------------------------------------------
// 1. 📝 PROPOSE: Someone submits an idea
//    "Let's change the Box value to 42!"
//
// 2. ⏳ VOTING DELAY: Wait period before voting starts
//    (Gives people time to review the proposal)
//
// 3. 🗳️ VOTING PERIOD: Members cast votes (For/Against/Abstain)
//
// 4. ✅ CHECK: Did it pass? (Quorum met + Majority yes?)
//
// 5. 🚀 EXECUTE: The contract automatically calls the target
//
// ============================================================

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract MyGovernor is
    Governor, // 🏛️ Core voting logic
    GovernorSettings, // ⚙️ Configurable parameters
    GovernorCountingSimple, // 🔢 For/Against/Abstain counting
    GovernorVotes, // 🗳️ Uses our token for voting power
    GovernorVotesQuorumFraction // 📊 Quorum as % of total supply
{
    // ============================================================
    // 🏗️ CONSTRUCTOR
    // ============================================================
    //
    // PARAMETER CHEAT SHEET:
    // ---------------------------------------------------------
    // votingDelay:  1 block   = Wait 1 block before voting starts
    // votingPeriod: 50 blocks = ~10 minutes on testnet
    // quorum:       4%        = 4% of total supply must vote
    //
    // In production DAOs, these would be MUCH longer:
    // - Compound: 2-day delay, 3-day voting
    // - Uniswap: 4-day voting period
    //
    constructor(
        IVotes _token
    )
        Governor("MyGovernor")
        GovernorSettings(
            1, // votingDelay: 1 block
            50, // votingPeriod: 50 blocks (~10 min on testnet)
            0 // proposalThreshold: 0 tokens needed to propose
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
    {}

    // ============================================================
    // 🔧 REQUIRED OVERRIDES
    // ============================================================
    // OpenZeppelin's modular design means multiple contracts
    // define the same functions. We must resolve the conflicts.

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}

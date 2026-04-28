// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================
// 📦 Box - The DAO's Treasure Chest
// ============================================================
//
// 🎓 LEARNING NOTES:
// ---------------------------------------------------------
// This is a SIMPLE contract that the DAO will control.
// It stores a single number that only the OWNER can change.
//
// THE ANALOGY:
// ---------------------------------------------------------
// Imagine a SAFE DEPOSIT BOX at a bank 🏦
// - Only the key holder (owner) can open it
// - After deployment, we GIVE THE KEY to the Governor
// - Now the DAO members vote to decide what goes inside!
//
// WHY IS THIS USEFUL?
// ---------------------------------------------------------
// In real DAOs, this "Box" could be:
// - A Treasury holding ETH or tokens
// - A Settings contract (change fees, rates)
// - An Upgrade Controller (deploy new code)
//
// ============================================================

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
    // The value stored in the box
    uint256 private _value;

    // Event emitted when the value changes
    event ValueChanged(uint256 newValue);

    // 🏗️ CONSTRUCTOR
    // The deployer starts as owner, but we'll transfer
    // ownership to the Governor after deployment
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Stores a new value in the box
     * @param newValue The value to store
     *
     * 🔐 SECURITY: Only the owner (Governor) can call this!
     * Regular users trying to call this will get REJECTED.
     */
    function store(uint256 newValue) public onlyOwner {
        _value = newValue;
        emit ValueChanged(newValue);
    }

    /**
     * @dev Returns the stored value
     *
     * 📖 Anyone can READ the value (view function = free!)
     */
    function retrieve() public view returns (uint256) {
        return _value;
    }
}

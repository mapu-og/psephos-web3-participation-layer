// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title VendingMachineV2
 * @dev The upgraded version of our vending machine.
 * Adds administrative functions like withdrawing profit and setting a new owner.
 */
contract VendingMachineV2 is Initializable {
    uint public numSodas;
    address public owner;

    // We DO NOT re-initialize in V2 if V1 was already initialized.
    // The state (numSodas, owner) is already in the Proxy storage.

    function purchaseSoda() public payable {
        require(msg.value >= 1000 wei, "You must pay 1000 wei for a soda!");
        numSodas--;
    }

    /**
     * @dev New function: Withdraw all ETH collected in the contract.
     */
    function withdrawProfits() public onlyOwner {
        require(address(this).balance > 0, "Profits must be greater than 0");
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Failed to send ether");
    }

    /**
     * @dev New function: Change the owner.
     */
    function setNewOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title VendingMachineV1
 * @dev This is the first version of our upgradeable vending machine.
 * It uses the Initializable pattern instead of a constructor.
 */
contract VendingMachineV1 is Initializable {
    // State variables are stored in the Proxy's storage
    uint public numSodas;
    address public owner;

    /**
     * @dev initializer replaces the constructor.
     * It can only be called once.
     */
    function initialize(uint _numSodas) public initializer {
        numSodas = _numSodas;
        owner = msg.sender;
    }

    /**
     * @dev Simple purchase function. Cost is fixed at 1000 wei.
     */
    function purchaseSoda() public payable {
        require(msg.value >= 1000 wei, "You must pay 1000 wei for a soda!");
        numSodas--;
    }
}

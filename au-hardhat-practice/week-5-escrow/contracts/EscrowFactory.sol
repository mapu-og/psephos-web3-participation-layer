// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Escrow.sol";

contract EscrowFactory {
    struct EscrowInfo {
        address escrowAddress;
        address arbiter;
        address beneficiary;
        address depositor;
        uint256 value;
    }

    EscrowInfo[] public allEscrows;

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed depositor,
        uint256 value
    );

    function createEscrow(
        address _arbiter,
        address _beneficiary
    ) external payable {
        Escrow newEscrow = (new Escrow){value: msg.value}(
            _arbiter,
            _beneficiary
        );

        allEscrows.push(
            EscrowInfo({
                escrowAddress: address(newEscrow),
                arbiter: _arbiter,
                beneficiary: _beneficiary,
                depositor: msg.sender,
                value: msg.value
            })
        );

        emit EscrowCreated(address(newEscrow), msg.sender, msg.value);
    }

    function getEscrows() external view returns (EscrowInfo[] memory) {
        return allEscrows;
    }
}

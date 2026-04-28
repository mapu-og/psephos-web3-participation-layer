Prompts: 

I will continune with Ethereum Bootcamp, now I am in week65. I will copy and paste the practices, give the solutions here to copy and paste, and focus on my learning on a simply and didactic way, and uses analogies to explain the concepts. Remember to updtate the study notes as I go. Also put the code solutions here, then I can copy and paste them to the Alchemy University (AU) online editor to test them.

 save your quota, while keeping the didactic analogies and the comments in the code.

current section: Build an ERC-20

Asigment: Your Goal: Transfer Event

Given code: 
// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

contract Token {
    uint public totalSupply;
    string public name = "My Awesome Token";
    string public symbol = "MAT";
    uint8 public decimals = 18;

    mapping(address => uint) balances;

    constructor() {
        totalSupply = 1000 * (10 ** uint256(decimals));
        balances[msg.sender] = totalSupply;
    }

    function balanceOf(address account) external view returns (uint) {
        return balances[account];
    }
}

---


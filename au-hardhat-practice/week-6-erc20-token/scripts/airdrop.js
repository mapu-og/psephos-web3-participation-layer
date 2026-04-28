const { ethers } = require("hardhat");

async function main() {
    // 1. The Address of your already deployed GoofyGoober contract
    const GOOFY_GOOBER_ADDRESS = "0x431bBaa789116D4a132f9bb89d24B393aBb0Cf5E";

    // 2. The list of people who will receive the tokens (Recipients)
    // I used some example addresses here
    const recipients = [
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #2
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #3
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906"  // Account #4
    ];

    // 3. How much to send to each (1 GG token)
    const amountToEach = ethers.parseUnits("1.0", 18);

    // Get the contract instance
    const Token = await ethers.getContractAt("GoofyGoober", GOOFY_GOOBER_ADDRESS);

    console.log("Starting Airdrop...");

    // 4. The Loop: Send one by one
    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        console.log(`Sending ${ethers.formatUnits(amountToEach, 18)} GG to ${recipient}...`);

        // Perform the transfer
        const tx = await Token.transfer(recipient, amountToEach);

        // Wait for the transaction to be mined before moving to the next
        // This is important to avoid 'nonce' errors!
        await tx.wait();

        console.log(`Confirmed! Hash: ${tx.hash}`);
    }

    console.log("Airdrop Complete! 🚀");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

const { ethers } = require("hardhat");

async function main() {
    const BUCKET_ADDRESS = "0xa978c3bcafa79058e408a65ea5dfb7f3b800d0f8";
    const ERC20_ADDRESS = "0x431bBaa789116D4a132f9bb89d24B393aBb0Cf5E";
    const AMOUNT = ethers.parseUnits("10", 18); // Sending 10 tokens 

    const [signer] = await ethers.getSigners();
    console.log("Solving challenge with account:", signer.address);

    // 1. Attach to the ERC20 token using explicit ABI
    const erc20 = await ethers.getContractAt([
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ], ERC20_ADDRESS);

    // 2. Approve the Bucket contract to spend tokens
    console.log(`Approving Bucket contract to spend ${ethers.formatUnits(AMOUNT, 18)} tokens...`);
    const approveTx = await erc20.approve(BUCKET_ADDRESS, AMOUNT);
    console.log("Transaction sent, waiting for confirmation...");
    await approveTx.wait();
    console.log("Approved!");

    // 3. Call the drop function on the Bucket contract
    const Bucket = await ethers.getContractAt([
        "function drop(address erc20, uint amount) external"
    ], BUCKET_ADDRESS);

    console.log("Calling drop()...");
    const dropTx = await Bucket.drop(ERC20_ADDRESS, AMOUNT);
    const receipt = await dropTx.wait();

    console.log("Challenge completed! You are now a winner!");
    console.log("Transaction Hash:", receipt.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

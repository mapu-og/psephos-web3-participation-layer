const { ethers } = require("hardhat");
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);
}
main().catch(console.error);

const hre = require("hardhat");

async function main() {
    const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
    const factory = await EscrowFactory.deploy();

    await factory.deployed();

    console.log(`EscrowFactory deployed to: ${factory.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

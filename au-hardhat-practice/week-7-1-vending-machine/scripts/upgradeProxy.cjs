const { ethers, upgrades } = require('hardhat');

// REPLACEMENT REQUIRED: Put your proxy address here after deploying V1
const proxyAddress = "0x9D6ADB2a4524A036bd72b873C456cb8a0397D2AE";

async function main() {
    console.log("Upgrading Proxy to VendingMachineV2...");

    const VendingMachineV2 = await ethers.getContractFactory('VendingMachineV2');

    const upgraded = await upgrades.upgradeProxy(proxyAddress, VendingMachineV2);
    await upgraded.waitForDeployment();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log("--------------------------------------------------");
    console.log("Proxy (Address:", proxyAddress, ") upgraded to V2!");
    console.log("New Implementation Address: ", implementationAddress);
    console.log("--------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

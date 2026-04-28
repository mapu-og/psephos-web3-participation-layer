const { ethers, upgrades } = require('hardhat');

async function main() {
    console.log("Deploying VendingMachineV1...");

    const VendingMachineV1 = await ethers.getContractFactory('VendingMachineV1');

    // deployProxy(ContractFactory, [args for initialize], { initializer: 'initialize' })
    const proxy = await upgrades.deployProxy(VendingMachineV1, [100], { initializer: 'initialize' });
    await proxy.waitForDeployment();

    const proxyAddress = await proxy.getAddress();
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log("--------------------------------------------------");
    console.log("VendingMachineV1 deployed to:");
    console.log("Proxy Address: ", proxyAddress);
    console.log("Implementation Address: ", implementationAddress);
    console.log("--------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

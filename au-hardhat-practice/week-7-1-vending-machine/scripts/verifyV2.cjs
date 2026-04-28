const { ethers } = require("hardhat");

async function main() {
    const proxyAddress = "0x9D6ADB2a4524A036bd72b873C456cb8a0397D2AE";

    // We attach to the proxy address using the V2 interface
    const VendingMachineV2 = await ethers.getContractAt("VendingMachineV2", proxyAddress);

    console.log("Checking V2 functions on Proxy...");

    try {
        const owner = await VendingMachineV2.owner();
        console.log("Owner:", owner);

        const numSodas = await VendingMachineV2.numSodas();
        console.log("Num Sodas:", numSodas.toString());

        // Check if withdrawProfits exists
        console.log("Checking if 'withdrawProfits' exists...");
        const isV2 = typeof VendingMachineV2.withdrawProfits === "function";
        console.log("V2 functions present in ABI:", isV2);

    } catch (error) {
        console.error("Verification failed:", error.message);
    }
}

main().catch(console.error);

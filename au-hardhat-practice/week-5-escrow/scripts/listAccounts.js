async function main() {
    const accounts = await ethers.getSigners();
    console.log("Hardhat Accounts:");
    console.log("-----------------");
    for (let i = 0; i < 5; i++) {
        console.log(`Account #${i}: ${accounts[i].address}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

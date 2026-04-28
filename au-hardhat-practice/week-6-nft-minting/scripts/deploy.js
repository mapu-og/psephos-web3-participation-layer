import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const address = "0xd7BF912020F9673786cd102CE5139FE14fAc0052"; // Using the deployed contract
    const nft = await ethers.getContractAt("MyNFT", address);
    console.log("Using NFT Contract at:", address);

    // Mint the NFT!
    const metadataURI = "ipfs://bafkreicvt7blhb5eyzp7trtmcuyeu3sapysvsii7klbvivceptd523kwmu";
    console.log("Minting optimized NFT to:", deployer.address);

    const tx = await nft.mintNFT(deployer.address, metadataURI);
    await tx.wait();

    console.log("NFT Minted successfully!");
    console.log("Transaction Hash:", tx.hash);
    console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

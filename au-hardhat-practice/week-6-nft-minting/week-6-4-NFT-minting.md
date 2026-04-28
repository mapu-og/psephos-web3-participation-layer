How to Mint NFTs
In this guide, we'll be setting up a Hardhat repo to mint an NFT and then run a script to send it to a pre-defined list of public addresses - those of your friends or any random ones if you want!

Step 1: Set Up Project Structure Using Hardhat
Clone this repository locally: https://github.com/ChainShot/MintNFT
Open this project up in your IDE of choice
Create a .env file at the top-level of the project
Open the .env file and add in a SEPOLIA_URL. You can retrieve your API url from the Alchemy Dashboard.
Add a PRIVATE_KEY from a test Sepolia account that holds Sepolia ETH. You can grab Sepolia ETH from the Sepolia Faucet.
Your .env should look like this:

SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/---
PRIVATE_KEY=---
 Remember, these .env variables are used in the hardhat.config.js file, so if you run into any errors make sure you are naming them correctly!

Project setup done! Let's customize it for our own NFT and our own friends now.

Step 2: Storing Metadata
It's time to store metadata on IPFS!

First, install IPFS: https://ipfs.tech/#install (either the CLI or desktop app is fine, we recommend checking out the desktop app!)
Upload your image by clicking on "FILES" and then "+ Import":
IPFS Instructions

Click on the image and click "... More".
Click "Share link" to get a URL you can use to access your image on the web. Try it out, put the URL in your browser bar and search.
Click "Copy CID" to get the content identifier for your NFT image.
Next let's upload metadata! You'll create a JSON file representing the standard NFT metadata and store it on IPFS. Let's do this programmatically!

Open up the file ipfs/deploy.js, complete the TODOs to add your NFT image CID and add whichever attributes you desire!
Once you are happy with your final NFT metadata and image...

Run node ipfs/upload.js
path

You will see a new CID output on the terminal. This is the CID to your metadata! You will need it for the Step #4 when we mint your NFT. Copy this CID
Go to your IPFS client you should find your metadata listed on the FILES tab!

Step 3: Create your NFT Contract
Now it's time to actually deploy our ERC-721 contract from which we will mint our NFTs to ourselves and our friends - the possibilities are endless!

Take a look at the contracts/MyToken.sol file.
Customize your NFT. You can rename the contract, token name and token symbol!
In the scripts folder, open up the file deploy.js.
Modify this file to use the CID from your token metadata and the correct contract name.
Save the file.
Now, we are ready to deploy our ERC-721 contract!

To deploy, run npx hardhat run scripts/deploy.js --network sepolia
If that runs successfully, you will have minted yourself an NFT! Take a look on Sepolia Etherscan or OpenSea Testnet to see if you can find your NFT 

Sometimes it can take a little while for IPFS to discover your metadata. You may need to tell OpenSea to refresh your metadata when it becomes available on the IPFS network. You can also try a pinning service like Pinata!
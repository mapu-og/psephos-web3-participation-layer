NFT Indexer 🖼
Now that you've learned about the ERC-721 token standard, we've packaged up a skeleton application written using Vite + React.

Here at AU, we love using an awesome front-end component library called Chakra UI. This app uses a bunch of Chakra! 🔥

First time hearing of Chakra? We recommend reading this article explaining ChakraUI and why it's a very powerful tool for front-end developers to learn!

This skeleton application uses the Alchemy SDK in order to instantly return ALL the NFTs owned by an address. Woah!

Thanks to the Alchemy SDK, you can do this blazingly fast. This is because the Alchemy SDK is rigged directly to Alchemy's own getNFTs endpoint.

This is an extremely powerful API! Can you imagine what a headache it would be to acquire ALL of the NFTs of an address otherwise?? You would need to manually:

go through EVERY block in the blockchain
go through EVERY tx in every block,
index each tx,
see whether the tx involves any ERC-721 specific events
then, build up your own database
That’s super difficult and time-consuming!!

Thanks to Alchemy's Enhanced APIs, this is no longer a burden on the developer.

Set this app up and see for yourself, you'll be able to query anyone's entire NFT collection in a few seconds flat! 🏎

The NFT indexer app you will set up below uses a powerful combination of the following Alchemy Enhanced API endpoints:

getNfts
getNftMetadata
 Setting Up
Step 1: Cloning the repository! 
The NFT indexer application can be found here: https://github.com/alchemyplatform/nft-indexer

In order to clone the repository, follow these steps:

Open a terminal and navigate to the directory of your choice
Run git clone git@github.com:alchemyplatform/nft-indexer.git
Run cd nft-indexer to move into the newly cloned directory
Run npm install to install all dependencies
Run npm run dev to start the local development server
Step 2: Add Your Alchemy API Key 🔑
The project won't work yet, since we have not loaded an API key from Alchemy!

Once you open the project in your code editor, navigate to the App.jsx file... on Line 23, you'll see:

apiKey: '<-- COPY-PASTE YOUR ALCHEMY API KEY HERE -->',
It's time to fetch your Alchemy API key! Follow these steps if you need a refresher:

Sign in to your Alchemy dashboard
Select + Create App or use an existing app on your preferred network
Select 'View Key'
Copy the API KEY
Paste it directly into Line 23 of this project
You are now ready to go, that was quick!! 🔥 Try a fresh query with one of your addresses!

Step 3: Build Out New Features!
We purposefully built this out to be a skeleton version of what can be the next big thing so that you can practice some software development! Here are a few challenge suggestions:

Add Wallet integration so that any user that connects their wallet can check see their NFTs in a flash!
There is no indication of a request in progress... that's bad UX! Do you think you can add some sort of indication of loading?
Add some styling! 🎨
The NFT images can sometimes appear and sometimes not... can you think of ways to fix that?
There is no error-checking for wrongly formed requests, or really any error checking of any kind... can you add some in?
The images and grid display could look better... anything you can do about that?
There are ways to make this app faster... can you implement some of them? How can the query be made even quicker?
Can you add ENS support for inputs?
Completely open-ended!! Use this as the base for your next hackathon project, dream company or personal expedition :)
Step 4: Share Your NFT Indexer to the World! 🌎
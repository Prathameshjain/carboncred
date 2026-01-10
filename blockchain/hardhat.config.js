// require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config({ path: "../.env" });  // Load .env from parent carboncred/ directory


module.exports = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        sepolia: {
            url: process.env.ALCHEMY_URL || "",
            accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
            chainId: 11155111,
            gas: "auto",
            gasPrice: "auto",
            timeout: 60000,
        },
    },
};

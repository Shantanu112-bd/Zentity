require("@nomicfoundation/hardhat-toolbox-viem");
require("dotenv").config();

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      ...(process.env.EVM_VERSION ? { evmVersion: process.env.EVM_VERSION } : {}),
    },
  },
  paths: {
    tests: "./tests",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    local: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    mstLegacyTestnet: {
      url: process.env.MST_LEGACY_TESTNET_RPC || "https://testnetrpc.mstblockchain.com",
      chainId: 91562037,
      accounts,
    },
    mstMainnet: {
      url: process.env.MST_MAINNET_RPC || "https://mariorpc.mstblockchain.com",
      chainId: 4646,
      accounts,
    },
  },
};

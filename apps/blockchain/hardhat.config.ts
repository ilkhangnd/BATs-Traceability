import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    anvil: { url: process.env.CHAIN_RPC_URL ?? "http://127.0.0.1:8545" }
  }
};

export default config;

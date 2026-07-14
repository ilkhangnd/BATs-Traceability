import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ethers } from "hardhat";

async function main() {
  const contract = await ethers.deployContract("BATSAnchor");
  await contract.waitForDeployment();
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: await contract.getAddress(),
    deployer: (await ethers.getSigners())[0]?.address,
    deployedAt: new Date().toISOString()
  };
  const outputDir = resolve("deployments");
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, "local.json"), `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

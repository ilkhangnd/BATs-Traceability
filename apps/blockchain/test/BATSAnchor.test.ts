import { expect } from "chai";
import { ethers } from "hardhat";

describe("BATSAnchor", function () {
  it("anchors a root once and verifies it", async function () {
    const contract = await ethers.deployContract("BATSAnchor");
    const root = ethers.sha256(ethers.toUtf8Bytes("daily EPCIS events"));
    await contract.anchorDailyRoot(root, "2026-07-04", "bats-epcis-0.1");
    expect(await contract.verifyRoot(root, "2026-07-04")).to.equal(true);
    await expect(
      contract.anchorDailyRoot(root, "2026-07-04", "bats-epcis-0.1")
    ).to.be.revertedWithCustomError(contract, "DateAlreadyAnchored");
  });

  it("rejects a non-owner", async function () {
    const [, stranger] = await ethers.getSigners();
    const contract = await ethers.deployContract("BATSAnchor");
    const root = ethers.sha256(ethers.toUtf8Bytes("events"));
    await expect(
      contract.connect(stranger).anchorDailyRoot(root, "2026-07-05", "bats-epcis-0.1")
    ).to.be.revertedWithCustomError(contract, "Unauthorized");
  });
});

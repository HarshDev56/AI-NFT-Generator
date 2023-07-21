const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");
const FRONT_END_ADDRESS_FILE = "../client/src/constants/contractAddress.json";
const FRONT_END_ABI_FILE = "../client/src/constants/abi.json";
module.exports = async function ({ getNamedAccounts, deployments }) {
  const NAME = "AI Generated NFT";
  const SYMBOL = "AINFT";
  const COST = ethers.parseEther("1");
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("---------------------------------------------------------");
  const args = [NAME, SYMBOL, COST];
  const NFT = await deploy("NFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("Verifying...");
    await verify(NFT.address, args);
  }
  console.log("------------------------------------------------------------");
  updateContractAddresses(NFT);
  updateAbi(NFT);
};
async function updateAbi(nft) {
  try {
    const abiJson = JSON.stringify(nft.abi);
    await fs.writeFileSync(FRONT_END_ABI_FILE, abiJson);
    console.log("ABI file written successfully!");
  } catch (error) {
    console.log("Error writing ABI file:", error);
    throw error;
  }
}

async function updateContractAddresses(nft) {
  try {
    const contractAddresses = JSON.parse(
      fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8")
    );
    if (network.config.chainId.toString() in contractAddresses) {
      if (
        !contractAddresses[network.config.chainId.toString()].includes(
          nft.address
        )
      ) {
        contractAddresses[network.config.chainId.toString()].push(nft.address);
      }
    } else {
      contractAddresses[network.config.chainId.toString()] = [nft.address];
    }

    await fs.writeFileSync(
      FRONT_END_ADDRESS_FILE,
      JSON.stringify(contractAddresses)
    );

    console.log("Contract addresses file written successfully!");
  } catch (error) {
    console.log("Error writing contract addresses file:", error);
    throw error;
  }
}
module.exports.tags = ["all", "nft", "main"];

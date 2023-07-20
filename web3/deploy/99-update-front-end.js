const { ethers, getNamedAccounts, network } = require("hardhat");
const fs = require("fs");

const FRONT_END_ADDRESS_FILE = "../client/src/constants/contractAddress.json";
const FRONT_END_ABI_FILE = "../client/src/constants/abi.json";
let deployer;

module.exports = async function ({ getNamedAccounts, deployments }) {
  if (process.env.UPDATE_FRONT_END) {
    try {
      console.log("Updating front end...");
      deployer = await getNamedAccounts();
      const provider = ethers.provider; // Assuming the provider is already set up in the ethers library
      await updateContractAddresses(provider);
      await updateAbi(provider);
      console.log("Front end updated successfully!");
    } catch (error) {
      console.error("Error updating front end:", error);
    }
  }
};

async function updateAbi(provider) {
  const nft = await ethers.getContractAt("NFT", deployer.address, provider);
  const abiJson = JSON.stringify(
    nft.interface.format(ethers.utils.FormatTypes.json)
  );

  try {
    fs.writeFileSync(FRONT_END_ABI_FILE, abiJson);
    console.log("ABI file written successfully!");
  } catch (error) {
    console.error("Error writing ABI file:", error);
    throw error;
  }
}

async function updateContractAddresses(provider) {
  const nft = await ethers.getContractAt("NFT", deployer.address, provider);
  const contractAddresses = JSON.parse(
    fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8")
  );

  const chainId = network.config.chainId.toString();
  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId].includes(nft.address)) {
      contractAddresses[chainId].push(nft.address);
    }
  } else {
    contractAddresses[chainId] = [nft.address];
  }

  try {
    fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(contractAddresses));
    console.log("Contract addresses file written successfully!");
  } catch (error) {
    console.error("Error writing contract addresses file:", error);
    throw error;
  }
}

module.exports.tags = ["all", "frontend"];

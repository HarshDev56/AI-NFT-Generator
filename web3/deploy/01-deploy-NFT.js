const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

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
};
module.exports.tags = ["all", "nft", "main"];

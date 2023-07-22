const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { expect } = require("chai");

const tokens = (n) => {
  return ethers.parseEther(n.toString());
};

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NFT", () => {
      let deployer, minter, accounts;
      let nft;

      const NAME = "AI Generated NFT";
      const SYMBOL = "AINFT";
      const COST = tokens(1); // 1 ETH
      const URL =
        "https://ipfs.io/ipfs/bafyreid4an6ng6e6hok56l565eivozra3373bo6funw3p5mhq5oonew6u4/metadata.json";

      beforeEach(async () => {
        // Get accounts
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        minter = accounts[1];
        // deploy
        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(NAME, SYMBOL, COST);

        // mint
        const transaction = await nft
          .connect(minter)
          .mint(URL, { value: COST });
        await transaction.wait(1);
      });

      describe("Deployment", () => {
        it("Returns Owner", async () => {
          const result = await nft.owner();
          expect(result).to.be.equal(deployer.address);
        });
        it("Returns Cost", async () => {
          const result = await nft.cost();
          expect(result).to.be.equal(COST);
        });
      });

      describe("Minting", () => {
        it("Returns owner", async () => {
          const result = await nft.ownerOf("1");
          expect(result).to.be.equal(minter.address);
        });
        it("Returns URI", async () => {
          const result = await nft.tokenURI("1");
          expect(result).to.be.equal(URL);
        });
        it("Updates total supply", async () => {
          const result = await nft.totalSupply();
          expect(Number(result)).to.be.equal(1);
        });
      });

      describe("Withdrawing", () => {
        let beforeBalance;

        beforeEach(async () => {
          beforeBalance = await ethers.provider.getBalance(deployer.address);
          const transaction = await nft.connect(deployer).withdraw();
          await transaction.wait();
        });
        it("should update balance of owner", async () => {
          const result = await ethers.provider.getBalance(deployer.address);
          expect(Number(result)).to.be.greaterThan(Number(beforeBalance));
        });
        it("update the contract balance ", async () => {
          const result = await ethers.provider.getBalance(nft);
          expect(Number(result)).to.be.equal(0);
        });
      });
    });

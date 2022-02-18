// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  let [ deployer ] = await hre.ethers.getSigners();

  // Deploy an OxCart to use for cloning
  const OxCartClonable = await ethers.getContractFactory("OxCart");
  const oxCartClonable = await OxCartClonable.deploy();

  // Set the reference clone to forward funds to deployer address, as it should never be used but just as a precaution
  await oxCartClonable.initialize(deployer.address);

  const GordianKnotFactory = await hre.ethers.getContractFactory("GordianKnotFactory");
  const gordianKnotFactory = await GordianKnotFactory.deploy();

  await gordianKnotFactory.deployed();

  console.log("GordianKnotFactory deployed to:", gordianKnotFactory.address);

  let tx = await gordianKnotFactory.newGordianKnot(oxCartClonable.address);

  let txReceipt = await tx.wait();

  console.log("Gordian Knot Address:", txReceipt.events[0].args.knotAddress);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

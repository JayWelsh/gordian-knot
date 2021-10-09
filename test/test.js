const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GordianKnot Test Suite", function () {

  // Common variables
  let gordianKnot, gordianKnotAddress;
  let deployer, entanglement1, entanglement2, entanglement3, entanglement4, entanglement5, entanglement6, entanglement7, entanglement8, entanglement9, entanglement10;
  let patron;

  beforeEach(async function () {
    [
      deployer,
      entanglement1,
      entanglement2,
      entanglement3,
      entanglement4,
      entanglement5,
      entanglement6,
      entanglement7,
      entanglement8,
      entanglement9,
      entanglement10,
      patron
    ] = await hre.ethers.getSigners();
  })

  context("GordianKnotFactory.sol", async function () {
    it("Should allow a new GordianKnot to be created", async function () {

      // Deploy an OxCart to use for cloning
      const OxCartClonable = await ethers.getContractFactory("OxCart");
      const oxCartClonable = await OxCartClonable.deploy();

      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();
      await gordianKnotFactory.deployed();

      await expect(
        gordianKnotFactory.newGordianKnot(oxCartClonable.address)
      ).to.emit(gordianKnotFactory, "GordianKnotDeployed")

    });

  });

  context("OxCart.sol", async function () {
    it("Should allow a new OxCart to be created and initialized", async function () {

      // Deploy an OxCart to use for cloning
      const OxCartClonable = await ethers.getContractFactory("OxCart");
      const oxCartClonable = await OxCartClonable.deploy();

      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();
      await gordianKnotFactory.deployed();

      let newGordianKnotTx = await gordianKnotFactory.newGordianKnot(oxCartClonable.address);

      let newGordianKnotReturnData = await newGordianKnotTx.wait();

      let newGordianKnotAddress = ethers.utils.getAddress(ethers.utils.hexStripZeros(newGordianKnotReturnData.logs[0].topics[2]));

      await oxCartClonable.initialize(newGordianKnotAddress);

      let initializedAddress = await oxCartClonable.gordianKnot();

      await expect(initializedAddress).to.equal(newGordianKnotAddress);

    });

    it("Should not allow an OxCart to be initialized more than once", async function () {

      // Deploy an OxCart to use for cloning
      const OxCartClonable = await ethers.getContractFactory("OxCart");
      const oxCartClonable = await OxCartClonable.deploy();

      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();
      await gordianKnotFactory.deployed();

      let newGordianKnotTx = await gordianKnotFactory.newGordianKnot(oxCartClonable.address);

      let newGordianKnotReturnData = await newGordianKnotTx.wait();

      let newGordianKnotAddress = ethers.utils.getAddress(ethers.utils.hexStripZeros(newGordianKnotReturnData.logs[0].topics[2]));

      await oxCartClonable.initialize(newGordianKnotAddress);

      let initializedAddress = await oxCartClonable.gordianKnot();

      await expect(initializedAddress).to.equal(newGordianKnotAddress);

      await expect(
        oxCartClonable.initialize(newGordianKnotAddress)
      ).to.be.revertedWith("Already initialized")

    });

    it("Should not accept a payment if it has not been initialized", async function () {

      // Deploy an OxCart to use for cloning
      const OxCartClonable = await ethers.getContractFactory("OxCart");
      const oxCartClonable = await OxCartClonable.deploy();

      // Send some funds to the ox cart
      await expect(
        patron.sendTransaction({
          to: oxCartClonable.address,
          value: ethers.utils.parseEther("10.0")
        })
      ).to.be.revertedWith("Not initialized")

    });

  });

  context("After GordianKnotFactory.sol & OxCartEntanglementFactory.sol deployment and connection", async function () {

    beforeEach(async () => {

      // Deploy an OxCart to use for cloning
      const OxCartClonable = await ethers.getContractFactory("OxCart");
      const oxCartClonable = await OxCartClonable.deploy();

      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();

      let newGordianKnotTx = await gordianKnotFactory.newGordianKnot(oxCartClonable.address);

      let newGordianKnotReturnData = await newGordianKnotTx.wait();

      let newGordianKnotAddress = ethers.utils.hexStripZeros(newGordianKnotReturnData.logs[0].topics[2]);

      let gordianKnotContract = await ethers.getContractFactory("GordianKnot");

      // Use this new Gordian Knot in the tests
      gordianKnot = await gordianKnotContract.attach(newGordianKnotAddress)
      gordianKnotAddress = newGordianKnotAddress;

    })

    context("GordianKnot.sol", async function () {

      context("newOxCartAndEntanglement", async function () {

        it("Should allow a new OxCart and Entanglement to be created", async function () {
          await expect(
            gordianKnot.newOxCartAndEntanglement([entanglement1.address, entanglement2.address, entanglement3.address], [5000, 2500, 2500])
          ).to.emit(gordianKnot, "OxCartAndEntanglementCreated")
        })
        it("Should emit an event from GordianKnot.sol for each entanglement address passed to newOxCartAndEntanglement", async function () {
          let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
          let entanglementAddressPortions = [5000, 2500, 2500];
          let newOxCartAndEntanglementTx = await gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
          let newOxCartAndEntanglementTxResponse = await newOxCartAndEntanglementTx.wait();
          let oxCartAddress = newOxCartAndEntanglementTxResponse.events[3].args.oxCartAddress;
          let gordianKnotEvents = newOxCartAndEntanglementTxResponse.events.slice(0, 3);
          for (let [index, event] of gordianKnotEvents.entries()) {
            await expect(ethers.utils.getAddress(ethers.utils.hexDataSlice(event.topics[1], 12))).to.equal(oxCartAddress);
            await expect(ethers.utils.getAddress(ethers.utils.hexDataSlice(event.topics[2], 12))).to.equal(entanglementAddresses[index]);
            await expect(Number(event.topics[3])).to.equal(entanglementAddressPortions[index]);
          }
        })
        it("Should revert if entanglementAddresses & basisPoints arrays are not equal length", async function () {
          let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
          let entanglementAddressPortions = [5000, 2500, 2400, 100];
          await expect (
            gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
          ).to.be.revertedWith("Length of _entanglementAddresses and _basisPoints arrays must be equal")
        })
        it("Should revert if entanglementAddress array is empty", async function () {
          let entanglementAddresses = [];
          let entanglementAddressPortions = [5000, 2500, 2500];
          await expect (
            gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
          ).to.be.revertedWith("Length of _entanglementAddresses must be more than zero")
        })

      });

      it("Should properly distribute ETH to entangled addresses based on their defined portions", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 1000];
        let newOxCartAndEntanglementTx = await gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
        let newOxCartAndEntanglementTxResponse = await newOxCartAndEntanglementTx.wait();
        let oxCartAddress = newOxCartAndEntanglementTxResponse.events[3].args.oxCartAddress;

        // Check balance of Gordian Knot
        let balanceBeforeOxCartTx = await ethers.provider.getBalance(gordianKnot.address)
        expect(ethers.utils.formatEther(balanceBeforeOxCartTx)).to.equal("0.0");

        let startingEntanglement1Balance = await ethers.provider.getBalance(entanglement1.address)
        expect(ethers.utils.formatEther(startingEntanglement1Balance)).to.equal("10000.0");

        let startingEntanglement2Balance = await ethers.provider.getBalance(entanglement2.address)
        expect(ethers.utils.formatEther(startingEntanglement2Balance)).to.equal("10000.0");

        let startingEntanglement3Balance = await ethers.provider.getBalance(entanglement2.address)
        expect(ethers.utils.formatEther(startingEntanglement3Balance)).to.equal("10000.0");

        // Send some funds to the ox cart
        await patron.sendTransaction({
          to: oxCartAddress,
          value: ethers.utils.parseEther("10.0")
        });

        let balanceAfterOxCartTx = await ethers.provider.getBalance(gordianKnot.address);
        expect(ethers.utils.formatEther(balanceAfterOxCartTx)).to.equal("10.0");

        // Fasten the knot
        await expect(
          gordianKnot.fastenKnot(oxCartAddress)
        ).to.emit(gordianKnot, "KnotFastened").withArgs(oxCartAddress, deployer.address);

        // Check balance of Gordian Knot
        let balanceAfterFastenTx = await ethers.provider.getBalance(gordianKnot.address)
        expect(ethers.utils.formatEther(balanceAfterFastenTx)).to.equal("0.0");

        let endingEntanglement1Balance = await ethers.provider.getBalance(entanglement1.address)
        expect(endingEntanglement1Balance).to.equal(ethers.utils.parseUnits(((Number("10000.0") + (("10.0" * entanglementAddressPortions[0]) / 10000)).toString())));

        let endingEntanglement2Balance = await ethers.provider.getBalance(entanglement2.address)
        expect(endingEntanglement2Balance).to.equal(ethers.utils.parseUnits(((Number("10000.0") + (("10.0" * entanglementAddressPortions[1]) / 10000)).toString())));

        let endingEntanglement3Balance = await ethers.provider.getBalance(entanglement3.address)
        expect(endingEntanglement3Balance).to.equal(ethers.utils.parseUnits(((Number("10000.0") + (("10.0" * entanglementAddressPortions[2]) / 10000)).toString())));
      
      });

      it("Should return a valid entanglement via getEntanglement", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 1000];
        let newOxCartAndEntanglementTx = await gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
        let newOxCartAndEntanglementTxResponse = await newOxCartAndEntanglementTx.wait();
        let oxCartAddress = newOxCartAndEntanglementTxResponse.events[3].args.oxCartAddress;

        // Fetch the entanglement
        let fetchedEntanglement = await gordianKnot.getEntanglement(oxCartAddress);

        for(let [index, entanglementAddress] of entanglementAddresses.entries()) {
          await expect(
            fetchedEntanglement[0][index]
          ).to.equal(entanglementAddress)
        }

        for(let [index, entanglementAddressPortion] of entanglementAddressPortions.entries()) {
          await expect(
            fetchedEntanglement[1][index]
          ).to.equal(entanglementAddressPortion)
        }

      });

      it("Should revert if knot is already fastened", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 1000];
        let newOxCartAndEntanglementTx = await gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
        let newOxCartAndEntanglementTxResponse = await newOxCartAndEntanglementTx.wait();
        let oxCartAddress = newOxCartAndEntanglementTxResponse.events[3].args.oxCartAddress;

        // Send some funds to the ox cart
        await patron.sendTransaction({
          to: oxCartAddress,
          value: ethers.utils.parseEther("10.0")
        });

        // Fasten the knot
        await expect(
          gordianKnot.fastenKnot(oxCartAddress)
        ).to.emit(gordianKnot, "KnotFastened").withArgs(oxCartAddress, deployer.address);
      
        // Try to refasten the knot
        await expect(
          gordianKnot.fastenKnot(oxCartAddress)
        ).to.be.revertedWith("Knot already fastened.");

      });

      it("Should revert if fastenKnot fails to deliver to an entanglement address", async function () {

        // Deploy an OxCart and do not initialize it (any ETH delivery should fail)
        const OxCartClonable = await ethers.getContractFactory("OxCart");
        const oxCartClonable = await OxCartClonable.deploy();

        let entanglementAddresses = [entanglement1.address, entanglement2.address, oxCartClonable.address];
        let entanglementAddressPortions = [5000, 4000, 1000];
        let newOxCartAndEntanglementTx = await gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
        let newOxCartAndEntanglementTxResponse = await newOxCartAndEntanglementTx.wait();
        let oxCartAddress = newOxCartAndEntanglementTxResponse.events[3].args.oxCartAddress;

        // Send some funds to the ox cart
        await patron.sendTransaction({
          to: oxCartAddress,
          value: ethers.utils.parseEther("10.0")
        });

        // Fasten the knot
        await expect(
          gordianKnot.fastenKnot(oxCartAddress)
        ).to.be.revertedWith("Entanglement cut delivery unsuccessful.");

      });

      it("Should revert if total basisPoints exceed 10000", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 2000];
        await expect(
          gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("_basisPoints must add up to 10000 together.");
      });

      it("Should revert if single basisPoint exceeds 10000", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [10001, 4000, 2000];
        await expect(
          gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("_basisPoints may not be 0 and may not exceed 10000 (100%)");
      });

      it("Should revert if single basisPoint is 0", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 0];
        await expect(
          gordianKnot.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("_basisPoints may not be 0 and may not exceed 10000 (100%)");
      });

      it("Should revert if an unentangled oxCart address is passed to the fastenKnot method", async function () {
      
        // Pass zero address to fastenKnot method
        await expect(
          gordianKnot.fastenKnot(patron.address)
        ).to.be.revertedWith("_oxCartAddress is not associated with an entanglement.");

      });

      it("Should revert if a zero address is passed to the fastenKnot method", async function () {
      
        // Pass zero address to fastenKnot method
        await expect(
          gordianKnot.fastenKnot("0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("_oxCartAddress may not be zero address.");

      });

      it("Should revert if requesting an invalid OxCart via getEntanglement", async function () {
        
        // Try to fetch an invalid entanglement
        await expect(
          gordianKnot.getEntanglement("0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("_oxCartAddress is not associated with an entanglement.");

      });

      it("Should revert if ETH is sent directly to the GordianKnot by an address other than an entangled OxCart", async function () {
      
        // Pass zero address to fastenKnot method
        await expect(
          patron.sendTransaction({
            to: gordianKnotAddress,
            value: ethers.utils.parseEther("10.0")
          })
        ).to.be.revertedWith("OxCart is not associated with an entanglement");

      });

    });

  });

});

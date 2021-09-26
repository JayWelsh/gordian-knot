const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GordianKnot Test Suite", function () {

  // Common variables
  let gordianKnot, gordianKnotAddress, oxCartEntanglementFactory, oxCartEntanglementFactoryAddress;
  let deployer, entanglement1, entanglement2, entanglement3, patron;

  beforeEach(async function () {
    [deployer, entanglement1, entanglement2, entanglement3, patron] = await hre.ethers.getSigners();
  })

  context("GordianKnotFactory.sol", async function () {
    it("Should allow a new GordianKnot to be created", async function () {
      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();
      await gordianKnotFactory.deployed();

      await expect(
        gordianKnotFactory.newGordianKnot()
      ).to.emit(gordianKnotFactory, "GordianKnotDeployed")

    });

    it("Should allow an OxCartEntanglementFactory to be set as the OxCartEntanglementFactory of the Gordian Knot", async function () {
      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();
      await gordianKnotFactory.deployed();
      let newGordianKnotTx = await gordianKnotFactory.newGordianKnot();
      let newGordianKnotReturnData = await newGordianKnotTx.wait();
      let newGordianKnotAddress = ethers.utils.hexStripZeros(newGordianKnotReturnData.logs[0].topics[2]);
      let gordianKnotContract = await ethers.getContractFactory("GordianKnot");
      let gordianKnotAttached = await gordianKnotContract.attach(newGordianKnotAddress)
      // Create a new OxCart factory
      const OxCartEntanglementFactory = await ethers.getContractFactory("OxCartEntanglementFactory");
      let oxCartEntanglementFactoryLocal = await OxCartEntanglementFactory.deploy(newGordianKnotAddress);
      await oxCartEntanglementFactoryLocal.deployed();
      let oxCartEntanglementFactoryAddressLocal = oxCartEntanglementFactoryLocal.address;

      // Hook the OxCartEntanglementFactory up to the Gordian Knot
      await expect(
        gordianKnotAttached.setOxCartEntanglementFactory(oxCartEntanglementFactoryAddressLocal)
      ).to.emit(gordianKnotAttached, "OxCartEntanglementFactoryConnected").withArgs(oxCartEntanglementFactoryAddressLocal);
    })
  });

  context("After GordianKnotFactory.sol & OxCartEntanglementFactory.sol deployment and connection", async function () {

    beforeEach(async () => {

      // Create a new Gordian Knot Factory and then a new Gordian Knot
      const GordianKnotFactory = await ethers.getContractFactory("GordianKnotFactory");
      const gordianKnotFactory = await GordianKnotFactory.deploy();
      await gordianKnotFactory.deployed();

      let newGordianKnotTx = await gordianKnotFactory.newGordianKnot();

      let newGordianKnotReturnData = await newGordianKnotTx.wait();

      let newGordianKnotAddress = ethers.utils.hexStripZeros(newGordianKnotReturnData.logs[0].topics[2]);

      let gordianKnotContract = await ethers.getContractFactory("GordianKnot");

      // Use this new Gordian Knot in the tests
      gordianKnot = await gordianKnotContract.attach(newGordianKnotAddress)
      gordianKnotAddress = newGordianKnotAddress;

      // Create a new OxCart factory
      const OxCartEntanglementFactory = await ethers.getContractFactory("OxCartEntanglementFactory");
      oxCartEntanglementFactory = await OxCartEntanglementFactory.deploy(newGordianKnotAddress);
      await oxCartEntanglementFactory.deployed();

      oxCartEntanglementFactoryAddress = oxCartEntanglementFactory.address;

      // Hook the OxCartEntanglementFactory up to the Gordian Knot
      await gordianKnot.setOxCartEntanglementFactory(oxCartEntanglementFactoryAddress);
    })

    context("OxCartEntanglementFactory.sol", async function () {
      it("Should allow a new OxCart and Entanglement to be created", async function () {
        await expect(
          oxCartEntanglementFactory.newOxCartAndEntanglement([entanglement1.address, entanglement2.address, entanglement3.address], [5000, 2500, 2500])
        ).to.emit(oxCartEntanglementFactory, "OxCartAndEntanglementCreated")
      })
      it("Should emit an event from GordianKnot.sol for each entanglement address passed to newOxCartAndEntanglement", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 2500, 2500];
        let newOxCartAndEntanglementTx = await oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
        let newOxCartAndEntanglementTxResponse = await newOxCartAndEntanglementTx.wait();
        let oxCartAddress = newOxCartAndEntanglementTxResponse.events[3].args.oxCartAddress;
        let gordianKnotEvents = newOxCartAndEntanglementTxResponse.events.slice(0, 3);
        for (let [index, event] of gordianKnotEvents.entries()) {
          await expect(ethers.utils.getAddress(ethers.utils.hexStripZeros(event.topics[1]))).to.equal(oxCartAddress);
          await expect(ethers.utils.getAddress(ethers.utils.hexStripZeros(event.topics[2]))).to.equal(entanglementAddresses[index]);
          await expect(Number(event.topics[3])).to.equal(entanglementAddressPortions[index]);
        }
      })
      it("Should revert if entanglementAddresses & basisPoints arrays are not equal length", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 2500, 2400, 100];
        await expect (
          oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("Length of _entanglementAddresses and _basisPoints arrays must be equal")
      })
      it("Should revert if entanglementAddress array is empty", async function () {
        let entanglementAddresses = [];
        let entanglementAddressPortions = [5000, 2500, 2500];
        await expect (
          oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("Length of _entanglementAddresses must be more than zero")
      })
    });

    context("GordianKnot.sol", async function () {

      it("Should return the OxCartEntanglementFactory that it is connected to", async function () {
        let hookedUpOxCartAddress = await gordianKnot.oxCartEntanglementFactory();
        expect(hookedUpOxCartAddress).to.equal(oxCartEntanglementFactoryAddress);
      });

      it("Should not allow the newEntanglement method to be called directly", async function () {
        await expect(
          gordianKnot.newEntanglement(
            oxCartEntanglementFactoryAddress,
            [entanglement1.address, entanglement2.address, entanglement3.address],
            [7500, 2000, 500]
          )
        ).to.be.revertedWith("Only the OxCartEntanglementFactory contract may create new entanglements");
      });

      it("Should properly distribute ETH to entangled addresses based on their defined portions", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 1000];
        let newOxCartAndEntanglementTx = await oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
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

      it("Should revert if knot is already fastened", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 1000];
        let newOxCartAndEntanglementTx = await oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions);
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

      it("Should revert if total basisPoints exceed 10000", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 2000];
        await expect(
          oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("_basisPoints must add up to 10000 together.");
      });

      it("Should revert if single basisPoint exceeds 10000", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [10001, 4000, 2000];
        await expect(
          oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
        ).to.be.revertedWith("_basisPoints may not be 0 and may not exceed 10000 (100%)");
      });

      it("Should revert if single basisPoint is 0", async function () {
        let entanglementAddresses = [entanglement1.address, entanglement2.address, entanglement3.address];
        let entanglementAddressPortions = [5000, 4000, 0];
        await expect(
          oxCartEntanglementFactory.newOxCartAndEntanglement(entanglementAddresses, entanglementAddressPortions)
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

      it("Should revert if an attempt is made to call setOxCartEntanglementFactory after it is already set", async function () {
      
        // Pass zero address to fastenKnot method
        await expect(
          gordianKnot.setOxCartEntanglementFactory("0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("oxCartEntanglementFactory address can only be set once (already set).");

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

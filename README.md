# Gordian Knot

This is a smart-contract-based approach towards making it possible for multiple separate parties to accept portions of ETH transfers which are made to a single address, without any single individual taking custody or ownership of the full amount of ETH.

E.g. Alice and Bob have an agreement with eachother to each receive 50% of an ETH payment, the patron of the payment can be given a single ETH address to make a single transaction to, and Alice and Bob may subsequently each claim their own individual portion of the payment.

Contract is unaudited, use at own risk.


## Why?

In some cases, multiple parties may want to be able to receive a portion of a single ETH payment without any of the parties involved needing to take ownership of the full amount of ETH (not even in a multisig), e.g. for tax reasons (please consult a tax consultant in your jurisdiction if you are considering using this for tax reasons) or in cases where only a single address can be provided to receive ETH payments, but where multiple parties need to be able to receive a portion of said payment (e.g. the royalty address field on [EIP-2981](https://github.com/VexyCats/EIPs/blob/master/EIPS/eip-2981.md)).


## Metaphor

The wording used throughout these contracts is mostly based on the story of the [Gordian Knot](https://en.wikipedia.org/wiki/Gordian_Knot).

- An `entanglement` represents a distribution policy between different Ethereum addresses, e.g. `75% to 0x0...01`, `20% to 0x0...02`, `5% to 0x0...03`, always 100% in total. Each entanglement can be thought of as an individual strand/string/rope in the GordianKnot.

- The `GordianKnot` is responsible for tracking ETH allocations and enabling entangled parties to withdraw their portion of their entanglement's balance.

- The `OxCart` is a contract which provides a single ETH receive address and acts as an automated courier of ETH from the receive address to the GordianKnot, each entanglement has one OxCart, each OxCart can only provide delivery to one entanglement.

- When an entanglement's ETH allocation is distributed between its relevant parties, this is considered to be `fastening` the GordianKnot.

- Funds in the GordianKnot are considered as being in `hiatus`, prior to entangled parties fastening the knot.

There are four contracts which form part of this system, as follows:


## GordianKnot.sol

- GordianKnot contracts provide Ethereum-native storage and distribution mechanisms to manage entanglements between multiple parties.

- Each GordianKnot contract requires a single assigned OxCartEntanglementFactory address in order to function (discussed below).

- Anyone can create a new entanglement between different parties on the same shared knot.

- Once entanglements (portion agreements between addresses) are created, they can not be modified or destroyed.

- Each entanglement requires a dedicated OxCart contract to perform the role of accepting funds on a single address & automatically delivering said funds to the GordianKnot and allocating ETH to the correct entanglement without human intervention.

- When an OxCart delivers funds to the GordianKnot, the GordianKnot will increment the allocated ETH balance of the entanglement that the OxCart is part of.


## OxCart.sol

- OxCart contracts act as automated Ethereum-native couriers of ETH from one Ethereum address (the OxCart contract address) to another (the GordianKnot contract address).

- When an OxCart contract is deployed, the address of the GordianKnot contract which it will handle deliveries to is provided to it.

- When OxCart contracts receive ETH via transactions, they will automatically forward any ETH received onto the GordianKnot contract, the GordianKnot contract will detect which address the OxCart address that the ETH came from and will map the OxCart delivery to an entanglement.

- Each OxCart contract can be entangled with only one multi-party agreement on the GordianKnot contract.

- OxCart contracts can not be disconnected from GordianKnot contracts.

## GordianKnotFactory.sol

- GordianKnotFactory contracts are used to deploy new GordianKnot contracts.

## OxCartEntanglementFactory.sol

- OxCartEntanglementFactory contracts are used to simultaneously deploy a new OxCart & create a new entanglement on the GordianKnot, which is automatically associated with the newly deployed OxCart.
## Methods

Highlighting each of the public-facing methods and what they do


### OxCartEntanglementFactory.newOxCartAndEntanglement

```solidity
function newOxCartAndEntanglement(
  address[] memory _entanglementAddresses,
  uint16[] memory _basisPoints
) external;
```

This method is used to create a new OxCart contract (ETH receiving address), a set of addresses with their own basis point allocations are automatically entangled with it on the GordianKnot contract.

Each entanglementAddress must have a corresponding basisPoint allocation (e.g. 10000 = 100%, 5000 = 50%).

The total of the basisPoint allocations must add up to 10000 (100%), all provided basis points must be more than 0.

Example pseudo usage:

```solidity
newOxCartAndEntanglement(
  [0x0000000000000000000000000000000000000001, 0x0000000000000000000000000000000000000002],
  [7500, 2500]
);
```

### GordianKnot.fastenKnot

```solidity
function fastenKnot(
  address _oxCartAddress
) external;
```

Calling the `fastenKnot` function will distribute any entanglement-allocated ETH in haitus on the GordianKnot contract which is to the entangled parties in portions which match their respective basisPoint assignments. The relevant entanglement is derived from the `_oxCartAddress` provided (as each OxCart can only be linked to one entanglement on the GordianKnot contract). The `_oxCartAddress` is the same as the ETH receive address for the parties involved in the entanglement.

Example pseudo usage:

```solidity
fastenKnot(
  0x0000000000000000000000000000000000000000,
);
```

### GordianKnot.setOxCartEntanglementFactory

```solidity
function setOxCartEntanglementFactory(
  address _oxCartEntanglementFactory
) external;
```

For those who are deploying their own `GordianKnot.sol` contracts, e.g. via the `GordianKnotFactory.sol` contract or manually, the GordianKnot must be linked to an `OxCartEntanglementFactory.sol` contract address in order to function. This `setOxCartEntanglementFactory` function is used to hook the GordianKnot up to an `OxCartEntanglementFactory.sol` contract. Once the address of the `OxCartEntanglementFactory.sol` contract is set, it can not be changed. The provided `_oxCartEntanglementFactory` is the only address which is allowed to call the `newEntanglement` method within the GordianKnot.

Example pseudo usage:

```solidity
setOxCartEntanglementFactory(
  0x0000000000000000000000000000000000000000,
);
```

### GordianKnotFactory.newGordianKnot

This can be used to create a new GordianKnot contract, after creating a new GordianKnot contract, it is important to deploy a `OxCartEntanglementFactory.sol` (or similar) contract and subsequently call the `GordianKnot.setOxCartEntanglementFactory` method to complete the process of deploying the new GordianKnot.
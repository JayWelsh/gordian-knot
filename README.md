<br/>
<p align="center">
<img src="https://vagabond.mypinata.cloud/ipfs/QmSuQLis1RXCy9xCDHWgdRmpCYwaCozuUFmMUqeFhrxH35" width="300" alt="Gordian Knot Logo">
</p>
<br/>

# Gordian Knot

## this project is deprecated, please make use of [0xsplits](https://www.0xsplits.xyz/) instead

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

There are three contracts which form part of this system, as follows:


## GordianKnot.sol

- GordianKnot contracts provide Ethereum-native storage and distribution mechanisms to manage entanglements between multiple parties.

- Anyone can create a new entanglement between different parties on the same shared knot.

- Once entanglements (portion agreements between addresses) are created, they can not be modified or destroyed.

- Each entanglement requires a dedicated OxCart contract to perform the role of accepting funds on a single address & automatically delivering said funds to the GordianKnot and allocating ETH to the correct entanglement without human intervention.

- When an OxCart delivers funds to the GordianKnot, the GordianKnot will increment the allocated ETH balance of the entanglement that the OxCart is part of.

- When a user creates a new entanglement, a new OxCart contract is simultaneously deployed & associated with the new GordianKnot entanglement.


## OxCart.sol

- OxCart contracts act as automated Ethereum-native couriers of ETH from one Ethereum address (the OxCart contract address) to another (the GordianKnot contract address).

- The address of a GordianKnot must be supplied to the OxCart contract constructor upon deployment, this is the address that the OxCart will handle deliveries to.

- When OxCart contracts receive ETH via transactions, they will automatically forward any ETH received onto the GordianKnot contract, the GordianKnot contract will detect which OxCart address the ETH delivery came from and will map the OxCart delivery to an entanglement (this will increase the ETH allocation towards the entanglement on the GordianKnot).

- Each OxCart contract can be entangled with only one multi-party agreement on the GordianKnot contract.

- OxCart contracts can not be disconnected from GordianKnot contracts.


## GordianKnotFactory.sol

- GordianKnotFactory contracts are used to deploy new GordianKnot contracts.


## Methods

Highlighting each of the public-facing methods and what they do

### GordianKnot.newOxCartAndEntanglement

```solidity
function newOxCartAndEntanglement(
  address[] memory _entanglementAddresses,
  uint16[] memory _basisPoints
) external;
```

This method is used to create a new entanglement along with a new OxCart contract (ETH receiving address), the provided set of addresses and their respective basis point allocations are automatically entangled with the new OxCart contract address on the GordianKnot contract.

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


### GordianKnotFactory.newGordianKnot

This can be used to create a new GordianKnot contract.

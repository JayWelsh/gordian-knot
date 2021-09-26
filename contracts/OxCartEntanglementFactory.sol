//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './OxCart.sol';
import './interfaces/IGordianKnot.sol';

contract OxCartEntanglementFactory {

  IGordianKnot GordianKnotContract;

  event OxCartAndEntanglementCreated(address indexed entanglementCreator, address indexed oxCartAddress, address indexed gordianKnot);

  constructor(address _gordianKnotAddress) {
    GordianKnotContract = IGordianKnot(_gordianKnotAddress);
  }

  function newOxCartAndEntanglement(
    address[] memory _entanglementAddresses,
    uint16[] memory _basisPoints
  ) external returns(address) {
    require(_entanglementAddresses.length > 0, "Length of _entanglementAddresses must be more than zero");
    require(_entanglementAddresses.length == _basisPoints.length, "Length of _entanglementAddresses and _basisPoints arrays must be equal");
    // Create new OxCart
    OxCart newOxCartContract = new OxCart(address(GordianKnotContract));
    address newOxCartAddress = address(newOxCartContract);
    // Create entanglement between OxCart and GordianKnot
    GordianKnotContract.newEntanglement(newOxCartAddress, _entanglementAddresses, _basisPoints);
    emit OxCartAndEntanglementCreated(msg.sender, newOxCartAddress, address(GordianKnotContract));
    return newOxCartAddress;
  }

}
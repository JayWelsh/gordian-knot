//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import './GordianKnot.sol';

contract GordianKnotFactory {

  event GordianKnotDeployed(address indexed knotDeployer, address indexed knotAddress);

  function newGordianKnot() external returns(address) {
      GordianKnot newGordianKnotContract = new GordianKnot();
      address newGordianKnotAddress = address(newGordianKnotContract);
      emit GordianKnotDeployed(msg.sender, newGordianKnotAddress);
      return newGordianKnotAddress;
  }

}
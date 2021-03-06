//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IGordianKnotFactory {

  event GordianKnotDeployed(address indexed knotDeployer, address indexed knotAddress);
  
  function newGordianKnot(address _referenceOxCart) external returns(address);

}
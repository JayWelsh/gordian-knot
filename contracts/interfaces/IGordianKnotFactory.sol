//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IGordianKnotFactory {

  event GordianKnotDeployed(address indexed knotDeployer, address indexed knotAddress);
  
  function newOxCartAndEntanglement(address[] memory _entanglementAddresses, uint16[] memory _basisPoints) external returns(address);

}
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IGordianKnot {

  event OxCartEntanglementFactoryConnected(address oxCartEntanglementFactoryAddress);
  event NewEntanglement(address indexed oxCartAddress, address indexed entanglementAddress, uint16 indexed basisPoints);
  event KnotFastened(address indexed oxCartAddress, address indexed knotFastener);
  
  function newEntanglement(address _oxCartAddress, address[] memory _entanglementAddresses, uint16[] memory _basisPoints) external;
  function fastenKnot(address _oxCartAddress) external;
  function setOxCartEntanglementFactory(address _oxCartEntanglementFactory) external;

}
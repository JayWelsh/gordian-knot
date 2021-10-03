//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IGordianKnot {

  event OxCartAndEntanglementCreated(address indexed entanglementCreator, address indexed oxCartAddress, address indexed gordianKnot);
  event NewEntanglement(address indexed oxCartAddress, address indexed entanglementAddress, uint16 indexed basisPoints, address[] allEntanglementAddresses, uint16[] allEntanglementBasisPoints);
  event KnotFastened(address indexed oxCartAddress, address indexed knotFastener);
  event OxCartDelivery(address indexed oxCartAddress);
  
  function newOxCartAndEntanglement(address[] memory _entanglementAddresses, uint16[] memory _basisPoints) external returns(address);
  function fastenKnot(address _oxCartAddress) external;
  function getEntanglement(address _oxCartAddress) external view returns(address[] memory, uint16[] memory);

}
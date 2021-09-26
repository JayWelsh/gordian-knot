//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IOxCartEntanglementFactory {

  event OxCartAndEntanglementCreated(address indexed entanglementCreator, address indexed oxCartAddress, address indexed gordianKnot);
  
  function newGordianKnot() external returns(address);

}
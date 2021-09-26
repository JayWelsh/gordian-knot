//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract OxCart {
  address gordianKnot;
    
  constructor (address _gordianKnot)  {
    gordianKnot = _gordianKnot;
  }
  
  receive() external payable {
    (bool deliverySuccess, ) = gordianKnot.call{value: address(this).balance}("");
    require(deliverySuccess, "Ox cart delivery unsuccessful.");
  }
}
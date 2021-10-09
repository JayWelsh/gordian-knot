//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract OxCart {
  address public gordianKnot;

  function initialize(address _gordianKnot) external {
    require(gordianKnot == address(0), "Already initialized");
    gordianKnot = _gordianKnot;
  }
  
  receive() external payable {
    require(gordianKnot != address(0), "Not initialized");
    (bool deliverySuccess, ) = gordianKnot.call{value: address(this).balance}("");
    require(deliverySuccess, "Ox cart delivery unsuccessful.");
  }
}
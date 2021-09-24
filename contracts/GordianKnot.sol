//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "hardhat/console.sol";

contract GordianKnot is AccessControl {

    // Create a new role identifier for the ORACLE role
    // Can create new entanglements & adjust the address of gordias
    // Beyond the address of gordias being adjusted, existing entanglements can not be modified
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Gordias receives proceeds of ETH *after* subtracting basis points of an entangled address.
    address public gordias;

    // Maps the address of an ox cart to an entangled address to entanglement's basis points
    mapping(address => address) oxCartToEntanglementAddress;
    mapping(address => mapping(address => uint16)) oxCartToEntanglementAddressToBasisPoints;
    mapping(address => mapping(address => uint256)) oxCartToEntanglementAddressToHiatusValue;

    constructor(address _gordias, address _oracle) {
        gordias = _gordias;
        _setupRole(ORACLE_ROLE, _oracle);
        _setRoleAdmin(ORACLE_ROLE, ORACLE_ROLE);
    }

    function setGordias(
        address _gordias
    ) external onlyRole(ORACLE_ROLE) {
        gordias = _gordias;
    }

    function newEntanglement(
        address _oxCartAddress,
        address _entanglementAddress,
        uint16 _basisPoints
    ) external onlyRole(ORACLE_ROLE) {
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address");
        require(_entanglementAddress != address(0), "_entangledAddress may not be zero address");
        require((_basisPoints > 0) && (_basisPoints <= 10000), "_basisPoints may not be 0 and may not exceed 10000 (100%)");
        require(oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddress] == 0, "Entanglement already exists, you need a new ox cart.");
        oxCartToEntanglementAddress[_oxCartAddress] = _entanglementAddress;
        oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddress] = _basisPoints;
    }

    function getPercentageOf(
        uint256 _amount,
        uint16 _basisPoints
    ) internal pure returns (uint256 share) {
        share = (_amount * _basisPoints) / 10000;
    }

    function fastenKnot(address _oxCartAddress, address _entanglementAddress) external {
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address");
        require(_entanglementAddress != address(0), "_entangledAddress may not be zero address");
        require(oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddress] != 0, "_oxCartAddress and _entanglementAddress are not entangled.");
        require(oxCartToEntanglementAddressToHiatusValue[_oxCartAddress][oxCartToEntanglementAddress[_oxCartAddress]] > 0, "Knot already fastened.");
        uint256 entanglementCut = getPercentageOf(oxCartToEntanglementAddressToHiatusValue[_oxCartAddress][oxCartToEntanglementAddress[_oxCartAddress]], oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddress]);
        console.log("entanglementCut", entanglementCut);
        uint256 gordianCut = oxCartToEntanglementAddressToHiatusValue[_oxCartAddress][oxCartToEntanglementAddress[_oxCartAddress]] - entanglementCut;
        (bool entanglementDeliverySuccess, ) = _entanglementAddress.call{value: entanglementCut}("");
        require(entanglementDeliverySuccess, "Entanglement cut delivery unsuccessful.");
        (bool gordianDeliverySuccess, ) = gordias.call{value: gordianCut}("");
        require(gordianDeliverySuccess, "Gordian cut delivery unsuccessful.");
        oxCartToEntanglementAddressToHiatusValue[_oxCartAddress][oxCartToEntanglementAddress[_oxCartAddress]] = 0;
    }

    fallback () external payable {
        require(oxCartToEntanglementAddress[msg.sender] != address(0), "Ox cart is not associated with an entanglement");
        oxCartToEntanglementAddressToHiatusValue[msg.sender][oxCartToEntanglementAddress[msg.sender]] = oxCartToEntanglementAddressToHiatusValue[msg.sender][oxCartToEntanglementAddress[msg.sender]] + msg.value;
    }

}

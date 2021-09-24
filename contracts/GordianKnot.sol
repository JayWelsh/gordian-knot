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
    mapping(address => address[]) oxCartToEntanglementAddresses;
    mapping(address => mapping(address => uint16)) oxCartToEntanglementAddressToBasisPoints;
    mapping(address => uint256) oxCartToToHiatusValue;

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
        address[] memory _entanglementAddresses,
        uint16[] memory _basisPoints
    ) external onlyRole(ORACLE_ROLE) {
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address");
        require(oxCartToEntanglementAddresses[_oxCartAddress].length == 0, "Entanglement already exists, you need a new ox cart.");
        for(uint256 i = 0; i < _entanglementAddresses.length; i++) {
            require(_entanglementAddresses[i] != address(0), "_entangledAddress may not be zero address");
            require((_basisPoints[i] > 0) && (_basisPoints[i] <= 10000), "_basisPoints may not be 0 and may not exceed 10000 (100%)");
            require(oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddresses[i]] == 0, "Entanglement already exists, you need a new ox cart.");
            oxCartToEntanglementAddresses[_oxCartAddress].push(_entanglementAddresses[i]);
            oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddresses[i]] = _basisPoints[i];
        }
    }

    function getPercentageOf(
        uint256 _amount,
        uint16 _basisPoints
    ) internal pure returns (uint256 value) {
        value = (_amount * _basisPoints) / 10000;
    }

    function fastenKnot(address _oxCartAddress) external {
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address");
        require(oxCartToToHiatusValue[_oxCartAddress] > 0, "Knot already fastened.");
        uint256 entanglementCutsTotal;
        for(uint256 i = 0; i < oxCartToEntanglementAddresses[_oxCartAddress].length; i++) {
            uint256 entanglementCut = getPercentageOf(oxCartToToHiatusValue[_oxCartAddress], oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][oxCartToEntanglementAddresses[_oxCartAddress][i]]);
            entanglementCutsTotal += entanglementCut;
            (bool entanglementDeliverySuccess, ) = oxCartToEntanglementAddresses[_oxCartAddress][i].call{value: entanglementCut}("");
            require(entanglementDeliverySuccess, "Entanglement cut delivery unsuccessful.");
        }
        uint256 gordianCut = oxCartToToHiatusValue[_oxCartAddress] - entanglementCutsTotal;
        (bool gordianDeliverySuccess, ) = gordias.call{value: gordianCut}("");
        require(gordianDeliverySuccess, "Gordian cut delivery unsuccessful.");
        oxCartToToHiatusValue[_oxCartAddress] = 0;
    }

    fallback () external payable {
        require(oxCartToEntanglementAddresses[msg.sender].length > 0, "Ox cart is not associated with an entanglement");
        oxCartToToHiatusValue[msg.sender] = oxCartToToHiatusValue[msg.sender] + msg.value;
    }

}
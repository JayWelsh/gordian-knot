//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import './interfaces/IOxCart.sol';

contract GordianKnot {

    event OxCartAndEntanglementCreated(address indexed entanglementCreator, address indexed oxCartAddress, address indexed gordianKnot);
    event NewEntanglement(address indexed oxCartAddress, address indexed entanglementAddress, uint16 indexed basisPoints, address[] allEntanglementAddresses, uint16[] allEntanglementBasisPoints);
    event KnotFastened(address indexed oxCartAddress, address indexed knotFastener);
    event OxCartDelivery(address indexed oxCartAddress);

    // Maps the address of an ox cart to an entangled address to entanglement's basis points
    mapping(address => address[]) public oxCartToEntanglementAddresses;
    mapping(address => mapping(address => uint16)) public oxCartToEntanglementAddressToBasisPoints;
    mapping(address => uint256) public oxCartToToHiatusValue;

    address public referenceOxCart;

    constructor(address _referenceOxCart) {
        referenceOxCart = _referenceOxCart;
    }

    function newOxCartAndEntanglement(
        address[] memory _entanglementAddresses,
        uint16[] memory _basisPoints
    ) external returns(address) {
        require(_entanglementAddresses.length > 0, "Length of _entanglementAddresses must be more than zero");
        require(_entanglementAddresses.length == _basisPoints.length, "Length of _entanglementAddresses and _basisPoints arrays must be equal");
        // Create new OxCart
        address newOxCartAddress = Clones.clone(referenceOxCart);
        IOxCart oxCart = IOxCart(newOxCartAddress);
        oxCart.initialize(address(this));
        // Create entanglement between OxCart and GordianKnot
        newEntanglement(newOxCartAddress, _entanglementAddresses, _basisPoints);
        emit OxCartAndEntanglementCreated(msg.sender, newOxCartAddress, address(this));
        return newOxCartAddress;
    }

    function newEntanglement(
        address _oxCartAddress,
        address[] memory _entanglementAddresses,
        uint16[] memory _basisPoints
    ) internal {
        uint256 totalBasisPoints;
        for(uint256 i = 0; i < _entanglementAddresses.length; i++) {
            require((_basisPoints[i] > 0) && (_basisPoints[i] <= 10000), "_basisPoints may not be 0 and may not exceed 10000 (100%)");
            oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddresses[i]] = _basisPoints[i];
            totalBasisPoints += _basisPoints[i];
            emit NewEntanglement(_oxCartAddress, _entanglementAddresses[i], _basisPoints[i], _entanglementAddresses, _basisPoints);
        }
        require(totalBasisPoints == 10000, "_basisPoints must add up to 10000 together.");
        oxCartToEntanglementAddresses[_oxCartAddress] = _entanglementAddresses;
    }

    function fastenKnot(address _oxCartAddress) external {
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address.");
        address[] memory oxCartToEntanglementAddressesMemory = oxCartToEntanglementAddresses[_oxCartAddress]; // Load into memory to save some gas
        require(oxCartToEntanglementAddressesMemory.length > 0, "_oxCartAddress is not associated with an entanglement.");
        uint256 hiatusValue = oxCartToToHiatusValue[_oxCartAddress]; // Load into memory to save gas
        require(hiatusValue > 0, "Knot already fastened.");
        oxCartToToHiatusValue[_oxCartAddress] = 0; // Before ETH transfers in case of re-entrancy
        uint256 entanglementCutsTotal;
        for(uint256 i = 0; i < oxCartToEntanglementAddressesMemory.length; i++) {
            uint256 entanglementCut;
            if(i < (oxCartToEntanglementAddressesMemory.length - 1)) {
                entanglementCut = getPercentageOf(hiatusValue, oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][oxCartToEntanglementAddressesMemory[i]]);
            } else {
                entanglementCut = (hiatusValue - entanglementCutsTotal);
            }
            entanglementCutsTotal += entanglementCut;
            (bool entanglementDeliverySuccess, ) = oxCartToEntanglementAddressesMemory[i].call{value: entanglementCut}("");
            require(entanglementDeliverySuccess, "Entanglement cut delivery unsuccessful.");
        }
        emit KnotFastened(_oxCartAddress, msg.sender);
    }

    function getEntanglement(address _oxCartAddress) external view returns(address[] memory, uint16[] memory) {
        require(oxCartToEntanglementAddresses[_oxCartAddress].length > 0, "_oxCartAddress is not associated with an entanglement.");
        uint16[] memory entanglementAddressBasisPoints = new uint16[](oxCartToEntanglementAddresses[_oxCartAddress].length);
        for(uint256 i = 0; i < oxCartToEntanglementAddresses[_oxCartAddress].length; i++) {
            entanglementAddressBasisPoints[i] = oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][oxCartToEntanglementAddresses[_oxCartAddress][i]];
        }
        return (oxCartToEntanglementAddresses[_oxCartAddress], entanglementAddressBasisPoints);
    }

    function getPercentageOf(
        uint256 _amount,
        uint16 _basisPoints
    ) internal pure returns (uint256 value) {
        value = (_amount * _basisPoints) / 10000;
    }

    receive() external payable {
        require(oxCartToEntanglementAddresses[msg.sender].length > 0, "OxCart is not associated with an entanglement");
        oxCartToToHiatusValue[msg.sender] = oxCartToToHiatusValue[msg.sender] + msg.value;
        emit OxCartDelivery(msg.sender);
    }

}
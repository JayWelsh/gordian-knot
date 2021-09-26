//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract GordianKnot {

    event OxCartEntanglementFactoryConnected(address oxCartEntanglementFactoryAddress);
    event NewEntanglement(address indexed oxCartAddress, address indexed entanglementAddress, uint16 indexed basisPoints);
    event KnotFastened(address indexed oxCartAddress, address indexed knotFastener);

    // Determines which OxCartEntanglementFactory has permission to create new entanglements on this contract
    address public oxCartEntanglementFactory;

    // Maps the address of an ox cart to an entangled address to entanglement's basis points
    mapping(address => address[]) oxCartToEntanglementAddresses;
    mapping(address => mapping(address => uint16)) oxCartToEntanglementAddressToBasisPoints;
    mapping(address => uint256) oxCartToToHiatusValue;

    function newEntanglement(
        address _oxCartAddress,
        address[] memory _entanglementAddresses,
        uint16[] memory _basisPoints
    ) external {
        require(msg.sender == oxCartEntanglementFactory, "Only the OxCartEntanglementFactory contract may create new entanglements");
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address");
        require(oxCartToEntanglementAddresses[_oxCartAddress].length == 0, "Entanglement already exists, you need a new ox cart.");
        uint256 totalBasisPoints;
        for(uint256 i = 0; i < _entanglementAddresses.length; i++) {
            require((_basisPoints[i] > 0) && (_basisPoints[i] <= 10000), "_basisPoints may not be 0 and may not exceed 10000 (100%)");
            oxCartToEntanglementAddresses[_oxCartAddress].push(_entanglementAddresses[i]);
            oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][_entanglementAddresses[i]] = _basisPoints[i];
            totalBasisPoints += _basisPoints[i];
            emit NewEntanglement(_oxCartAddress, _entanglementAddresses[i], _basisPoints[i]);
        }
        require(totalBasisPoints == 10000, "_basisPoints must add up to 10000 together.");
    }

    function fastenKnot(address _oxCartAddress) external {
        require(_oxCartAddress != address(0), "_oxCartAddress may not be zero address.");
        require(oxCartToEntanglementAddresses[_oxCartAddress].length > 0, "_oxCartAddress is not associated with an entanglement.");
        require(oxCartToToHiatusValue[_oxCartAddress] > 0, "Knot already fastened.");
        uint256 entanglementCutsTotal;
        for(uint256 i = 0; i < oxCartToEntanglementAddresses[_oxCartAddress].length; i++) {
            uint256 entanglementCut;
            if(i < (oxCartToEntanglementAddresses[_oxCartAddress].length - 1)) {
                entanglementCut = getPercentageOf(oxCartToToHiatusValue[_oxCartAddress], oxCartToEntanglementAddressToBasisPoints[_oxCartAddress][oxCartToEntanglementAddresses[_oxCartAddress][i]]);
            } else {
                entanglementCut = (oxCartToToHiatusValue[_oxCartAddress] - entanglementCutsTotal);
            }
            entanglementCutsTotal += entanglementCut;
            (bool entanglementDeliverySuccess, ) = oxCartToEntanglementAddresses[_oxCartAddress][i].call{value: entanglementCut}("");
            require(entanglementDeliverySuccess, "Entanglement cut delivery unsuccessful.");
        }
        oxCartToToHiatusValue[_oxCartAddress] = 0;
        emit KnotFastened(_oxCartAddress, msg.sender);
    }

    function getPercentageOf(
        uint256 _amount,
        uint16 _basisPoints
    ) internal pure returns (uint256 value) {
        value = (_amount * _basisPoints) / 10000;
    }

    function setOxCartEntanglementFactory(address _oxCartEntanglementFactory) external {
        require(oxCartEntanglementFactory == address(0), "oxCartEntanglementFactory address can only be set once (already set).");
        oxCartEntanglementFactory = _oxCartEntanglementFactory;
        emit OxCartEntanglementFactoryConnected(_oxCartEntanglementFactory);
    }

    receive() external payable {
        require(oxCartToEntanglementAddresses[msg.sender].length > 0, "OxCart is not associated with an entanglement");
        oxCartToToHiatusValue[msg.sender] = oxCartToToHiatusValue[msg.sender] + msg.value;
    }

}
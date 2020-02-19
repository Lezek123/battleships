pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Secondary.sol";

contract GameOfShips {
    bool[10][10] bombsBoard;
    bytes32 private creationHash;
    uint bombCost;
    address payable creator;
    address payable bomber = address(0);
    uint timeout;
    
    struct Ship {
        uint8 beginX;
        uint8 beginY;
        bool vertical;
    }
    
    constructor(bytes32 _creationHash, uint _bombCost, uint _timeout) public payable {
        creator = msg.sender;
        creationHash = _creationHash;
        bombCost = _bombCost;
        timeout = _timeout;
    }
    
    function setBombs(bool[10][10] memory _bombsBoard) public payable {
        require(bomber == address(0), "Bomber already defined.");
        require(msg.value >= getBombsCost(_bombsBoard), "Not enough wei sent.");
        bomber = msg.sender;
        bombsBoard = _bombsBoard;
    }
    
    function getBombsCost(bool[10][10] memory _bombsBoard) private view returns(uint) {
        uint bombsCost = 0;
        for (uint8 x = 0; x < 10; ++x) {
            for (uint8 y = 0; y < 10; ++y) {
                if (_bombsBoard[x][y] == true) {
                    bombsCost += bombCost;
                }
            }
        }
        
        return bombsCost;
    }
    
    function claimCreatorWin(Ship[5] memory ships, bytes memory seed) public {
        require(getShipsHash(ships, seed) == creationHash, "Invalid hash provided.");
        bool allShipsDestroyed = true;
        for (uint8 i = 0; i < 5; ++i) {
            if (checkIfShipDestoyed(ships[i]) == false) {
                allShipsDestroyed = false;
            }
        }
        require(allShipsDestroyed == false, "Creator is not a winner.");
        creator.transfer(address(this).balance);
    }
    
    function claimBomberWin() public {
        require(bomber != address(0), "Bomber is not defined.");
        require(bomber == msg.sender, "Only bomber can call this function.");
        // TODO: Use timeout in blocks! (not ts, since it's less secure)
        require(now > timeout, "Timeout not reached yet.");
        bomber.transfer(address(this).balance);
    }
    
    function getShipsHash(Ship[5] memory ships, bytes memory seed) private pure returns(bytes32) {
        bytes memory bytesToHash = new bytes(15 + seed.length);
        for (uint8 i = 0; i < 5; ++i) {
            bytesToHash[i*3]   = bytes1(ships[i].beginX);
            bytesToHash[i*3+1] = bytes1(ships[i].beginY);
            bytesToHash[i*3+2] = bytes1(ships[i].vertical ? 1 : 0);
        }
        for (uint8 i = 0; i < seed.length; ++i) {
            bytesToHash[15+i] = seed[i];
        }
        return sha256(bytesToHash);
    }
    
    // Validates ship and check if it's destroyed by bombs.
    // Uses "require" contitions to check if the ship can be placed like that.
    function checkIfShipDestoyed(Ship memory ship) private view returns(bool) {
        if (ship.vertical == true) {
            // Vertical ship validation and checking
            require(ship.beginY <= 6, "Invalid ship placement.");
            uint8 endY = ship.beginY + 4;
            for (uint8 shipPartY = ship.beginY; shipPartY < endY; ++shipPartY) {
                if (bombsBoard[ship.beginX][shipPartY] == false) {
                    return false;
                }
            }
        }
        else {
            // Horizontal ship validation and checking
            require(ship.beginX <= 6, "Invalid ship placement.");
            uint8 endX = ship.beginX + 4;
            for (uint8 shipPartX = ship.beginX; shipPartX < endX; ++shipPartX) {
                if (bombsBoard[shipPartX][ship.beginY] == false) {
                    return false;
                }
            }
        }
        
        return true;
    }
}

contract GameOfShipsFactory {
    event GameCreated(GameOfShips _gameAddress);
    
    constructor() public {
    }

    function createGame(bytes32 _creationHash, uint _bombCost, uint _timeout) public payable {
        GameOfShips newGameAddress = (new GameOfShips).value(msg.value)(_creationHash, _bombCost, _timeout);
        emit GameCreated(newGameAddress);
    }
}
pragma solidity ^0.5.0;
// TODO: Try to eliminate the needf for it:
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/ownership/Secondary.sol";

contract GameOfShips {
    bool[10][10] public bombsBoard;
    bytes32 public creationHash;
    uint public bombCost;
    uint public prize;
    address payable public creator;
    address payable public bomber = address(0);
    uint8 public revealTimeoutBlocks;
    uint public joinTimeoutBlockNumber;
    uint public revealTimeoutBlockNumber;
    
    struct Ship {
        uint8 beginX;
        uint8 beginY;
        bool vertical;
    }
    
    constructor(
        address payable _creatorAddress,
        bytes32 _creationHash,
        uint _bombCost,
        uint8 _revealTimeoutBlocks,
        uint16 _joinTimeoutBlocks
    ) public payable {
        require(_revealTimeoutBlocks >= 10, "Minimum reveal timeout is 10 blocks"); // ~2m 20 sec (assuming 14 sec / block)
        require(_revealTimeoutBlocks <= 120, "Maximum reveal timeout is 120 blocks"); // ~28m (assuming 14 sec / block)
        require(_joinTimeoutBlocks >= 10, "Minimum join timeout is 10 blocks"); // ~2m 20 sec (assuming 14 sec / block)
        require(_joinTimeoutBlocks <= 43200, "Maximum join timeout is 43200 blocks"); // ~7 days (assuming 14 sec / block)
        // FIXME: Can only be called from factory! (Otherwise we cannot provide creator address this way...)
        // TODO: Bomb cost constraints?
        // TODO: Initial value / prize constraints?
        creator = _creatorAddress;
        creationHash = _creationHash;
        bombCost = _bombCost;
        prize = msg.value;
        revealTimeoutBlocks = _revealTimeoutBlocks;
        joinTimeoutBlockNumber = block.number + _joinTimeoutBlocks;
    }
    
    function setBombs(bool[10][10] memory _bombsBoard) public payable {
        require(bomber == address(0), "Bomber already defined.");
        uint bombsCost = getBombsCost(_bombsBoard);
        require(msg.value >= bombsCost, "Not enough wei sent.");
        // bombsCost / bombCost = number of bombs placed (this way we don't need to run the loops again)
        require(bombsCost / bombCost >= 25, "You need to place at least 25 bombs.");
        bomber = msg.sender;
        bombsBoard = _bombsBoard;
        revealTimeoutBlockNumber = block.number + revealTimeoutBlocks;
    }

    function getBombs() public view returns(bool[10][10] memory) {
        return bombsBoard;
    }
    
    function getBombsCost(bool[10][10] memory _bombsBoard) private view returns(uint) {
        uint bombsCost = 0;
        for (uint8 y = 0; y < 10; ++y) {
            for (uint8 x = 0; x < 10; ++x) {
                if (_bombsBoard[y][x] == true) {
                    bombsCost += bombCost;
                }
            }
        }
        
        return bombsCost;
    }

    function claimJoinTimeoutReturn() public {
        require(block.number > joinTimeoutBlockNumber, "Timeout not reached yet.");
        require(bomber == address(0), "The game already started.");
        creator.transfer(address(this).balance);
    }
    
    function claimCreatorWin(Ship[5] memory ships, bytes32 seed) public {
        require(getShipsHash(ships, seed) == creationHash, "Invalid hash provided.");
        bool allShipsDestroyed = true;
        for (uint8 i = 0; i < 5; ++i) {
            if (checkIfShipDestoyed(ships[i]) == false) {
                allShipsDestroyed = false;
            }
        }
        require(allShipsDestroyed == false, "Creator is not a winner.");
        creator.transfer(address(this).balance); // TODO: Maybe selfdestruct?
    }
    
    function claimBomberWin() public {
        require(bomber != address(0), "Bomber is not defined.");
        require(bomber == msg.sender, "Only bomber can call this function.");
        require(block.number > revealTimeoutBlockNumber, "Timeout not reached yet.");
        bomber.transfer(prize);
        creator.transfer(address(this).balance); // TODO: Maybe selfdestruct?
    }
    
    function getShipsHash(Ship[5] memory ships, bytes32 seed) private pure returns(bytes32) {
        bytes memory bytesToHash = new bytes(15 + 32);
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
                if (bombsBoard[shipPartY][ship.beginX] == false) {
                    return false;
                }
            }
        }
        else {
            // Horizontal ship validation and checking
            require(ship.beginX <= 6, "Invalid ship placement.");
            uint8 endX = ship.beginX + 4;
            for (uint8 shipPartX = ship.beginX; shipPartX < endX; ++shipPartX) {
                if (bombsBoard[ship.beginY][shipPartX] == false) {
                    return false;
                }
            }
        }
        
        return true;
    }
}

contract GameOfShipsFactory {
    event GameCreated(GameOfShips _gameAddress, address _creator);
    
    constructor() public {
    }

    function createGame(bytes32 _creationHash, uint _bombCost, uint8 _revealTimeoutBlocks, uint16 _joinTimeoutBlocks) public payable {
        GameOfShips newGameAddress = (new GameOfShips)
            .value(msg.value)
            (msg.sender, _creationHash, _bombCost, _revealTimeoutBlocks, _joinTimeoutBlocks);
        emit GameCreated(newGameAddress, msg.sender);
    }
}
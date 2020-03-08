pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

// TODO: SafeMath?

contract GameOfShips {
    struct Game {
        address payable creator;
        bytes32 creationHash;
        uint prize;
        uint bombCost;
        uint8 revealTimeoutBlocks;
        uint joinTimeoutBlockNumber;
        uint revealTimeoutBlockNumber;
        address payable bomber;
        uint payedBombCost;
        bool[10][10] bombsBoard;
    }

    struct Ship {
        uint8 beginX;
        uint8 beginY;
        bool vertical;
    }

    event GameCreated(uint32 _gameIndex, address _creator);
    event BombsPlaced(uint32 _gameIndex, address _bomber);

    mapping (uint32 => Game) public games;
    uint32 lastGameIndex = 0;
    
    function createGame(
        bytes32 _creationHash,
        uint _bombCost,
        uint8 _revealTimeoutBlocks,
        uint16 _joinTimeoutBlocks
    ) public payable {
        require(_revealTimeoutBlocks >= 10, "Minimum reveal timeout is 10 blocks"); // ~2m 20 sec (assuming 14 sec / block)
        require(_revealTimeoutBlocks <= 120, "Maximum reveal timeout is 120 blocks"); // ~28m (assuming 14 sec / block)
        require(_joinTimeoutBlocks >= 10, "Minimum join timeout is 10 blocks"); // ~2m 20 sec (assuming 14 sec / block)
        require(_joinTimeoutBlocks <= 43200, "Maximum join timeout is 43200 blocks"); // ~7 days (assuming 14 sec / block)
        // TODO: Bomb cost constraints
        // TODO: Prize constraints
        // Create new ref
        Game storage game = games[++lastGameIndex];
        // Populate only necessary (on creation) fields
        game.creator = msg.sender;
        game.creationHash = _creationHash;
        game.bombCost = _bombCost;
        game.prize = msg.value;
        game.revealTimeoutBlocks = _revealTimeoutBlocks;
        game.joinTimeoutBlockNumber = block.number + _joinTimeoutBlocks;
        emit GameCreated(lastGameIndex, msg.sender);
    }
    
    function setBombs(uint32 _gameIndex, bool[10][10] memory _bombsBoard) public payable {
        Game storage game = games[_gameIndex];
        require(game.bomber == address(0), "Bomber already defined.");
        // TODO: Send bombs as bytes, where each byte represents bomb's X and Y
        // so bombCost will be just bombs.length * game.bombCost.
        // Then avoid calculating whether bombs actually destroyed all the ships UNLESS
        // there is a dispute? (players did not agree on who won the game)
        // Dispute logic: Creator is forced to reveal his ships before reveal timeout, but he should
        // also send a bool signaling whether he won or not. If he lied and the dispute may be requested
        // by the bomber. Loser of a dispute pays settlement costs. If no dispute is requested
        // in given time - creator is assumed to be right.
        //
        // Or... Try to optimalize checking if ships were destroyed somehow...
        //
        uint bombsCost = getBombsCost(_bombsBoard, game.bombCost);
        require(msg.value >= bombsCost, "Not enough wei sent.");
        // bombsCost / bombCost = number of bombs placed (this way we don't need to run the loops again)
        require(bombsCost / game.bombCost >= 25, "You need to place at least 25 bombs.");
        game.bomber = msg.sender;
        game.bombsBoard = _bombsBoard;
        game.revealTimeoutBlockNumber = block.number + game.revealTimeoutBlocks;
        game.payedBombCost = msg.value;
        emit BombsPlaced(_gameIndex, msg.sender);
    }

    function getBombs(uint32 _gameIndex) public view returns(bool[10][10] memory) {
        return games[_gameIndex].bombsBoard;
    }
    
    function getBombsCost(bool[10][10] memory _bombsBoard, uint singleBombCost) private view returns(uint) {
        uint bombsCost = 0;
        for (uint8 y = 0; y < 10; ++y) {
            for (uint8 x = 0; x < 10; ++x) {
                if (_bombsBoard[y][x] == true) {
                    bombsCost += singleBombCost;
                }
            }
        }
        
        return bombsCost;
    }

    function claimJoinTimeoutReturn(uint32 _gameIndex) public {
        Game storage game = games[_gameIndex];
        require(block.number > game.joinTimeoutBlockNumber, "Timeout not reached yet.");
        require(game.bomber == address(0), "The game already started.");
        game.creator.transfer(game.prize);
    }
    
    function claimCreatorWin(uint32 _gameIndex, Ship[5] memory _ships, bytes32 _seed) public {
        Game storage game = games[_gameIndex];
        require(getShipsHash(_ships, _seed) == game.creationHash, "Invalid hash provided.");
        bool allShipsDestroyed = true;
        for (uint8 i = 0; i < 5; ++i) {
            if (checkIfShipDestoyed(_gameIndex, _ships[i]) == false) {
                allShipsDestroyed = false;
            }
        }
        require(allShipsDestroyed == false, "Creator is not a winner.");
        game.creator.transfer(game.prize + game.payedBombCost);
        // TODO: Emit event and remove game for active games list
    }
    
    function claimBomberWin(uint32 _gameIndex) public {
        Game storage game = games[_gameIndex];
        require(game.bomber != address(0), "Bomber is not defined.");
        require(game.bomber == msg.sender, "Only bomber can call this function.");
        require(block.number > game.revealTimeoutBlockNumber, "Timeout not reached yet.");
        game.bomber.transfer(game.prize);
        game.creator.transfer(game.payedBombCost);
        // TODO: Emit event and remove game for active games list
    }
    
    function getShipsHash(Ship[5] memory _ships, bytes32 _seed) private pure returns(bytes32) {
        // TODO: Optimalize that?
        bytes memory bytesToHash = new bytes(15 + 32);
        for (uint8 i = 0; i < 5; ++i) {
            bytesToHash[i*3]   = bytes1(_ships[i].beginX);
            bytesToHash[i*3+1] = bytes1(_ships[i].beginY);
            bytesToHash[i*3+2] = bytes1(_ships[i].vertical ? 1 : 0);
        }
        for (uint8 i = 0; i < _seed.length; ++i) {
            bytesToHash[15+i] = _seed[i];
        }
        return sha256(bytesToHash);
    }
    
    // Validates ship and check if it's destroyed by bombs.
    // Uses "require" contitions to check if the ship can be placed like that.
    function checkIfShipDestoyed(uint32 _gameIndex, Ship memory _ship) private view returns(bool) {
        Game storage game = games[_gameIndex];
        if (_ship.vertical == true) {
            // Vertical ship validation and checking
            require(_ship.beginY <= 6, "Invalid ship placement.");
            uint8 endY = _ship.beginY + 4;
            for (uint8 shipPartY = _ship.beginY; shipPartY < endY; ++shipPartY) {
                if (game.bombsBoard[shipPartY][_ship.beginX] == false) {
                    return false;
                }
            }
        }
        else {
            // Horizontal ship validation and checking
            require(_ship.beginX <= 6, "Invalid ship placement.");
            uint8 endX = _ship.beginX + 4;
            for (uint8 shipPartX = _ship.beginX; shipPartX < endX; ++shipPartX) {
                if (game.bombsBoard[_ship.beginY][shipPartX] == false) {
                    return false;
                }
            }
        }
        
        return true;
    }
}
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
        uint128 bombsBoard; // Board encoded into bits
    }

    struct Ship {
        uint8 beginX;
        uint8 beginY;
        bool vertical;
    }

    event GameCreated(uint32 _gameIndex, address _creator, uint _prize, uint _bombCost);
    event BombsPlaced(uint32 _gameIndex, address _bomber, uint128 _bombsBoard);
    event ShipsRevealed(uint32 _gameIndex, Ship[5] _ships);
    event GameFinished(uint32 _gameIndex);
    event RevealTimeout(uint32 _gameIndex);
    event JoinTimeout(uint32 _gameIndex);

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
        emit GameCreated(lastGameIndex, msg.sender, msg.value, _bombCost);
    }
    
    function setBombs(uint32 _gameIndex, uint128 _bombsBoard) public payable {
        Game storage game = games[_gameIndex];
        require(game.creator != address(0), 'Game not found.');
        require(game.bomber == address(0), "Bomber already defined.");
        uint bombsCost = getBombsCost(_bombsBoard, game.bombCost);
        require(msg.value >= bombsCost, "Not enough wei sent.");
        // bombsCost / bombCost = number of bombs placed (this way we don't need to run the loops again)
        require(bombsCost / game.bombCost >= 25, "You need to place at least 25 bombs.");
        game.bomber = msg.sender;
        game.bombsBoard = _bombsBoard;
        game.revealTimeoutBlockNumber = block.number + game.revealTimeoutBlocks;
        game.payedBombCost = msg.value;
        emit BombsPlaced(_gameIndex, msg.sender, _bombsBoard);
    }

    function getBoardFieldAtPosition(uint128 _bombsBoard, uint128 _position) private view returns(bool) {
        // Check byte at given index using bitwise AND operator
        return (_bombsBoard & (2 ** _position)) != 0;
    }

    function getBoardFieldAtXY(uint128 _bombsBoard, uint8 _x, uint8 _y) private view returns(bool) {
        return getBoardFieldAtPosition(_bombsBoard, _y * 10 + _x);
    }
    
    function getBombsCost(uint128 _bombsBoard, uint singleBombCost) private view returns(uint) {
        uint bombsCost = 0;
        for (uint8 i = 0; i < 100; ++i) {
            if (getBoardFieldAtPosition(_bombsBoard, i)) bombsCost += singleBombCost;
        }
        
        return bombsCost;
    }

    function claimJoinTimeoutReturn(uint32 _gameIndex) public {
        // Store in memory, because we want to use it's values AFTER deleting from storage
        Game memory game = games[_gameIndex];
        require(game.creator != address(0), 'Game not found.');
        require(block.number > game.joinTimeoutBlockNumber, "Timeout not reached yet.");
        require(game.bomber == address(0), "The game already started.");
        delete games[_gameIndex];
        emit JoinTimeout(_gameIndex);
        emit GameFinished(_gameIndex);
        game.creator.transfer(game.prize);
    }
    
    function finishGame(uint32 _gameIndex, Ship[5] memory _ships, bytes32 _seed) public {
        // Store in memory, because we want to use it's values AFTER deleting from storage
        Game memory game = games[_gameIndex];
        require(game.creator != address(0), 'Game not found.');
        require(getShipsHash(_ships, _seed) == game.creationHash, "Invalid hash provided.");
        uint128 shipsBoard = validateShipsAndCreateBoard(_ships);
        delete games[_gameIndex];
        emit ShipsRevealed(_gameIndex, _ships);
        emit GameFinished(_gameIndex);
        if ((shipsBoard & game.bombsBoard) == shipsBoard) {
            // Bomber won
            game.bomber.transfer(game.prize);
            game.creator.transfer(game.payedBombCost);
        }
        else {
            // Creator won
            game.creator.transfer(game.prize + game.payedBombCost);
        }
    }
    
    function claimBomberWinByTimeout(uint32 _gameIndex) public {
        // Store in memory, because we want to use it's values AFTER deleting from storage
        Game memory game = games[_gameIndex];
        require(game.creator != address(0), 'Game not found.');
        require(game.bomber != address(0), "Bomber is not defined.");
        require(block.number > game.revealTimeoutBlockNumber, "Timeout not reached yet.");
        delete games[_gameIndex];
        emit RevealTimeout(_gameIndex);
        emit GameFinished(_gameIndex);
        game.bomber.transfer(game.prize);
        game.creator.transfer(game.payedBombCost);
    }
    
    function getShipsHash(Ship[5] memory _ships, bytes32 _seed) private pure returns(bytes32) {
        bytes memory bytesToHash = new bytes(15 + 32);
        for (uint8 i = 0; i < 5; ++i) {
            bytesToHash[i*3] = bytes1(_ships[i].beginX);
            bytesToHash[i*3+1] = bytes1(_ships[i].beginY);
            bytesToHash[i*3+2] = bytes1(_ships[i].vertical ? 1 : 0);
        }
        for (uint8 i = 0; i < _seed.length; ++i) {
            bytesToHash[15+i] = _seed[i];
        }
        return sha256(bytesToHash);
    }

    function validateShipsAndCreateBoard(Ship[5] memory _ships) private view returns(uint128) {
        uint128 shipsBoard = 0;
        for (uint8 i = 0; i < 5; ++i) {
            Ship memory ship = _ships[i];
            if (ship.vertical == true) {
                // Vertical ship validation
                require(ship.beginY <= 6, "Invalid ship placement.");
                // Placing on bit-board + overlay check
                uint8 endY = ship.beginY + 4;
                for (uint8 shipPartY = ship.beginY; shipPartY < endY; ++shipPartY) {
                    uint128 shipPartPosition = shipPartY * 10 + ship.beginX;
                    require(getBoardFieldAtPosition(shipsBoard, shipPartPosition) == false, 'Placed ships cannot overlay!');
                    shipsBoard += 2 ** shipPartPosition;
                }
            }
            else {
                // Horizontal ship validation
                require(ship.beginX <= 6, "Invalid ship placement.");
                // Placing on a bit-board + overlay check
                uint8 endX = ship.beginX + 4;
                for (uint8 shipPartX = ship.beginX; shipPartX < endX; ++shipPartX) {
                    uint128 shipPartPosition = ship.beginY * 10 + shipPartX;
                    require(getBoardFieldAtPosition(shipsBoard, shipPartPosition) == false, 'Placed ships cannot overlay!');
                    shipsBoard += 2 ** shipPartPosition;
                }
            }
        }

        return shipsBoard;
    }
}
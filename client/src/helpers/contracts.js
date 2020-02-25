import GameOfShipsAbi from '../contracts/GameOfShips.json';
import TruffleContract from "@truffle/contract";
import { getWeb3 } from './web3';
import { round } from './math';

export const fetchGameContractData = async (address) => {
    const web3 = await getWeb3();
    const GameOfShips = TruffleContract(GameOfShipsAbi);
    GameOfShips.setProvider(web3.currentProvider);
    const GameOfShipsInstance = await GameOfShips.at(address);

    const prizeWei = await GameOfShipsInstance.prize();
    const bombCostWei = await GameOfShipsInstance.bombCost();
    const joinTimeoutBlockNumber = await GameOfShipsInstance.joinTimeoutBlockNumber();
    const revealTimeoutBlocks = await GameOfShipsInstance.revealTimeoutBlocks();
    const bombsBoard = await GameOfShipsInstance.getBombs();

    return {
        contractInstance: GameOfShipsInstance,
        prize: round(web3.utils.fromWei(prizeWei), 8),
        bombCost: round(web3.utils.fromWei(bombCostWei), 8),
        joinTimeoutBlockNumber: joinTimeoutBlockNumber.toNumber(),
        revealTimeoutBlocks: revealTimeoutBlocks.toNumber(),
        bombsBoard
    }
}
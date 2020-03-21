import Web3 from 'web3';
import axios from 'axios';
import MainContractAbi from '../contracts/GameOfShips.json';
import TruffleContract from "@truffle/contract";
import { round } from './math';
import { shipsToArrShips, boardToBN, BNToBoard } from './converters';
import { calcGameHash } from './hashing';
import Cookies from 'universal-cookie';
import GAME_STATUSES from '../constants/gameStatuses';
import EVENTS from '../constants/events';

const cookies = new Cookies();
const SEED_REVEAL_INTERVAL_TIME = 10000;
const SEED_REVEAL_ENDPOINT = '/reveal';

export default class ContractsManager {
    initializing = false;
    initialized = false;

    _seedRevealInterval = null;
    _web3 = null;
    _factoryInstance = null;

    constructor() {
        if (!ContractsManager.instance) {
            ContractsManager.instance = this;
        }

        return ContractsManager.instance;
    }

    load = async () => {
        if (!this.initializing && !this.initialized) {
            this.initializing = true;
            
            this._web3 = await this.initWeb3();
            
            const MainContract = TruffleContract(MainContractAbi);
            MainContract.setProvider(this._web3.currentProvider);
            this._mainContractInstance = await MainContract.deployed();

            this._seedRevealInterval = setInterval(this.seedRevealDuty, SEED_REVEAL_INTERVAL_TIME);

            this.initializing = false;
            this.initialized = true;
        }
        else if (this.initializing) {
            // Wait until the instance is initialized
            await new Promise((resolve, reject) => {
                let waitingInterval = setInterval(() => {
                    if (this.initialized) {
                        clearInterval(waitingInterval);
                        resolve();
                    }
                }, 10);
            });
        }
    }

    initWeb3 = async () => {
        let provider = null;
        if (window.ethereum) {
            provider = window.ethereum;
            await window.ethereum.enable();
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            provider = window.web3.currentProvider;
        }
        else {
            throw 'Cannot init web3';
        }
        return new Web3(provider);
    }
    
    getWeb3 = async () => {
        try {
            await this.load();
        } catch(e) {
            return null;
        }
        return this._web3;
    }

    getMainContractInstance = async () => {
        await this.load();
        return this._mainContractInstance;
    }

    getUserAddr = async () => {
        await this.load();
        return this._web3.currentProvider.selectedAddress;
    }

    // If status not provided then fetch all active
    fetchGames = async (status = 'active', page = 1, usersOnly = false) => {
        await this.load();
        const userAddr = await this.getUserAddr();
        const endpoint = `/games/${status}${ usersOnly ? `/${userAddr}` : '' }/${ page }`;
        const games = (await axios.get(endpoint)).data;
        return games.map(game => ({
            ...game,
            isUserCreator: this.compareAddr(userAddr, game.creatorAddr),
            isUserBomber: this.compareAddr(userAddr, game.bomberAddr)
        }));
    }

    fetchUsersGames = async (status = 'active', page = 1) => {
        return this.fetchGames(status, page, true);
    }

    getUsersGamesCount = async (status = 'active') => {
        const userAddr = await this.getUserAddr();
        return (await axios.get(`/games/count/${ status }/${ userAddr }`)).data.count;
    }

    fetchAllGames = async (status = 'active', page = 1) => {
        return this.fetchGames(status, page, false);
    }

    getAllGamesCount = async (status = 'active') => {
        return (await axios.get(`/games/count/${ status }`)).data.count;
    }

    // TODO: Remove?
    queryIndexesByEvents = async (eventsData) => {
        await this.load();

        let events = [];
        for (let {eventName, filter = {}, fromBlock = 0} of eventsData) {
            const eventOptions = { filter, fromBlock };
            events = events.concat(await this._mainContractInstance.getPastEvents(eventName, eventOptions));
        }
        events = events.sort((a, b) => a.blockNumber > b.blockNumber ? -1 : b.transactionIndex - a.transactionIndex);

        const indexes = events.map(event => event.args._gameIndex.toNumber());
        // Return only unique indexes
        return indexes.filter((gameIndex, arrIndex) => indexes.indexOf(gameIndex) === arrIndex);
    }

    // TODO: Remove?
    fetchActiveGamesByIndexes = async (indexes) => {
        let games = [];
        for (let index of indexes) {
            const data = await this.fetchGameData(index);
            if (!data) continue;
            games.push({ index, data });
        }

        return games;
    }

    // TODO: Remove?
    fetchGameData = async (index) => {
        await this.load();

        const originalData = await this._mainContractInstance.games(index);

        if (this.isEmptyAddr(originalData.creator)) return null;

        let gameData = {
            status: this.isEmptyAddr(originalData.bomber) ? GAME_STATUSES.NEW : GAME_STATUSES.IN_PROGRESS,
            creationHash: originalData.creationHash,
            prize: round(this._web3.utils.fromWei(originalData.prize), 8),
            bombCost: round(this._web3.utils.fromWei(originalData.bombCost), 8),
            paidBombsCost: round(this._web3.utils.fromWei(originalData.paidBombsCost), 8),
            joinTimeoutBlockNumber: originalData.joinTimeoutBlockNumber.toNumber(),
            revealTimeoutBlocks: originalData.revealTimeoutBlocks.toNumber(),
            revealTimeoutBlockNumber: originalData.revealTimeoutBlockNumber.toNumber(),
            bombsBoard: BNToBoard(originalData.bombsBoard),
            creatorAddr: this.isEmptyAddr(originalData.creator) ? null : originalData.creator,
            bomberAddr: this.isEmptyAddr(originalData.bomber) ? null : originalData.bomber,
        };

        const userAddr = await this.getUserAddr();
        gameData.isUserCreator = this.compareAddr(userAddr, gameData.creatorAddr);
        gameData.isUserBomber = this.compareAddr(userAddr, gameData.bomberAddr);

        return gameData;
    }

    // TODO: Remove?
    fetchGamesHistoricalData = async (indexes) => {
        await this.load();
        let games = [];
        for (let index of indexes) {
            const data = await this.fetchGameHistoricalData(index);
            if (!data) continue;
            games.push({ index, data });
        }

        return games;
    }

    // TODO: Remove?
    fetchGameHistoricalData = async (index) => {
        await this.load();
        const eventOptions = { filter: { _gameIndex: index }, fromBlock: 0 };
        const eventsToFetch = [EVENTS.GAME_CREATED, EVENTS.BOMBS_PLACED, EVENTS.SHIPS_REVEALED, EVENTS.GAME_FINISHED];
        const eventsData = {};
        
        for (let event of eventsToFetch) {
            const eventsFetched = await this._mainContractInstance.getPastEvents(EVENTS.GAME_CREATED, eventOptions);
            eventsData[event] = eventsFetched.length ? eventsFetched[0] : { args: {} };
        }

        if (!eventsData[EVENTS.GAME_FINISHED].args._gameIndex) return null;

        const { _creator, _prize, _bombCost } = eventsData[EVENTS.GAME_CREATED].args;
        const { _bomber, _bombsBoard } = eventsData[EVENTS.BOMBS_PLACED].args;
        const { _ships } = eventsData[EVENTS.SHIPS_REVEALED];

        let gameData = {
            status: GAME_STATUSES.FINISHED,
            prize: round(this._web3.utils.fromWei(_prize), 8),
            bombCost: round(this._web3.utils.fromWei(_bombCost), 8),
            bombsBoard: BNToBoard(_bombsBoard),
            ships: _ships, // TODO: Arr ships to obj ships
            creatorAddr: this.isEmptyAddr(_creator) ? null : _creator,
            bomberAddr: this.isEmptyAddr(_bomber) ? null : _bomber
        }

        const userAddr = await this.getUserAddr();
        gameData.isUserCreator = this.compareAddr(userAddr, gameData.creatorAddr);
        gameData.isUserBomber = this.compareAddr(userAddr, gameData.bomberAddr);

        return gameData;
    }

    // Atomic operations for adding/removing seeds to/from seeds cookie:
    getStoredSeeds = () => {
        const seedsJson = window.localStorage.getItem('seeds');
        return seedsJson ? JSON.parse(seedsJson) : [];
    }

    addSeedToStorage = (newSeed) => {
        const seeds = this.getStoredSeeds();
        seeds.push(newSeed);
        window.localStorage.setItem('seeds', JSON.stringify(seeds));
    }

    removeSeedFromStorage = (seedToRemove) => {
        const seeds = this.getStoredSeeds();
        const seedIndex = seeds.findIndex(seed => JSON.stringify(seed) === JSON.stringify(seedToRemove));
        seeds.splice(seedIndex, 1);
        window.localStorage.setItem('seeds', JSON.stringify(seeds));
    }

    createGame = async ({ initialValue, bombCost, revealTimeoutBlocks, joinTimeoutBlocks, ships }) => {
        await this.load();
		let creationSeed = Buffer.alloc(32);
		window.crypto.getRandomValues(creationSeed);

        this.addSeedToStorage({ seed: creationSeed, ships });
		
		const creatorAddr = await this.getUserAddr();

		const gameHash = calcGameHash(ships, creationSeed);
		bombCost = this._web3.utils.toWei(bombCost);
        initialValue = this._web3.utils.toWei(initialValue);
        
		const gameConstructorArgs = [
			gameHash,
			bombCost,
			revealTimeoutBlocks,
			joinTimeoutBlocks,
			{ from: creatorAddr, value: initialValue }
        ];
        console.log('Creating new game with args:', gameConstructorArgs);
        
		return await this._mainContractInstance.createGame(...gameConstructorArgs);
    }

    setBombsInGame = async (gameIndex, bombsBoard, ethCost) => {
        await this.load();

        const playerAddr = await this.getUserAddr();

        return await this._mainContractInstance.setBombs(
            gameIndex,
            boardToBN(bombsBoard),
            { from: playerAddr, value: this._web3.utils.toWei(round(ethCost, 8).toString()) }
        );
    }

    finishGame = async (gameIndex, ships, seed) => {
        await this.load();

        const playerAddr = await this.getUserAddr();

        return await this._mainContractInstance.finishGame(
            gameIndex,
            shipsToArrShips(ships),
            seed,
            { from: playerAddr }
        )
    }

    claimBomberTimeoutWin = async (gameIndex) => {
        await this.load();

        const playerAddr = await this.getUserAddr();

        return await this._mainContractInstance.claimBomberWinByTimeout(
            gameIndex,
            { from: playerAddr }
        );
    }

    claimJoinTimeoutReturn = async (gameIndex) => {
        await this.load();

        const playerAddr = await this.getUserAddr();

        return await this._mainContractInstance.claimJoinTimeoutReturn(
            gameIndex,
            { from: playerAddr }
        );
    }

    seedRevealDuty = async () => {
        await this.load();

        console.log('Reveal duty...');

        const userAddr = await this.getUserAddr();
        const gamesAwaitingReveal = (await axios.get(`/games/awaiting_reveal/${ userAddr }`)).data;

        for (let game of gamesAwaitingReveal) {
            const { creationHash } = game;
            console.log('Found potential game:', game);
            const storedSeeds = this.getStoredSeeds();
            const seedToReveal = storedSeeds.find(({ seed, ships }) => {
                const seedDataHashStr = '0x' + calcGameHash(ships, Buffer.from(seed.data)).toString('hex');
                return seedDataHashStr === creationHash;
            });
            if (seedToReveal) {
                console.log('Found seed to reveal');
                try {
                    const wasSeedRevealed = (await axios.get(`${SEED_REVEAL_ENDPOINT}/${ game.gameIndex }`)).data;
                    if (!wasSeedRevealed) {
                        await axios.post(SEED_REVEAL_ENDPOINT, {
                            gameIndex: game.gameIndex,
                            ships: seedToReveal.ships,
                            seed: seedToReveal.seed.data
                        });
                        // TODO: Remove only after the game finished with some confirmations
                        // So it can be re-sent to server (if the server restarts)
                        this.removeSeedFromStorage(seedToReveal);
                    }
                    else {
                        console.log('Already revealed');
                    }
                } catch(e) {
                    console.error('COULD NOT REVEAL SEED - SOME REQUEST HAS FAILED!');
                    console.log(e);
                }
            }
        }
    }

    isEmptyAddr = (addr) => (!addr || /^0x0+$/.test(addr));

    compareAddr = (addr1, addr2) => {
        return (
            !this.isEmptyAddr(addr1)
            && !this.isEmptyAddr(addr2)
            && addr1.toLowerCase() === addr2.toLowerCase()
        );
    }
}
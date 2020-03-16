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
        // TODO: Some sane error handling here (like displaying "Download Metamask" page etc.)
        let provider = null;
        if (window.ethereum) {
            provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                alert('This website will not work properly unless you enable MetaMask access :(');
                return null;
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            alert('You need MetaMask in order use this website!');
            return null;
        }
        return new Web3(provider);
    }
    
    getWeb3 = async () => {
        await this.load();
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

    // If status is null then fetch all active
    fetchUsersGames = async (status = null) => {
        await this.load();
        const userAddr = await this.getUserAddr();
        const indexes = await this.queryIndexesByEvents([
            { eventName: EVENTS.GAME_CREATED, filter: { _creator: userAddr } },
            { eventName: EVENTS.BOMBS_PLACED, filter: { _bomber: userAddr } },
        ]);
        let games = status === GAME_STATUSES.FINISHED ?
            await this.fetchGamesHistoricalData(indexes)
            : await this.fetchActiveGamesByIndexes(indexes);
        if (status && status !== GAME_STATUSES.FINISHED) {
            games = games.filter(({data}) => data.status === status);
        }

        return games;
    }

    // If status is null then fetch all active
    fetchAllGames = async (status = null) => {
        await this.load();
        let indexes, games;
        if (status !== GAME_STATUSES.FINISHED) {
            indexes = await this.queryIndexesByEvents([{eventName: EVENTS.GAME_CREATED}]);
            games = await this.fetchActiveGamesByIndexes(indexes);
            if (status) games = games.filter(({data}) => data.status === status)
        }
        else {
            indexes = await this.queryIndexesByEvents([{eventName:EVENTS.GAME_FINISHED}]);
            games = await this.fetchGamesHistoricalData(indexes);
        }
        return games;
    }

    queryIndexesByEvents = async (eventsData) => {
        await this.load();

        let events = [];
        for (let {eventName, filter = {}, fromBlock = 0} of eventsData) {
            const eventOptions = { filter, fromBlock };
            events = events.concat(await this._mainContractInstance.getPastEvents(eventName, eventOptions));
        }
        // TODO: Divide into "batches" (to use with pagination) using fromBlock and toBlock
        // Sort events by "newest"
        events = events.sort((a, b) => a.blockNumber > b.blockNumber ? -1 : b.transactionIndex - a.transactionIndex);

        const indexes = events.map(event => event.args._gameIndex.toNumber());
        // Return only unique indexes
        return indexes.filter((gameIndex, arrIndex) => indexes.indexOf(gameIndex) === arrIndex);
    }

    fetchActiveGamesByIndexes = async (indexes) => {
        let games = [];
        for (let index of indexes) {
            const data = await this.fetchGameData(index);
            if (!data) continue;
            games.push({ index, data });
        }

        return games;
    }

    fetchGameData = async (index) => {
        await this.load();

        const originalData = await this._mainContractInstance.games(index);

        if (this.isEmptyAddr(originalData.creator)) return null;

        let gameData = {
            status: this.isEmptyAddr(originalData.bomber) ? GAME_STATUSES.NEW : GAME_STATUSES.IN_PROGRESS,
            creationHash: originalData.creationHash,
            prize: round(this._web3.utils.fromWei(originalData.prize), 8),
            bombCost: round(this._web3.utils.fromWei(originalData.bombCost), 8),
            payedBombCost: round(this._web3.utils.fromWei(originalData.payedBombCost), 8),
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

		try {
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
			await this._mainContractInstance.createGame(...gameConstructorArgs);
		} catch(e) {
			console.log(e);
		}
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

        console.log('Seed reveal duty...');

        const usersCreatedGamesIndexes = await this.queryIndexesByEvents([
            { eventName: EVENTS.GAME_CREATED, filter: { _creator: await this.getUserAddr() } }
        ]);
        const usersCreatedGames = await this.fetchActiveGamesByIndexes(usersCreatedGamesIndexes);

        for (let game of usersCreatedGames) {
            const { bomberAddr, creationHash } = game.data;
            if (!bomberAddr) continue;
            console.log('Found potential game:', game);
            const storedSeeds = this.getStoredSeeds();
            const seedToReveal = storedSeeds.find(({ seed, ships }) => {
                const seedDataHashStr = '0x' + calcGameHash(ships, Buffer.from(seed.data)).toString('hex');
                return seedDataHashStr === creationHash;
            });
            if (seedToReveal) {
                console.log('Found seed to reveal');
                try {
                    const wasSeedRevealedRes = await fetch(`${SEED_REVEAL_ENDPOINT}/${ game.index }`);
                    const wasSeedRevealed = await wasSeedRevealedRes.json();
                    if (!wasSeedRevealed) {
                        await axios.post(SEED_REVEAL_ENDPOINT, {
                            gameIndex: game.index,
                            ships: seedToReveal.ships,
                            seed: seedToReveal.seed.data
                        });
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
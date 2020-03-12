import Web3 from 'web3';
import axios from 'axios';
import MainContractAbi from '../contracts/GameOfShips.json';
import TruffleContract from "@truffle/contract";
import { round } from './math';
import { shipsToArrShips, boardToBN, BNToBoard } from './converters';
import { calcGameHash } from './hashing';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const SEED_REVEAL_INTERVAL_TIME = 10000;
const SEED_REVEAL_ENDPOINT = '/reveal';

const EVENT_GAME_CREATED = 'GameCreated';
const EVENT_BOMBS_PLACED = 'BombsPlaced';

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

    fetchActiveUsersGames = async () => {
        await this.load();
        const userAddr = await this.getUserAddr();

        const createdGamesIndexes = await this.fetchGameIndexesByEvent(EVENT_GAME_CREATED, { _creator: userAddr });
        const bombedGamesIndexes = await this.fetchGameIndexesByEvent(EVENT_BOMBS_PLACED, { _bomber: userAddr });
        const usersGamesIndexes = createdGamesIndexes.concat(bombedGamesIndexes);
        const games = await this.fetchActiveGamesByIndexes(usersGamesIndexes);

        return games;
    }

    fetchActiveGames = async () => {
        const indexes = await this.fetchGameIndexesByEvent(EVENT_GAME_CREATED);
        return await this.fetchActiveGamesByIndexes(indexes);
    }

    fetchGameIndexesByEvent = async (eventName, filter = {}) => {
        await this.load();
        // TODO: Divide into "batches" (to use with pagination) using fromBlock and toBlock
        const eventOptions = { filter, fromBlock: 0 };
        let events = await this._mainContractInstance.getPastEvents(eventName, eventOptions);
        // Sort events by "newest"
        events = events.sort((a, b) => a.blockNumber > b.blockNumber ? -1 : b.transactionIndex - a.transactionIndex);

        return events.map(event => event.args._gameIndex.toNumber());
    }

    fetchActiveGamesByIndexes = async (indexes) => {
        // Make gameIndexes unique
        indexes = indexes.filter((gameIndex, arrIndex) => indexes.indexOf(gameIndex) === arrIndex);

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

        return {
            creationHash: originalData.creationHash,
            prize: round(this._web3.utils.fromWei(originalData.prize), 8),
            bombCost: round(this._web3.utils.fromWei(originalData.bombCost), 8),
            payedBombCost: round(this._web3.utils.fromWei(originalData.payedBombCost), 8),
            joinTimeoutBlockNumber: originalData.joinTimeoutBlockNumber.toNumber(),
            revealTimeoutBlocks: originalData.revealTimeoutBlocks.toNumber(),
            bombsBoard: BNToBoard(originalData.bombsBoard),
            creatorAddr: this.isEmptyAddr(originalData.creator) ? null : originalData.creator,
            bomberAddr: this.isEmptyAddr(originalData.bomber) ? null : originalData.bomber
        };
    }

    // Atomic operations for adding/removing seeds to/from seeds cookie:

    addSeedToCookie = (newSeed) => {
        const seeds = cookies.get('seeds') || [];
        seeds.push(newSeed);
        const newSeedsExpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // One year from now
        cookies.set('seeds', seeds, { expires: newSeedsExpiry, path: '/' });
    }

    removeSeedFromCookie = (seedToRemove) => {
        const seeds = cookies.get('seeds') || [];
        const seedIndex = seeds.findIndex(seed => JSON.stringify(seed) === JSON.stringify(seedToRemove));
        seeds.splice(seedIndex, 1);
        const newSeedsExpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // One year from now
        cookies.set('seeds', seeds, { expires: newSeedsExpiry, path: '/' })
    }

    createGame = async ({ initialValue, bombCost, revealTimeoutBlocks, joinTimeoutBlocks, ships }) => {
        await this.load();
		let creationSeed = Buffer.alloc(32);
		window.crypto.getRandomValues(creationSeed);

        this.addSeedToCookie({ seed: creationSeed, ships });
		
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
            { from: playerAddr, value: this._web3.utils.toWei(ethCost.toString()) }
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

    seedRevealDuty = async () => {
        await this.load();

        console.log('Seed reveal duty...');

        const usersCreatedGamesIndexes = await this.fetchGameIndexesByEvent(
            EVENT_GAME_CREATED,
            { _creator: await this.getUserAddr() }
        );
        const usersCreatedGames = await this.fetchActiveGamesByIndexes(usersCreatedGamesIndexes);

        for (let game of usersCreatedGames) {
            const { bomberAddr, creationHash } = game.data;
            if (!bomberAddr) continue;
            console.log('Found potential game:', game);
            const cookieSeeds = cookies.get('seeds') || [];
            const seedToReveal = cookieSeeds.find(({ seed, ships }) => {
                const seedDataHashStr = '0x' + calcGameHash(ships, Buffer.from(seed.data)).toString('hex');
                console.log('Comaparing hashes:', seedDataHashStr, creationHash);
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
                        this.removeSeedFromCookie(seedToReveal);
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
import Web3 from 'web3';
import axios from 'axios';
import GameOfShipsAbi from '../contracts/GameOfShips.json';
import GameOfShipsFactoryAbi from '../contracts/GameOfShipsFactory.json';
import TruffleContract from "@truffle/contract";
import { round } from './math';
import { shipsToBuffer } from './converters';
import { sha256 } from './hashing';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const SEED_REVEAL_INTERVAL_TIME = 10000;
const SEED_REVEAL_ENDPOINT = '/reveal';

export default class ContractsManager {
    initializing = false;
    initialized = false;

    _seedRevealInterval = null;
    _web3 = null;
    _factoryInstance = null;
    _gameContract = null;

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
            
            const FactoryContract = TruffleContract(GameOfShipsFactoryAbi);
            FactoryContract.setProvider(this._web3.currentProvider);
            this._factoryInstance = await FactoryContract.deployed();

            this._gameContract = TruffleContract(GameOfShipsAbi);
            this._gameContract.setProvider(this._web3.currentProvider);

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

    fetchUsersGameContracts = async () => {
        await this.load();
        const userAddr = this._web3.currentProvider.selectedAddress;
        // TODO: Some way to optimalize that instead of fetching ALL contracts?
        let contracts = await this.fetchGameContractsWithData();
        return contracts.filter(({data}) => 
            this.compareAddr(data.creatorAddr, userAddr) || this.compareAddr(data.bomberAddr, userAddr)
        );
    }

    fetchGameContractsWithData = async (filter = {}) => {
        await this.load();
        const eventOptions = { filter, fromBlock: 0 };
        const events = await this._factoryInstance.getPastEvents('GameCreated', eventOptions);

        let contracts = [];
        for (let event of events) {
            const address = event.args._gameAddress;
            const creationTx = event.creationHash;
            const { instance, data } = await this.fetchGameContractWithData(address);
            contracts.push({ creationTx, address, instance, data });
        };

        return contracts;
    }

    fetchGameContractWithData = async (address) => {
        await this.load();
        const instance = await this._gameContract.at(address);
        const data = await this.getGameContractData(instance);
        return { address, instance, data };
    }

    getGameContractData = async (gameInstance) => {
        await this.load();

        const creationHash = await gameInstance.creationHash();
        const creatorAddr = await gameInstance.creator();
        const bomberAddr = await gameInstance.bomber();
        const prizeWei = await gameInstance.prize();
        const bombCostWei = await gameInstance.bombCost();
        const joinTimeoutBlockNumber = await gameInstance.joinTimeoutBlockNumber();
        const revealTimeoutBlocks = await gameInstance.revealTimeoutBlocks();
        const bombsBoard = await gameInstance.getBombs();

        return {
            creationHash,
            prize: round(this._web3.utils.fromWei(prizeWei), 8),
            bombCost: round(this._web3.utils.fromWei(bombCostWei), 8),
            joinTimeoutBlockNumber: joinTimeoutBlockNumber.toNumber(),
            revealTimeoutBlocks: revealTimeoutBlocks.toNumber(),
            bombsBoard,
            creatorAddr: this.isEmptyAddr(creatorAddr) ? null : creatorAddr,
            bomberAddr: this.isEmptyAddr(bomberAddr) ? null : bomberAddr
        }
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
		
		const creatorAddr = this._web3.currentProvider.selectedAddress;

		try {
			const gameHash = sha256(shipsToBuffer(ships, creationSeed));
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
			await this._factoryInstance.createGame(...gameConstructorArgs);
		} catch(e) {
			console.log(e);
		}
    }

    // TODO: Maybe implement and use "setBombs" event watch for that?
    seedRevealDuty = async () => {
        await this.load();

        console.log('Seed reveal duty...');

        const usersCreatedGames = await this.fetchGameContractsWithData({
            creator: this._web3.currentProvider.selectedAddress,
        });

        for (let gameContract of usersCreatedGames) {
            const { bomberAddr, creationHash } = gameContract.data;
            if (!bomberAddr) continue;
            console.log('Found potential game:', gameContract);
            const cookieSeeds = cookies.get('seeds') || [];
            const seedToReveal = cookieSeeds.find(({ seed, ships }) => {
                const seedDataHashStr = '0x' + sha256(shipsToBuffer(ships, Buffer.from(seed.data))).toString('hex');
                console.log('Comapring hashes:', seedDataHashStr, creationHash);
                return seedDataHashStr === creationHash;
            });
            if (seedToReveal) {
                try {
                    const wasSeedRevealedRes = await fetch(`${SEED_REVEAL_ENDPOINT}/${ gameContract.address }`);
                    const wasSeedRevealed = await wasSeedRevealedRes.json();
                    if (!wasSeedRevealed) {
                        await axios.post(SEED_REVEAL_ENDPOINT, {
                            address: gameContract.address,
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
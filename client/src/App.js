import React, { Component } from 'react';
// import { Provider } from 'react-redux';
// import store from './redux/store';
import ethLogo from './images/eth-logo.png';
import TruffleContract from "@truffle/contract";
import { getWeb3 } from './helpers/web3';
import CreateGameForm from './components/createGameForm';
import GameOfShipsAbi from './contracts/GameOfShips.json';
import GameOfShipsFactoryAbi from './contracts/GameOfShipsFactory.json';
import { shipsToBuffer } from './helpers/converters';
import { sha256 } from './helpers/hashing';
import GamesList from './components/gamesList';
import Nav from './components/navigation/Nav';
import { Switch, Route, withRouter } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { CREATE_GAME_PATH, GAMES_LIST_PATH, GAME_PATH } from './constants/routes';
import { centerFlex } from './styles/basic';
import JoinedGame from './components/joinedGame';
import { fetchGameContractData } from './helpers/contracts';

const StyledApp = styled.div`
	background-color: #282c34;
	min-height: 100vh;
	font-size: 16px;
	color: white;
	${ centerFlex('column') }
`;

const AppHeader = styled.header`
	${ centerFlex('column') }
`;

const AppLogo = styled.img`
    height: 300px;
    filter: drop-shadow(0 2px 3px rgba(255, 255, 255, 1));
`;

class App extends Component {
	state = {
		initialized: false,
		games: [],
	}

	async componentWillMount() {
		this.web3 = await getWeb3();

		const GameOfShipsFactory = TruffleContract(GameOfShipsFactoryAbi);
		GameOfShipsFactory.setProvider(this.web3.currentProvider);

		const GameOfShips = TruffleContract(GameOfShipsAbi);
		GameOfShips.setProvider(this.web3.currentProvider);

		this._gameFactoryInstance = await GameOfShipsFactory.deployed();

		// TODO: https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#getpastevents ?
		const eventOptions = {
			filter: {},
			fromBlock: 0
		};
		this._gameFactoryInstance.GameCreated(eventOptions)
			.on('data', this.processGameCreationEvent)
			.on('changed', this.processGameCrationEventCancellation)
			.on('error', console.error);

		this.setState({ initialized: true });
	}

	processGameCreationEvent = async (event) => {
		const gameAddress = event.args._gameAddress;

		const contractData = await fetchGameContractData(gameAddress);

		this.setState(
			( { games } ) =>
			( { games: [ ...games, {
				creationTx: event.transactionHash,
				address: gameAddress,
				prize: contractData.prize,
				bombCost: contractData.bombCost,
				joinTimeoutBlockNumber: contractData.joinTimeoutBlockNumber,
				revealTimeoutBlocks: contractData.revealTimeoutBlocks,
				bombsBoard: contractData.bombsBoard
			} ] } )
		);
	}

	processGameCrationEventCancellation = (event) => {
		// TODO: EVENT WAS REMOVED FROM THE BLOCKCHAIN! HANDLE THAT
	}

	handleGameCreation = async ({ initialValue, bombCost, revealTimeoutBlocks, joinTimeoutBlocks, ships }) => {
		if (!this.state.initialized) {
			alert('Game factory not yet initialized!');
			return;
		}

		let creationSeed = Buffer.alloc(32);
		window.crypto.getRandomValues(creationSeed);
		const creatorAddr = this.web3.currentProvider.selectedAddress;

		try {
			const gameHash = sha256(shipsToBuffer(ships, creationSeed));
			bombCost = this.web3.utils.toWei(bombCost);
			initialValue = this.web3.utils.toWei(initialValue);

			const gameConstructorArgs = [
				gameHash,
				bombCost,
				revealTimeoutBlocks,
				joinTimeoutBlocks,
				{ from: creatorAddr, value: initialValue }
			];

			console.log('Creating new game with args:', gameConstructorArgs);
			await this._gameFactoryInstance.createGame(...gameConstructorArgs);
		} catch(e) {
			console.log(e);
		}
	}
	render() {
		return (
			<StyledApp>
				{ this.props.location.pathname !== '/' && <Nav fixed={1}/> }
				<Switch>
					<Route path={ GAME_PATH } render={ props => {
						return <JoinedGame address={props.match.params.id} />;
					 } } />
					<Route path={ CREATE_GAME_PATH }>
						<CreateGameForm onSubmit={ this.handleGameCreation } />
					</Route>
					<Route path={ GAMES_LIST_PATH }>
						<GamesList games={ this.state.games } />
					</Route>
					<Route path="/">
						<AppHeader>
							<AppLogo src={ethLogo} alt="Ethereum logo"/>
							<h1>Game of ships</h1>
						</AppHeader>
						<Nav />
					</Route>
				</Switch>
			</StyledApp>
		);
	}
}

export default withRouter(App);

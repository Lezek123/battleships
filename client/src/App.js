import React, { Component } from 'react';
// import { Provider } from 'react-redux';
// import store from './redux/store';
import ethLogo from './images/eth-logo.png';
import CreateGameForm from './components/createGameForm';
import GamesListWrapper from './components/gamesListWrapper';
import Nav from './components/navigation/Nav';
import { Switch, Route, withRouter } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { CREATE_GAME_PATH, GAMES_LIST_PATH, GAME_PATH, MY_GAMES_PATH } from './constants/routes';
import { centerFlex } from './styles/basic';
import Game from './components/gamePage';
import ContractsManager from './helpers/contracts';
import Loader from './components/loader';

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
	}

	async componentWillMount() {
		this._contractsManager = new ContractsManager();
		this._web3 = await this._contractsManager.getWeb3();
		this.setState({ initialized: true });
	}

	handleGameCreation = async (gameData) => {
		this._contractsManager.createGame(gameData);
	}

	render() {
		if (!this.state.initialized) return <StyledApp><Loader /></StyledApp>;
		return (
			<StyledApp>
				{ this.props.location.pathname !== '/' && <Nav fixed={1}/> }
				<Switch>
					<Route path={ MY_GAMES_PATH }>
						<GamesListWrapper fetchMethod={ this._contractsManager.fetchUsersGameContracts } />
					</Route>
					<Route path={ GAME_PATH } render={ props => {
						return <Game address={props.match.params.id} />;
					 } } />
					<Route path={ CREATE_GAME_PATH }>
						<CreateGameForm onSubmit={ this.handleGameCreation } />
					</Route>
					<Route path={ GAMES_LIST_PATH }>
						<GamesListWrapper fetchMethod={ this._contractsManager.fetchGameContractsWithData } />
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

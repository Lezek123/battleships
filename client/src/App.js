import React, { Component } from 'react';
import CreateGameForm from './components/createGameForm';
import GamesListWrapper from './components/gamesListWrapper';
import Nav from './components/navigation/Nav';
import { Switch, Route, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { CREATE_GAME_PATH, GAMES_LIST_PATH, GAME_PATH, MY_GAMES_PATH } from './constants/routes';
import { centerFlex } from './styles/basic';
import color, { colorWithAlpha } from './constants/colors';
import { breakpointHit, breakpointNotHit, breakpoints as bp } from './constants/breakpoints';
import { Link } from 'react-router-dom';
import { BigButton } from './components/navigation/buttons';
import Game from './components/gamePage';
import ContractsManager from './helpers/contracts';
import Loader from './components/loader';
import ShootingShipLogo from './components/shootingShipLogo';
import CalimNotifications from './components/claimNotifications';

const StyledApp = styled.div`
	background-color: ${ colorWithAlpha(color.MAIN_BG, 0.9) };
	min-height: 100vh;
	font-size: 16px;
	color: white;
	${ centerFlex('column') }
	overflow: hidden;
`;

const AppBody = styled.div`
	align-self: stretch;
	flex-grow: 1;
	${ centerFlex('column') }
	@media ${ breakpointNotHit(bp.SMALL_LAPTOP) } {
		margin: 0 250px;
	}
	@media ${ breakpointHit(bp.SMALL_LAPTOP) } {
		margin: 0 20px;
	}
`

const AppHeader = styled.header`
	${ centerFlex('column') }
`;
const AppTitle = styled.h1`
	font-family: 'Krona One';
	text-align: center;
	@media ${ breakpointHit(bp.TABLET) } {
		font-size: 24px;
	}
`;
const StartScreenLinks = styled.div`
	display: flex;
	@media ${ breakpointHit(bp.TABLET) } {
		flex-wrap: wrap;
	}
`;
const StartScreenLink = styled(BigButton)`
	margin: 0 20px;
	@media ${ breakpointHit(bp.TABLET) } {
		width: 100%;
		margin: 10px 0;
	}
`;

class App extends Component {
	state = {
		initialized: false,
		mainContractAddr: null,
	}

	async componentWillMount() {
		this._contractsManager = new ContractsManager();
		this._web3 = await this._contractsManager.getWeb3();
		const MainContractInstance = await this._contractsManager.getMainContractInstance();
		this.setState({ initialized: true, mainContractAddr: MainContractInstance.address });
	}

	handleGameCreation = async (gameData) => {
		await this._contractsManager.createGame(gameData);
	}

	render() {
		if (!this.state.initialized) return <StyledApp><Loader /></StyledApp>;
		return (
			<StyledApp>
				{ this.props.location.pathname !== '/' && (<>
					<Nav />
					<CalimNotifications />
				</>) }
				<AppBody>
					<Switch>
						<Route path={ MY_GAMES_PATH }>
							<GamesListWrapper fetchMethod={ this._contractsManager.fetchUsersGames } />
						</Route>
						<Route path={ GAME_PATH } render={ props => {
							return <Game index={props.match.params.id} />;
						} } />
						<Route path={ CREATE_GAME_PATH }>
							<CreateGameForm onSubmit={ this.handleGameCreation } />
						</Route>
						<Route path={ GAMES_LIST_PATH }>
							<GamesListWrapper fetchMethod={ this._contractsManager.fetchAllGames } />
						</Route>
						<Route path="/">
							<AppHeader>
								<ShootingShipLogo />
								<AppTitle>Ethereum Battleships</AppTitle>
								<StartScreenLinks>
									<StartScreenLink as={Link} to={CREATE_GAME_PATH}>
										Create a game
									</StartScreenLink>
									<StartScreenLink as={Link} to={GAMES_LIST_PATH}>
										Join a game
									</StartScreenLink>
								</StartScreenLinks>
							</AppHeader>
						</Route>
					</Switch>
				</AppBody>
			</StyledApp>
		);
	}
}

export default withRouter(App);

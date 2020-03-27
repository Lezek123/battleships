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
import mmDownloadImg from './images/mm-download.png';

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

const MetamaskScreen = styled.div`
	font-size: 20px;
	${ centerFlex('column') };
	background: rgba(0,0,0,0.2);
	padding: 20px 40px;
	border-radius: 20px;
`;
const MetamaskScreenInfo = styled.div`
	margin-bottom: 20px;
	font-weight: 600;
	text-align: center;
	max-width: 600px;
`;
const MetamaskScreenInfoTitle = styled.h1`
	font-size: 40px;
	margin: 10px 0;
`;
const MetamaskDownload = styled.img`
	width: 100%;
	max-width: 600px;
`;

class App extends Component {
	state = {
		initialized: false,
		metamaskScreen: false,
		mainContractAddr: null,
	}

	async componentWillMount() {
		this._contractsManager = new ContractsManager();
		this._web3 = await this._contractsManager.getWeb3();
		if (this._web3) {
			const MainContractInstance = await this._contractsManager.getMainContractInstance();
			this.setState({ initialized: true, mainContractAddr: MainContractInstance.address });
		}
		else {
			this.setState({ metamaskScreen: true });
		}
	}

	render() {
		const { initialized, metamaskScreen } = this.state;
		const { fetchUsersGames, getUsersGamesCount, fetchAllGames, getAllGamesCount } = this._contractsManager;

		if (metamaskScreen) {
			return (
				<StyledApp>
					<MetamaskScreen>
						<MetamaskScreenInfo>
							<MetamaskScreenInfoTitle>Hold on!</MetamaskScreenInfoTitle>
							You're gonna need an Ethereum wallet extension for your browser in order to interact with this page!
						</MetamaskScreenInfo>
						<a href={`https://metamask.io`} target="_blank">
							<MetamaskDownload src={ mmDownloadImg }/>
						</a>
					</MetamaskScreen>
				</StyledApp>
			)
		}
		else if (!initialized) {
			return <StyledApp><Loader /></StyledApp>;
		}

		return (
			<StyledApp>
				{ this.props.location.pathname !== '/' && (<>
					<Nav />
					<CalimNotifications />
				</>) }
				<AppBody>
					<Switch>
						<Route path={ MY_GAMES_PATH }>
							<GamesListWrapper fetchMethod={ fetchUsersGames } countMethod={ getUsersGamesCount } />
						</Route>
						<Route path={ GAME_PATH } render={ props => {
							return <Game index={props.match.params.id} />;
						} } />
						<Route path={ CREATE_GAME_PATH }>
							<CreateGameForm />
						</Route>
						<Route path={ GAMES_LIST_PATH }>
							<GamesListWrapper fetchMethod={ fetchAllGames } countMethod={ getAllGamesCount } />
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

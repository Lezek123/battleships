import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import FinishedGame from './finishedGame';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';
import GAME_STATUSES from '../constants/gameStatuses';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import axios from 'axios';

const GamePage = styled.div`
    ${ centerFlex('column') };
    width: 100%;
`;
const GamePageHeader = styled.h1`
    margin: 0;
    margin-bottom: 20px;
`;

const UPDATE_INTERVAL_TIME = 5000;

export default class Game extends Component {
    state = { game: null, fetching: true }
    
    async componentWillMount() {
        this._contractsManager = new ContractsManager();
        this.reloadGame();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.index !== this.props.index) this.reloadGame();
    }

    componentWillUnmount() {
        if (this.updateInterval) clearInterval(this.updateInterval);
    }

    reloadGame = async () => {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.setState({ fetching: true }, this.updateGame);
        this.updateInterval = setInterval(this.updateGame, UPDATE_INTERVAL_TIME);
    }

    updateGame = async () => {
        const { index } = this.props;
        const game = (await axios.get(`/games/by_index/${ index }`)).data;
        const userAddr = await this._contractsManager.getUserAddr();
        game.isUserCreator = this._contractsManager.compareAddr(userAddr, game.creatorAddr);
        game.isUserBomber = this._contractsManager.compareAddr(userAddr, game.bomberAddr);
        this.setState({ game, fetching: false });
    }



    render() {
        const { game, fetching } = this.state;
        
        if (fetching) return <Loader text="Fetching game data..." />;
        if (!game) return <h1>Game not found!</h1>; // TODO: 404 component
        
        return (
            <GamePage>
                <GamePageHeader>Game #{ game.gameIndex }</GamePageHeader>
                { game.status === GAME_STATUSES.NEW && <JoinedGame game={game} /> }
                { game.status === GAME_STATUSES.IN_PROGRESS && <PendingGame game={game} /> }
                { game.status === GAME_STATUSES.FINISHED && <FinishedGame game={game} /> }
            </GamePage>
        );
    }
}

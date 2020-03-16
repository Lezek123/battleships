import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import FinishedGame from './finishedGame';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';
import GAME_STATUSES from '../constants/gameStatuses';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';

const GamePage = styled.div`
    ${ centerFlex('column') };
    width: 100%;
`;
const GamePageHeader = styled.h1`
    margin: 0;
    margin-bottom: 20px;
`;

export default class Game extends Component {
    state = { gameData: null, fetching: true }
    
    async componentWillMount() {
        this._contractsManager = new ContractsManager();
        this.loadGame();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.index !== this.props.index) this.loadGame();
    }

    loadGame = async () => {
        const { index } = this.props;
        this.setState({ fetching: true }, async () => {
            const gameData = await this._contractsManager.fetchGameData(index);
            this.setState({ gameData, fetching: false });
        });
    }

    render() {
        const { index } = this.props;
        const { gameData, fetching } = this.state;
        
        if (fetching) return <Loader text="Fetching game data..." />;
        
        return (
            <GamePage>
                <GamePageHeader>Game #{ index }</GamePageHeader>
                { gameData.status === GAME_STATUSES.NEW && <JoinedGame index={index} gameData={gameData} /> }
                { gameData.status === GAME_STATUSES.IN_PROGRESS && <PendingGame index={index} gameData={gameData} /> }
                { gameData.status === GAME_STATUSES.FINISHED && <FinishedGame index={index} /> }
            </GamePage>
        );
    }
}

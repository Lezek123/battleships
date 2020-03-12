import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import FinishedGame from './finishedGame';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';

export default class Game extends Component {
    state = { gameData: null, fetching: true }
    
    async componentWillMount() {
        const { index } = this.props;
        this._contractsManager = new ContractsManager();
        const gameData = await this._contractsManager.fetchGameData(index);
        this.setState({ gameData, fetching: false });
    }

    render() {
        const { index } = this.props;
        const { gameData, fetching } = this.state;
        
        if (fetching) return <Loader text="Fetching game data..." />;
        else if (!gameData) return <FinishedGame index={index} />;
        else if (!gameData.bomberAddr) return <JoinedGame index={index} gameData={gameData} />;
        else return <PendingGame index={index} gameData={gameData} />;
    }
}

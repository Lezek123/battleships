import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';

export default class Game extends Component {
    state = { gameData: null }
    
    async componentWillMount() {
        const { index } = this.props;
        this._contractsManager = new ContractsManager();
        const gameData = await this._contractsManager.fetchGameData(index);
        this.setState({ gameData });
    }

    render() {
        const { index } = this.props;
        const { gameData } = this.state;
        
        if (!gameData) return <Loader text="Fetching game data..." />;
        return (
            !gameData.bomberAddr ?
                <JoinedGame index={index} gameData={gameData} />
                : <PendingGame index={index} gameData={gameData} />
        )
    }
}

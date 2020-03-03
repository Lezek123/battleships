import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';

export default class Game extends Component {
    state = { gameContract: null }
    
    async componentWillMount() {
        const { address } = this.props;
        this._contractsManager = new ContractsManager();
        const gameContract = await this._contractsManager.fetchGameContractWithData(address);
        this.setState({ gameContract });
    }

    render() {
        const { gameContract } = this.state;
        
        if (!this.state.gameContract) return <Loader text="Fetching game data..." />;
        return (
            !gameContract.data.bomberAddr ?
                <JoinedGame gameContract={gameContract} />
                : <PendingGame gameContract={gameContract} />
        )
    }
}

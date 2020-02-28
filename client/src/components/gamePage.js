import React, { Component } from 'react';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';

const StyledGame = styled.div`
    width: 550px;
    ${ centerFlex('column') };
`;

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
        
        if (!this.state.gameContract) return <StyledGame><Loader text="Fetching game data..." /></StyledGame>;
        return (
            <StyledGame>
                { !gameContract.data.bomberAddr ?
                    <JoinedGame gameContract={gameContract} />
                    : <PendingGame gameContract={gameContract} />
                }
            </StyledGame>
        )
    }
}

import React, { Component } from 'react';
import styled from 'styled-components';
import { compareBoards } from './board';
import ShipsBoard from './shipsBoard';
import BombsBoard from './bombsBoard';
import { centerFlex } from '../styles/basic';
import Loader from './loader';

const StyledGame = styled.div`
    width: 550px;
    ${ centerFlex('column') };
`;
const Snapshots = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;
const ShipsSnapshot = styled.div`
    width: calc(50% - 5px);
    ${ centerFlex('column') };
`;
const BombsSnapshot = styled.div`
    width: calc(50% - 5px);
    ${ centerFlex('column') };
`;

export default class PendingGame extends Component {
    state = {
        placedShips: null,
        shipsBoard: null
    };

    componentWillMount = async () => {
        const revealedDataRes = await fetch('/reveal/' + this.props.gameContract.address);
        const revealedData = await revealedDataRes.json();
        if (revealedData && revealedData.ships) this.setState({ placedShips: revealedData.ships });
    }

    determineWinner = () => {
        const { shipsBoard } = this.state;
        const { gameContract: { data: { bombsBoard } } } = this.props;

        if (shipsBoard) {
            const compareRes = compareBoards(shipsBoard, bombsBoard);
            const creatorWin = compareRes.some(row => row.some(resField => resField === 'a'));
            return creatorWin ? 'creator' : 'bomber';
        }

        return null;
    }

    recieveShipsBoard = (board) => {
        if (this.state.placedShips) {
            this.setState({ shipsBoard: board });
        }
    }
    
    render() {
        const { placedShips } = this.state;
        const { gameContract: { data: { bombsBoard } } } = this.props;
        const winner = this.determineWinner();

        return (
            <StyledGame>
                <Snapshots>
                    <ShipsSnapshot>
                        { placedShips ? 
                            <>
                                <h2>Ships:</h2>
                                <ShipsBoard onChange={ this.recieveShipsBoard } lockedShips={ placedShips }/>
                            </>
                            :
                            <Loader text="Checking for revealed ships board..."/>
                        }
                    </ShipsSnapshot>
                    <BombsSnapshot>
                        <h2>Bombs:</h2>
                        <BombsBoard lockedBoard={ bombsBoard }/>
                    </BombsSnapshot>
                </Snapshots>
                { winner && <h2>Winner: { winner }</h2> }
            </StyledGame>
        )
    }
}

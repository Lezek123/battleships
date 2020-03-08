import React, { Component } from 'react';
import styled from 'styled-components';
import { compareBoards } from './board';
import ShipsBoard from './shipsBoard';
import BombsBoard from './bombsBoard';
import { centerFlex } from '../styles/basic';
import Loader from './loader';
import { PrizeIcon } from '../constants/icons';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';

const StyledGame = styled.div`
    width: 100%;
    max-width: 1100px;
    ${ centerFlex('column') };
`;
const Snapshots = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    @media ${ breakpointHit(bp.PHONE )} {
        flex-wrap: wrap;
    }
`;
const SnapshotTitle = styled.h2`
    margin: 0;
`;
const ShipsSnapshot = styled.div`
    width: calc(50% - 10px);
    ${ centerFlex('column') };
    @media ${ breakpointHit(bp.PHONE )} {
        margin-top: 20px;
        width: 100%;
    }
`;
const BombsSnapshot = styled.div`
    width: calc(50% - 10px);
    ${ centerFlex('column') };
    @media ${ breakpointHit(bp.PHONE )} {
        margin-top: 20px;
        width: 100%;
    }
`;
const WinnerInfo = styled.div`
    font-size: 22px;
    margin: 20px 0;
    font-weight: bold;
    display: flex;
    align-items: center;
`;
const WinnerIcon = styled.div`
    margin-right: 8px;
`;

export default class PendingGame extends Component {
    state = {
        placedShips: null,
        shipsBoard: null
    };

    componentWillMount = async () => {
        const revealedDataRes = await fetch('/reveal/' + this.props.index);
        const revealedData = await revealedDataRes.json();
        if (revealedData && revealedData.ships) this.setState({ placedShips: revealedData.ships });
    }

    determineWinner = () => {
        const { shipsBoard } = this.state;
        const { gameData: { bombsBoard } } = this.props;

        if (shipsBoard) {
            const compareRes = compareBoards(shipsBoard, bombsBoard);
            const creatorWin = compareRes.some(row => row.some(resField => resField === 'a'));
            return creatorWin ? 'Creator' : 'Bomber';
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
        const { gameData: { bombsBoard } } = this.props;
        const winner = this.determineWinner();

        return (
            <StyledGame>
                <Snapshots>
                    <ShipsSnapshot>
                        { placedShips ? 
                            <>
                                <SnapshotTitle>Ships:</SnapshotTitle>
                                <ShipsBoard onChange={ this.recieveShipsBoard } lockedShips={ placedShips }/>
                            </>
                            :
                            <Loader text="Checking for revealed ships board..."/>
                        }
                    </ShipsSnapshot>
                    <BombsSnapshot>
                        <SnapshotTitle>Bombs:</SnapshotTitle>
                        <BombsBoard lockedBoard={ bombsBoard }/>
                    </BombsSnapshot>
                </Snapshots>
                { winner && <WinnerInfo><WinnerIcon><PrizeIcon /></WinnerIcon> Winner: { winner }</WinnerInfo> }
            </StyledGame>
        )
    }
}

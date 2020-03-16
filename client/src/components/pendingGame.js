import React, { Component } from 'react';
import styled from 'styled-components';
import { compareBoards } from './board';
import ShipsBoard from './shipsBoard';
import BombsBoard from './bombsBoard';
import { centerFlex } from '../styles/basic';
import Loader from './loader';
import { PrizeIcon, RevealTimeoutIcon } from '../constants/icons';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';
import ContractManager from '../helpers/contracts';
import TimeoutClaim from './timeoutClaim';
import Claim from './claim';

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
        revealedShips: null,
        revealedSeed: null,
        shipsBoard: null,
        winner: null,
        isUserWinner: null,
        revealTimeoutReached: false,
    };

    componentWillMount = async () => {
        this._contractManager = new ContractManager();
        // TODO: This should actually be checked via interval
        const revealedDataRes = await fetch('/reveal/' + this.props.index);
        const revealedData = await revealedDataRes.json();
        if (revealedData && revealedData.ships) {
            this.setState({
                revealedShips: revealedData.ships,
                revealedSeed: revealedData.seed,
            });
        }
    }

    determineWinner = async () => {
        const { shipsBoard } = this.state;
        const { gameData: { bombsBoard, isUserCreator, isUserBomber } } = this.props;

        if (shipsBoard) {
            const compareRes = compareBoards(shipsBoard, bombsBoard);
            const isCreatorWinner = compareRes.some(row => row.some(resField => resField === 'a'));

            const isUserWinner = (isCreatorWinner && isUserCreator) || (!isCreatorWinner && isUserBomber)
            this.setState({ isUserWinner, winner: isCreatorWinner ? 'Creator' : 'Bomber' })
        }
    }

    recieveShipsBoard = (board) => {
        if (this.state.revealedShips) {
            this.setState({ shipsBoard: board }, this.determineWinner);
        }
    }

    claimWin = async () => {
        const { index: gameIndex } = this.props;
        const { revealedShips, revealedSeed } = this.state;
        return await this._contractManager.finishGame(
            gameIndex,
            revealedShips,
            Buffer.from(revealedSeed, 'base64')
        );
    }

    render() {
        const { revealedShips, winner, isUserWinner, revealTimeoutReached } = this.state;
        const { index, gameData: { bombsBoard, prize, payedBombCost, revealTimeoutBlockNumber, isUserCreator, isUserBomber } } = this.props;

        return (
            <StyledGame>
                <Snapshots>
                    <ShipsSnapshot>
                        { revealedShips ? 
                            <>
                                <SnapshotTitle>Ships:</SnapshotTitle>
                                <ShipsBoard onChange={ this.recieveShipsBoard } lockedShips={ revealedShips }/>
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
                <TimeoutClaim
                    timeoutName="Reveal"
                    timeoutIcon={ <RevealTimeoutIcon /> }
                    timeoutBlock={ revealTimeoutBlockNumber }
                    canUserClaim={ isUserBomber }
                    claimMethod={ async () => await this._contractManager.claimBomberTimeoutWin(index) }
                    claimAmount={ prize }/>
                {/* After winner is known */}
                { (winner !== null) && (
                    <WinnerInfo>
                        <WinnerIcon><PrizeIcon /></WinnerIcon> Winner: { winner }
                    </WinnerInfo>
                ) }
                { isUserWinner && <Claim amount={ isUserCreator ? payedBombCost + prize : prize } claimMethod={ this.claimWin }/> }
            </StyledGame>
        )
    }
}

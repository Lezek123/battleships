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
import { round } from '../helpers/math';

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
    };

    // TODO: Refresh interval (to check for revealed ships)

    determineWinner = async () => {
        const { shipsBoard } = this.state;
        const { game: { bombsBoard, isUserCreator, isUserBomber } } = this.props;

        if (shipsBoard) {
            const compareRes = compareBoards(shipsBoard, bombsBoard);
            const isCreatorWinner = compareRes.some(row => row.some(resField => resField === 'a'));

            const isUserWinner = (isCreatorWinner && isUserCreator) || (!isCreatorWinner && isUserBomber)
            this.setState({ isUserWinner, winner: isCreatorWinner ? 'Creator' : 'Bomber' })
        }
    }

    recieveShipsBoard = (board) => {
        if (this.props.game.revealedData.ships.length) {
            this.setState({ shipsBoard: board }, this.determineWinner);
        }
    }

    claimWin = async () => {
        const { game: { gameIndex, revealedData: { ships, seed } } } = this.props;
        return await this._contractManager.finishGame(
            gameIndex,
            ships,
            Buffer.from(seed, 'base64')
        );
    }

    render() {
        const { winner, isUserWinner } = this.state;
        const { game: { gameIndex, bombsBoard, prize, paidBombsCost, revealTimeoutBlockNumber, isUserCreator, isUserBomber, revealedData } } = this.props;

        return (
            <StyledGame>
                <Snapshots>
                    <ShipsSnapshot>
                        { revealedData.ships.length ? 
                            <>
                                <SnapshotTitle>Ships:</SnapshotTitle>
                                <ShipsBoard onChange={ this.recieveShipsBoard } lockedShips={ revealedData.ships }/>
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
                    claimMethod={ async () => await this._contractManager.claimBomberTimeoutWin(gameIndex) }
                    claimAmount={ prize }/>
                {/* After winner is known */}
                { (winner !== null) && (
                    <WinnerInfo>
                        <WinnerIcon><PrizeIcon /></WinnerIcon> Winner: { winner }
                    </WinnerInfo>
                ) }
                { isUserWinner && <Claim amount={ isUserCreator ? (paidBombsCost + prize) : prize } claimMethod={ this.claimWin }/> }
            </StyledGame>
        )
    }
}

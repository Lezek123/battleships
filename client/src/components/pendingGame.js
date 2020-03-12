import React, { Component } from 'react';
import styled from 'styled-components';
import { compareBoards } from './board';
import ShipsBoard from './shipsBoard';
import BombsBoard from './bombsBoard';
import { centerFlex } from '../styles/basic';
import Loader from './loader';
import { PrizeIcon } from '../constants/icons';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';
import { BigButton, themes } from './navigation/buttons';
import ContractManager from '../helpers/contracts';

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

const ClaimedInfo = styled.div``;

export default class PendingGame extends Component {
    state = {
        revealedShips: null,
        revealedSeed: null,
        shipsBoard: null,
        isCreatorWinner: null,
        isUserWinner: null,
        claimTx: null,
    };

    componentWillMount = async () => {
        this._contractManager = new ContractManager();
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
        const { gameData: { bombsBoard, creatorAddr, bomberAddr } } = this.props;

        if (shipsBoard) {
            const compareRes = compareBoards(shipsBoard, bombsBoard);
            const isCreatorWinner = compareRes.some(row => row.some(resField => resField === 'a'));

            const userAddr = await this._contractManager.getUserAddr();
            const isUserWinner = (
                ((await this._contractManager.compareAddr(creatorAddr, userAddr)) && isCreatorWinner)
                || ((await this._contractManager.compareAddr(bomberAddr, userAddr)) && !isCreatorWinner)
            );
            this.setState({ isCreatorWinner, isUserWinner })
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
        try {
            let result = await this._contractManager.finishGame(
                gameIndex,
                revealedShips,
                Buffer.from(revealedSeed, 'base64')
            );
            this.setState({ claimTx: result.tx })
        } catch(e) {
            // TOOD: Handle potential error
        }
    }
    
    render() {
        const { revealedShips, isCreatorWinner, isUserWinner, claimTx } = this.state;
        const { gameData: { bombsBoard, prize, payedBombCost } } = this.props;

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
                {/* TODO: Reveal timeout countdown, revealed ships check interval etc. */}
                { (isCreatorWinner !== null) && (
                    <WinnerInfo>
                        <WinnerIcon><PrizeIcon /></WinnerIcon> Winner: { isCreatorWinner ? 'Creator' : 'Bomber' }
                    </WinnerInfo>)
                }
                { isUserWinner && (
                    !claimTx ? (
                        <BigButton theme={themes.primary} onClick={this.claimWin} shining>
                            Claim { isCreatorWinner ? (prize + payedBombCost) : prize } ETH!
                        </BigButton>
                    ) : (
                        <ClaimedInfo>
                            Reward has been claimed!<br/>
                            Transaction: { claimTx }
                        </ClaimedInfo>
                    )
                ) }
            </StyledGame>
        )
    }
}

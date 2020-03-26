import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { compareBoards, DIFF_STATES } from './board';
import ShipsBoard from './shipsBoard';
import BombsBoard from './bombsBoard';
import Loader from './loader';
import { RevealTimeoutIcon, SunkenShipIcon, ShipIcon } from '../constants/icons';
import TimeoutClaim from './timeoutClaim';
import Claim from './claim';
import ContractsManager from '../helpers/contracts';
import colors from '../constants/colors';
import GameDataBox from './gameDataBox';
import { StyledGame, GameMain, GameData, LiveView, LiveViewTitle, BoardContainer, BoardLoader } from './gamePage';
import { centerFlex } from '../styles/basic';
import { round } from '../helpers/math';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';

const ResultInfoSection = styled.div`
    margin: 15px 0;
    ${ centerFlex('column') }
    width: 100%;
`;
const ShipsResult = styled.div`
    margin-bottom: 10px;
    font-size: 26px;
    font-weight: 600;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    border-radius: 20px;
    @media ${ breakpointHit(bp.TABLET )} {
        flex-direction: column;
    }
`;
const ShipsScore = styled.div`
    color: ${ props => props.creator ? colors.CREATOR : colors.BOMBER };
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    width: 280px !important;
    padding: 20px;
    margin: 10px 1px;
    ${ props => props.creator && css`border-top-left-radius: 20px; border-bottom-left-radius: 20px;` }
    ${ props => !props.creator && css`border-top-right-radius: 20px; border-bottom-right-radius: 20px;` }
    background: rgba(0,0,0,0.2);
    @media ${ breakpointHit(bp.TABLET )} {
        border-radius: 20px;
        justify-content: flex-start;
    }
`;
const ShipsScoreIcon = styled.div`
    font-size: 34px;
    background: ${ props => props.creator ? colors.CREATOR : colors.BOMBER };
    color: #222;
    ${ centerFlex('column') };
    width: 50px;
    height: 50px;
    border-radius: 100%;
    @media ${ breakpointHit(bp.TABLET )} {
        order: -1;
        margin-right: 15px;
    }
`;
const ResultClaim = styled.div`
`;

export default class PendingGame extends Component {
    state = {
        revealedShips: null,
        revealedSeed: null,
        shipsBoard: null,
        boardsDiff: null,
        sunkenShips: null,
    };

    constructor(props) {
        super(props);
        this._contractManager = new ContractsManager();
    }

    determineWinner = async () => {
        const { shipsBoard } = this.state;
        const { game: { bombsBoard, revealedData: { ships } } } = this.props;

        if (shipsBoard) {
            const boardsDiff = compareBoards(shipsBoard, bombsBoard);
            let sunkenShips = 0;
            for (let ship of ships) {
                let hits = 0;
                if (ship.vertical) for(let y = ship.y; y <= ship.y + 4; ++y) hits += bombsBoard[y][ship.x];
                else for(let x = ship.x; x <= ship.x + 4; ++x) hits += bombsBoard[ship.y][x];
                if (hits === 5) ++sunkenShips;
            }

            this.setState({ boardsDiff, sunkenShips })
        }
    }

    recieveShipsBoard = (board) => {
        if (this.props.game.revealedData) {
            this.setState({ shipsBoard: board }, this.determineWinner);
        }
    }

    finishClaim = async () => {
        const { game: { gameIndex, revealedData: { ships, seed } } } = this.props;
        return await this._contractManager.finishGame(
            gameIndex,
            ships,
            Buffer.from(seed, 'base64')
        );
    }

    render() {
        const { boardsDiff, sunkenShips } = this.state;
        const { game: { gameIndex, bombsBoard, prize, paidBombsCost, revealTimeoutBlockNumber, isUserCreator, isUserBomber, revealedData } } = this.props;
        return (
            <StyledGame>
                {/* After revealed ships are known */}
                { (boardsDiff !== null) && (
                    <ResultInfoSection>
                        <ShipsResult>
                            <ShipsScore creator={true}>
                                <ShipsScoreIcon creator={true}><ShipIcon/></ShipsScoreIcon>
                                { 5 - sunkenShips } preserved
                            </ShipsScore>
                            <ShipsScore>
                                { sunkenShips } sunken
                                <ShipsScoreIcon><SunkenShipIcon/></ShipsScoreIcon>
                            </ShipsScore>
                        </ShipsResult>
                        { (isUserBomber && sunkenShips > 0) && (
                            <ResultClaim>
                                <Claim amount={ round(prize * sunkenShips / 5, 8) } claimMethod={ this.finishClaim }/>
                            </ResultClaim>
                        ) }
                        { isUserCreator && (
                            <ResultClaim>
                                <Claim amount={ round((prize + paidBombsCost) - (prize * sunkenShips / 5), 8) } claimMethod={ this.finishClaim }/>
                            </ResultClaim>
                        ) }
                    </ResultInfoSection>
                ) }
                <GameMain>
                    <GameData>
                        <GameDataBox game={ this.props.game }/>
                    </GameData>
                    <LiveView>
                        <LiveViewTitle>Results:</LiveViewTitle>
                        { revealedData ? 
                            <BoardContainer>
                                <ShipsBoard onChange={ this.recieveShipsBoard } lockedShips={ revealedData.ships } boardsDiff={boardsDiff}/>
                            </BoardContainer>
                            :
                            <BoardContainer>
                                <BombsBoard lockedBoard={ bombsBoard }/>
                                <BoardLoader><Loader text="Waiting for revealed ships board..."/></BoardLoader>
                            </BoardContainer>
                        }
                    </LiveView>
                </GameMain>
                <TimeoutClaim
                    timeoutName="Reveal"
                    timeoutIcon={ <RevealTimeoutIcon /> }
                    timeoutBlock={ revealTimeoutBlockNumber }
                    canUserClaim={ isUserBomber }
                    claimMethod={ async () => await this._contractManager.claimBomberTimeoutWin(gameIndex) }
                    claimAmount={ prize }/>
            </StyledGame>
        )
    }
}

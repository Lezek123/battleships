import React, { Component } from 'react';
import styled from 'styled-components';
import { compareBoards, DIFF_STATES } from './board';
import ShipsBoard from './shipsBoard';
import BombsBoard from './bombsBoard';
import Loader from './loader';
import { PrizeIcon, RevealTimeoutIcon, LoseIcon } from '../constants/icons';
import TimeoutClaim from './timeoutClaim';
import Claim from './claim';
import ContractsManager from '../helpers/contracts';
import colors from '../constants/colors';
import GameDataBox from './gameDataBox';
import { StyledGame, GameMain, GameData, LiveView, LiveViewTitle, BoardContainer, BoardLoader } from './gamePage';
import { centerFlex } from '../styles/basic';

const WinnerInfoSection = styled.div`
    margin: 15px 0;
    ${ centerFlex('column') }
`;
const WinnerInfo = styled.div`
    margin-bottom: 10px;
    font-size: 26px;
    font-weight: 600;
    display: flex;
    align-items: center;
    color: ${ props => props.color ? props.color : 'inherit' };
`;
const WinnerIcon = styled.div`
    font-size: 34px;
    margin-right: 8px;
`;
const WinnerClaim = styled.div`
`;

export default class PendingGame extends Component {
    state = {
        revealedShips: null,
        revealedSeed: null,
        shipsBoard: null,
        boardsDiff: null,
        winner: null,
        isUserWinner: null,
    };

    constructor(props) {
        super(props);
        this._contractManager = new ContractsManager();
    }

    determineWinner = async () => {
        const { shipsBoard } = this.state;
        const { game: { bombsBoard, isUserCreator, isUserBomber } } = this.props;

        if (shipsBoard) {
            const boardsDiff = compareBoards(shipsBoard, bombsBoard);
            const isCreatorWinner = boardsDiff.some(row => row.some(resField => resField === DIFF_STATES.board1));

            const isUserWinner = (isCreatorWinner && isUserCreator) || (!isCreatorWinner && isUserBomber)
            this.setState({ boardsDiff, isUserWinner, winner: isCreatorWinner ? 'Creator' : 'Bomber' })
        }
    }

    recieveShipsBoard = (board) => {
        if (this.props.game.revealedData) {
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
        const { winner, isUserWinner, boardsDiff } = this.state;
        const { game: { gameIndex, bombsBoard, prize, paidBombsCost, revealTimeoutBlockNumber, isUserCreator, isUserBomber, revealedData } } = this.props;
        return (
            <StyledGame>
                {/* After winner is known */}
                { (winner !== null) && (
                    <WinnerInfoSection>
                        { isUserWinner && (
                            <WinnerInfo color={ colors.WIN }>
                                <WinnerIcon><PrizeIcon /></WinnerIcon> You've WON!
                            </WinnerInfo>
                        ) }
                        { (!isUserWinner && (isUserCreator || isUserBomber)) && (
                            <WinnerInfo color={ colors.LOSE }>
                                <WinnerIcon><LoseIcon /></WinnerIcon> You've LOST!
                            </WinnerInfo>
                        ) }
                        { (!isUserCreator && !isUserBomber) && (
                            <WinnerInfo>
                                <WinnerIcon><PrizeIcon /></WinnerIcon> Winner: { winner }
                            </WinnerInfo>
                        ) }
                        { isUserWinner && (
                            <WinnerClaim>
                                <Claim amount={ isUserCreator ? (paidBombsCost + prize) : prize } claimMethod={ this.claimWin }/>
                            </WinnerClaim>
                        ) }
                    </WinnerInfoSection>
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

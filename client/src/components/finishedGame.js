import React, { Component } from 'react';
import styled from 'styled-components';
import { compareBoards } from './board';
import ShipsBoard from './shipsBoard';
import { centerFlex } from '../styles/basic';
import GameDataBox from './gameDataBox';
import { StyledGame, GameMain, GameData, LiveView, LiveViewTitle, BoardContainer, BoardLoader } from './gamePage';

const ShipsUnknown = styled.span`
    font-size: 20px;
    flex-grow: 1;
    width: calc(100% - 40px);
    border-radius: 20px;
    ${ centerFlex('row') };
    background: rgba(0,0,0,0.4);
    margin-bottom: 10px;
`;

export default class PendingGame extends Component {
    state = {
        boardsDiff: null,
    };

    getBoardsDiff = (shipsBoard) => {
        const { game: { revealedData, bombsBoard } } = this.props;
        if (revealedData) {
            const boardsDiff = compareBoards(shipsBoard, bombsBoard);
            this.setState({ boardsDiff });
        }
    }

    render() {
        const { boardsDiff } = this.state;
        const { game: { revealedData } } = this.props;
        return (
            <StyledGame>
                <GameMain>
                    <GameData>
                        <GameDataBox game={ this.props.game }/>
                    </GameData>
                    <LiveView>
                        <LiveViewTitle>Results:</LiveViewTitle>
                            { revealedData ?
                                <BoardContainer>
                                    <ShipsBoard onChange={ this.getBoardsDiff } lockedShips={ revealedData.ships } boardsDiff={boardsDiff}/>
                                </BoardContainer>
                                : <ShipsUnknown>Ships' positions unknown</ShipsUnknown>
                            }
                    </LiveView>
                </GameMain>
            </StyledGame>
        )
    }
}

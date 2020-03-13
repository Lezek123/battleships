import React, { Component } from 'react';
import GamePreviewBox from './gamePreviewBox';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';

const StyledGamesList = styled.div`
    width: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
`;

const NoGamesFound = styled.h1`
    width: 100%;
    flex-grow: 1;
    margin: 0;
    text-align: center;
    ${ centerFlex('column') }
`;

export default class GamesList extends Component {
    state = { gameStatus: 'new' };
    render() {
        const { games } = this.props;
        return (
            <StyledGamesList>
                { games.length ?
                    games.map((game, i) => <GamePreviewBox game={ game } key={i}/>)
                    : <NoGamesFound>No games found</NoGamesFound> }
            </StyledGamesList>
        )
    }
}

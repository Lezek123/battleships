import React, { Component } from 'react';
import GamePreviewBox from './gamePreviewBox';
import styled from 'styled-components';

const StyledGamesList = styled.div`
    width: 100%;
`;

export default class GamesList extends Component {
    render() {
        const { games } = this.props;
        return (
            <StyledGamesList>
                { games.map((game, i) => <GamePreviewBox game={ game } key={i}/>) }
            </StyledGamesList>
        )
    }
}

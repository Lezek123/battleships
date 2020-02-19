import React, { Component } from 'react';
import styled from 'styled-components';

const StyledGamePreviewBox = styled.div``;
const TransactionHash = styled.div``;
const GameAddress = styled.div``;

export default class GamePreviewBox extends Component {
    render() {
        const { game } = this.props;
        return (
            <StyledGamePreviewBox>
                <TransactionHash>{ game.creationTx }</TransactionHash>
                <GameAddress>{ game.gameAddress }</GameAddress>
            </StyledGamePreviewBox>
        )
    }
}

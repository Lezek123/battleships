import React, { Component } from 'react';
import styled from 'styled-components';

const StyledGamePreviewBox = styled.div``;
const StyledGameDataRow = styled.div`
    display: flex;
`;
const DataName = styled.div`
    width: 200px;
`;
const DataVal = styled.div``;

const GameDataRow = ({ dataName, dataVal, unit }) => (
    <StyledGameDataRow>
        <DataName>{ dataName }:</DataName>
        <DataVal>{ dataVal } { unit }</DataVal>
    </StyledGameDataRow>
)

export default class GamePreviewBox extends Component {
    render() {
        const { game } = this.props;
        return (
            <StyledGamePreviewBox>
                <GameDataRow dataName={'Prize'} dataVal={game.prize} unit={'ETH'} />
                <GameDataRow dataName={'Bomb cost'} dataVal={game.bombCost} unit={'ETH'}/>
                <GameDataRow dataName={'Join timeout block'} dataVal={game.joinTimeoutBlockNumber} />
                <GameDataRow dataName={'Reveal timeout'} dataVal={game.revealTimeoutBlocks} unit={'blocks'}/>
            </StyledGamePreviewBox>
        )
    }
}

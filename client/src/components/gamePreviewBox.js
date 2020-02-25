import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { BigButton, themes } from './navigation/buttons';
import { centerFlex } from '../styles/basic';
import { generateGamePath } from '../constants/routes';

const StyledGamePreviewBox = styled.div`
    background: rgba(255, 255, 255, 0.1);
    margin: 30px 0;
    padding: 20px;
    border-radius: 20px;
    width: 300px;
    ${ centerFlex('column') }
`;
const StyledGameDataRow = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;
const DataName = styled.div`
    width: 200px;
`;
const DataVal = styled.div``;
const JoinButton = styled(BigButton)`
    margin-top: 15px;
`;

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
                <JoinButton theme={ themes.primary } as={ Link } to={ generateGamePath(game.address) }>JOIN</JoinButton>
            </StyledGamePreviewBox>
        )
    }
}

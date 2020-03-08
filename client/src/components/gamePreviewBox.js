import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { BigButton, themes } from './navigation/buttons';
import { centerFlex } from '../styles/basic';
import { generateGamePath } from '../constants/routes';
import { BombCostIcon, PrizeIcon, JoinTimeoutIcon, RevealTimeoutIcon } from '../constants/icons';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';

const StyledGamePreviewBox = styled.div`
    background: rgba(0, 0, 0, 0.3);
    margin: 30px 0;
    padding: 20px;
    padding-top: 0;
    border-radius: 20px;
    width: 100%;
    position: relative;
`;
const PreviewBoxInner = styled.div`
    display: flex;
    align-items: center;
    @media ${ breakpointHit(bp.TABLET) } {
        flex-wrap: wrap;
    }
`;
const GameStatusLabel = styled.div`
    height: 50px;
    background: rgba(0, 0, 0, 0.2);
    margin: 0 -20px;
    margin-bottom: 10px;
    padding: 0 30px;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    display: flex;
    align-items: center;
`;
const GameData = styled.div`
    flex-grow: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr;
    @media ${ breakpointHit(bp.SMALL_DESKTOP) } {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
    }
    @media ${ breakpointHit(bp.TABLET) } {
        width: 100%;
    }
    @media ${ breakpointHit(bp.PHONE) } {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr 1fr 1fr;
    }
    grid-auto-flow: column;
`;

const StyledGameDataRow = styled.div`
    ${ centerFlex('row') }
    padding: 20px;
    @media ${ breakpointHit(bp.SMALL_DESKTOP) } {
        padding: 12px;
    }
    margin: 5px;
    margin-top: 15px;
    border-radius: 20px;
    background: rgba(255,255,255,0.1);
    position: relative;
`;
const DataLabel = styled.div`
    position: absolute;
    display: flex;
    align-items: center;
    top: 0;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    white-space: nowrap;
`;
const DataIcon = styled.div`
    font-size: 20px;
    margin-right: 5px;
    line-height: 1;
`;
const DataName = styled.div`
    font-size: 14px;
    flex-grow: 1;
`;
const DataVal = styled.div`
    font-size: 20px;
`;
const JoinButton = styled(BigButton)`
    margin-top: 15px;
    margin-left: 15px;
    @media ${ breakpointHit(bp.TABLET) } {
        margin-left: auto;
        margin-right: auto;
    }
`;

const GameDataRow = ({ dataName, dataVal, unit, icon }) => (
    <StyledGameDataRow>
        <DataLabel>
            <DataIcon>{ icon }</DataIcon>
            <DataName>{ dataName }:</DataName>
        </DataLabel>
        <DataVal>{ dataVal } { unit }</DataVal>
    </StyledGameDataRow>
)

export default class GamePreviewBox extends Component {
    render() {
        const { game } = this.props;
        return (
            <StyledGamePreviewBox>
                <GameStatusLabel>
                    {game.data.bomberAddr ? 'PENDING' : 'NEW' }
                </GameStatusLabel>
                <PreviewBoxInner>
                    <GameData>
                        <GameDataRow icon={<PrizeIcon />} dataName={'Prize'} dataVal={game.data.prize} unit={'ETH'} />
                        <GameDataRow icon={<BombCostIcon />} dataName={ 'Bomb cost' } dataVal={game.data.bombCost} unit={'ETH'}/>
                        <GameDataRow icon={<JoinTimeoutIcon />} dataName={'Join timeout block'} dataVal={'#'+game.data.joinTimeoutBlockNumber} />
                        <GameDataRow icon={<RevealTimeoutIcon />} dataName={'Reveal timeout'} dataVal={game.data.revealTimeoutBlocks} unit={'blocks'}/>
                    </GameData>
                    <JoinButton theme={ themes.primary } as={ Link } to={ generateGamePath(game.index) }>JOIN</JoinButton>
                </PreviewBoxInner>
            </StyledGamePreviewBox>
        )
    }
}

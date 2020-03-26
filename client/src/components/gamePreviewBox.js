import React, { Component } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { BigButton, themes } from './navigation/buttons';
import { centerFlex } from '../styles/basic';
import { generateGamePath } from '../constants/routes';
import { BombCostIcon, PrizeIcon, JoinTimeoutIcon, RevealTimeoutIcon, SunkenShipIcon } from '../constants/icons';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';
import BlocksCountdown from './blocksCountdown';
import GAME_STATUSES from '../constants/gameStatuses';

const StyledGamePreviewBox = styled.div`
    background: rgba(0, 0, 0, 0.3);
    margin-bottom: 20px;
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
    padding: 15px;
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
    text-align: center;
`;
const DataInfo = styled.div`
    font-size: 12px;
    color: #ccc;
`;
const JoinButton = styled(BigButton)`
    margin-top: 15px;
    margin-left: 15px;
    @media ${ breakpointHit(bp.TABLET) } {
        margin-left: auto;
        margin-right: auto;
    }
`;

export const GameDataRow = ({ dataName, dataVal, dataInfo, unit, icon }) => (
    <StyledGameDataRow>
        <DataLabel>
            <DataIcon>{ icon }</DataIcon>
            <DataName>{ dataName }:</DataName>
        </DataLabel>
        <DataVal>
            { dataVal } { unit }
            <DataInfo>{ dataInfo }</DataInfo>
        </DataVal>
    </StyledGameDataRow>
)

export default class GamePreviewBox extends Component {
    render() {
        const { game, showHeader = true, showActions = true } = this.props;
        const { NEW, IN_PROGRESS, FINISHED } = GAME_STATUSES;
        const statusLabels = { [NEW]: 'New', [IN_PROGRESS]: 'In progress', [FINISHED]: 'Finished' };
        return (
            <StyledGamePreviewBox>
                { showHeader && (
                    <GameStatusLabel status={ game.status }>
                        Game #{ game.gameIndex } ({ statusLabels[game.status] })
                    </GameStatusLabel>
                ) }
                <PreviewBoxInner>
                    <GameData>
                        <GameDataRow
                            icon={<PrizeIcon />}
                            dataName={'Total prize'}
                            dataVal={game.prize}
                            unit={'ETH'} />
                        <GameDataRow
                            icon={<BombCostIcon />}
                            dataName={ 'Bomb cost' }
                            dataVal={game.bombCost}
                            unit={'ETH'}/>
                        { game.status === NEW && (<>
                            <GameDataRow
                                icon={<RevealTimeoutIcon />}
                                dataName={'Reveal timeout'}
                                dataVal={game.revealTimeoutBlocks}
                                unit={'blocks'}/>
                            <GameDataRow
                                icon={<JoinTimeoutIcon />}
                                dataName={'Join timeout block'}
                                dataVal={'#'+game.joinTimeoutBlockNumber}
                                dataInfo={ <BlocksCountdown targetBlock={game.joinTimeoutBlockNumber} /> }/>
                        </>) }
                        { game.status !== NEW && (
                            <GameDataRow
                                icon={<BombCostIcon />}
                                dataName={'Attack cost paid'}
                                dataVal={game.paidBombsCost || 0 }
                                dataInfo={ game.bombsBoard.reduce((prev, row) => prev += row.filter(f => f).length, 0) + ' bombs placed'}
                                unit={'ETH'} />
                        ) }
                        { game.status === IN_PROGRESS && (
                            <GameDataRow
                                icon={<RevealTimeoutIcon />}
                                dataName={'Reveal timeout block'}
                                dataVal={'#'+game.revealTimeoutBlockNumber}
                                dataInfo={ <BlocksCountdown targetBlock={game.revealTimeoutBlockNumber} /> }/>
                        ) }
                        { game.status === FINISHED && (
                            <GameDataRow
                                icon={<SunkenShipIcon />}
                                dataName={'Ships sunken'}
                                dataVal={ game.sunkenShipsCount === null ? 'Unknown' : game.sunkenShipsCount } />
                        ) }
                    </GameData>
                    { showActions && (
                        <JoinButton theme={ themes.primary } as={ Link } to={ generateGamePath(game.gameIndex) }>
                            { game.status === NEW  && 'JOIN' }
                            { game.status === IN_PROGRESS  && 'WATCH' }
                            { game.status === FINISHED  && 'SEE DETAILS' }
                        </JoinButton>
                    ) }
                </PreviewBoxInner>
            </StyledGamePreviewBox>
        )
    }
}

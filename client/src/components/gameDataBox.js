import React, { Component } from 'react';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import { BombCostIcon, PrizeIcon, JoinTimeoutIcon, RevealTimeoutIcon, TransactionIcon } from '../constants/icons';
import GAME_STATUSES from '../constants/gameStatuses';
import TxLink from '../components/txLink';

const StyledGameDataBox = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;
const StyledGameDataRow = styled.div`
    ${ centerFlex('row') };
    justify-content: space-between;
    padding: 5px 10px;
    border-radius: 10px;
    margin-bottom: 5px;
    background: rgba(0,0,0,0.2);
    position: relative;
`;
const DataLabel = styled.div`
    ${ centerFlex('row') };
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

export const GameDataRow = ({ dataName, dataVal, unit, icon }) => (
    <StyledGameDataRow>
        <DataLabel>
            <DataIcon>{ icon }</DataIcon>
            <DataName>{ dataName }:</DataName>
        </DataLabel>
        <DataVal>
            { dataVal } { unit }
        </DataVal>
    </StyledGameDataRow>
)

export default class GameDataBox extends Component {
    render() {
        const { game } = this.props;
        const { NEW, IN_PROGRESS, FINISHED } = GAME_STATUSES;
        return (
            <StyledGameDataBox>
                <GameDataRow
                    icon={<PrizeIcon />}
                    dataName={'Prize'}
                    dataVal={game.prize}
                    unit={'ETH'} />
                { game.status === FINISHED && (<>
                    <GameDataRow
                        icon={<PrizeIcon />}
                        dataName={'Prize claimed by'}
                        dataVal={ game.isCreatorClaimer ? 'Creator' : 'Bomber' } />
                    <GameDataRow
                        icon={<PrizeIcon />}
                        dataName={'Claim reason'}
                        dataVal={ game.claimReason ? game.claimReason : 'Standard win' } />
                </>)}
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
                        dataVal={'#'+game.joinTimeoutBlockNumber} />
                </>) }
                { game.status !== NEW && (<>
                    <GameDataRow
                        icon={<BombCostIcon />}
                        dataName={'Attack cost paid'}
                        dataVal={game.paidBombsCost || 0 }
                        unit={'ETH'} />
                    <GameDataRow
                        icon={<BombCostIcon />}
                        dataName={'Bombs placed'}
                        dataVal={ game.bombsBoard.reduce((prev, row) => prev += row.filter(f => f).length, 0) }/>
                </>) }
                { game.status === IN_PROGRESS && (
                    <GameDataRow
                        icon={<RevealTimeoutIcon />}
                        dataName={'Reveal timeout block'}
                        dataVal={'#'+game.revealTimeoutBlockNumber}/>
                ) }
                <GameDataRow
                    icon={<TransactionIcon />}
                    dataName={'Creation tx'}
                    dataVal={<TxLink tx={ game.creationTx} />} />
                { game.bombingTx && (
                    <GameDataRow
                        icon={<TransactionIcon />}
                        dataName={'Attack tx'}
                        dataVal={<TxLink tx={ game.bombingTx} />} />
                ) }
                { game.finishingTx && (
                    <GameDataRow
                        icon={<TransactionIcon />}
                        dataName={'Finish tx'}
                        dataVal={<TxLink tx={ game.finishingTx} />} />
                ) }
            </StyledGameDataBox>
        )
    }
}

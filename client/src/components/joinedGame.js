import React, { Component } from 'react';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import { round } from '../helpers/math';
import Submit from './fields/Submit';
import { FormField, FieldInfo } from './fields/formFields';
import ContractsManager from '../helpers/contracts';
import BombsBoard from './bombsBoard';
import TimeoutClaim from './timeoutClaim';
import { JoinTimeoutIcon } from '../constants/icons';
import Loader from './loader';
import GameDataBox from './gameDataBox';
import { StyledGame, GameMain, GameData, LiveView, LiveViewTitle, BoardContainer, BoardLoader } from './gamePage';
// import { useParams } from 'react-router-dom';

const AttackForm = styled.form`
    width: 100%;
    max-width: 500px;
    ${ centerFlex('column') }
`;
const PlacedBombsSummary = styled.div`
    margin-top: 20px;
    margin-bottom: 10px;
`;
const SummaryRow = styled.div`
    display: flex;
    width: 250px;
    justify-content: space-between;
`;
const SummaryName = styled.div`
    font-weight: bold;
`;
const SummaryValue = styled.div`
`;

export default class JoinedGame extends Component {
    state = {
        bombsBoard: null,
        attacking: false,
    }

    componentWillMount() {
        this._contractManager = new ContractsManager();
    }

    handleBombBoardChange = (bombsBoard) => {
        this.setState({ bombsBoard })
    }

    getPlacedBombsCount = () => {
        const { bombsBoard } = this.state;
        if (!bombsBoard) return 0;
        return bombsBoard.reduce((count, row) => count += row.filter(f => f).length, 0);
    }

    isAttackValid = () => {
        return this.getPlacedBombsCount() >= 25;
    }

    submitAttack = async (e) => {
        e.preventDefault();
        if (!this.isAttackValid()) return;

        const { game: { gameIndex, bombCost } } = this.props;
        const { bombsBoard } = this.state;
        const bombsCost = bombCost * this.getPlacedBombsCount();

        this.setState({ attacking: true });
        try {
            await this._contractManager.setBombsInGame(gameIndex, bombsBoard, bombsCost);
            // Will be automatically handled by refresh in GamePage
        } catch(e) {
            this.setState({ bombsBoard: null, attacking: false });
        }
    }

    render() {
        const { attacking } = this.state;
        const { game: { gameIndex, bombCost, prize, joinTimeoutBlockNumber, isUserCreator } } = this.props;
        const placedBombsCount = this.getPlacedBombsCount();
        
        return (
            <StyledGame>
                <GameMain>
                    <GameData>
                        <GameDataBox game={ this.props.game }/>
                    </GameData>
                    <LiveView>
                        { isUserCreator ?
                            <Loader text="Waiting for a player to join..."/>
                            :
                            (<>
                                <LiveViewTitle>Place your bombs:</LiveViewTitle>
                                <AttackForm onSubmit={ this.submitAttack }>
                                    <FormField>
                                        <BoardContainer>
                                            <BombsBoard onChange={ this.handleBombBoardChange }/>
                                            { attacking && <BoardLoader><Loader text="Placing bombs..."/></BoardLoader> }
                                        </BoardContainer>
                                        <PlacedBombsSummary>
                                            <SummaryRow>
                                                <SummaryName>Bombs placed:</SummaryName>
                                                <SummaryValue>{ placedBombsCount }</SummaryValue>
                                            </SummaryRow>
                                            <SummaryRow>
                                                <SummaryName>Total bombs cost:</SummaryName>
                                                <SummaryValue>{ round(placedBombsCount * bombCost, 8) } ETH</SummaryValue>
                                            </SummaryRow>
                                            <SummaryRow>
                                                <SummaryName>Winning reward:</SummaryName>
                                                <SummaryValue>{ round(prize - placedBombsCount * bombCost, 8) } ETH</SummaryValue>
                                            </SummaryRow>
                                        </PlacedBombsSummary>
                                        { !this.isAttackValid() && <FieldInfo>You have to place at least 25 bombs</FieldInfo> }
                                    </FormField>
                                    <Submit text="Attack" disabled={ !this.isAttackValid() } />
                                </AttackForm>
                            </>)
                        }
                    </LiveView>
                </GameMain>

                { isUserCreator && (
                    <TimeoutClaim
                        timeoutName="Join"
                        timeoutIcon={ <JoinTimeoutIcon /> }
                        timeoutBlock={ joinTimeoutBlockNumber }
                        canUserClaim={ isUserCreator }
                        claimMethod={ async () => await this._contractManager.claimJoinTimeoutReturn(gameIndex) }
                        claimAmount={ prize }/>
                ) }
            </StyledGame>
        )
    }
}

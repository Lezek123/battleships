import React, { Component } from 'react';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import { round } from '../helpers/math';
import Submit from './fields/Submit';
import { FormField, FieldInfo } from './fields/formFields';
import ContractsManager from '../helpers/contracts';
import BombsBoard from './bombsBoard';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';
// import { useParams } from 'react-router-dom';

const StyledGame = styled.div`
    width: 100%;
    max-width: 550px;
    ${ centerFlex('column') };
`;
const AttackForm = styled.form`
    width: 100%;
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
const JoinedGameTitle = styled.h1`
    @media ${ breakpointHit(bp.PHONE) } {
        font-size: 24px;
    }
`;

export default class JoinedGame extends Component {
    state = {
        bombsBoard: null
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

        // TODO: Move to ContractManager method?
        const web3 = await this._contractManager.getWeb3();
        const { gameContract } = this.props;
        const { instance: contractInstance, data: { bombCost } } = gameContract;
        const { bombsBoard } = this.state;
        const bombsCost = bombCost * this.getPlacedBombsCount();
        const playerAddr = web3.currentProvider.selectedAddress;

        await contractInstance.setBombs(
            bombsBoard,
            { from: playerAddr, value: web3.utils.toWei(bombsCost.toString()) }
        );
    }

    render() {
        const { gameContract: { data: { bombCost, prize } } } = this.props;
        const placedBombsCount = this.getPlacedBombsCount();
        
        return (
            <StyledGame>
                <JoinedGameTitle>Place your bombs</JoinedGameTitle>
                <AttackForm onSubmit={ this.submitAttack }>
                    <FormField>
                        <BombsBoard onChange={ this.handleBombBoardChange }/>
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
                        { !this.isAttackValid() && <FieldInfo text={ `You have to place at least 25 bombs` } /> }
                    </FormField>
                    <Submit text="Attack" disabled={ !this.isAttackValid() } />
                </AttackForm>
            </StyledGame>
        )
    }
}

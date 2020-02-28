import React, { Component } from 'react';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import { round } from '../helpers/math';
import Submit from './fields/Submit';
import { FormField, FieldInfo } from './fields/formFields';
import ContractsManager from '../helpers/contracts';
import BombsBoard from './bombsBoard';
// import { useParams } from 'react-router-dom';

const StyledGame = styled.div`
    width: 550px;
    ${ centerFlex('column') };
`;
const AttackForm = styled.form`
    width: 100%;
    ${ centerFlex('column') }
`;
const PlacedBombsSummary = styled.div`
    margin-top: 20px;
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
        placedBombsLength: 0,
        bombsBoard: null
    }

    componentWillMount() {
        this._contractManager = new ContractsManager();
    }

    onBombPlacement = ({ x, y, currentBoard }) => {
        this.setState(
            ({ placedBombsLength }) =>
            ({ placedBombsLength: ++placedBombsLength, bombsBoard: currentBoard })
        );
    }

    isAttackValid = () => {
        return this.state.placedBombsLength >= 25;
    }

    submitAttack = async (e) => {
        e.preventDefault();
        if (!this.isAttackValid()) return;

        // TODO: Move to ContractManager method?
        const web3 = await this._contractManager.getWeb3();
        const { gameContract } = this.props;
        const { instance: contractInstance, data: { bombCost } } = gameContract;
        const { bombsBoard, placedBombsLength } = this.state;
        const bombsCost = bombCost * placedBombsLength;
        const playerAddr = web3.currentProvider.selectedAddress;

        await contractInstance.setBombs(
            bombsBoard,
            { from: playerAddr, value: web3.utils.toWei(bombsCost.toString()) }
        );
    }

    render() {
        const { gameContract: { data: { bombCost, prize } } } = this.props;
        const { placedBombsLength } = this.state;
        
        return (
            <StyledGame>
                <h1>Place your bombs</h1>
                <AttackForm onSubmit={ this.submitAttack }>
                    <FormField>
                        <BombsBoard onPlacement={ this.onBombPlacement }/>
                        <PlacedBombsSummary>
                            <SummaryRow>
                                <SummaryName>Bombs placed:</SummaryName>
                                <SummaryValue>{ placedBombsLength }</SummaryValue>
                            </SummaryRow>
                            <SummaryRow>
                                <SummaryName>Total bombs cost:</SummaryName>
                                <SummaryValue>{ round(placedBombsLength * bombCost, 8) } ETH</SummaryValue>
                            </SummaryRow>
                            <SummaryRow>
                                <SummaryName>Winning reward:</SummaryName>
                                <SummaryValue>{ round(prize - placedBombsLength * bombCost, 8) } ETH</SummaryValue>
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

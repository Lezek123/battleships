import React, { Component } from 'react';
import ShipsBoard from './shipsBoard';
import NumberInput from './fields/NumberInput';
import Submit from './fields/Submit';
import { centerFlex } from '../styles/basic';
import styled from 'styled-components';
import { secondsToStringInterval } from '../helpers/converters';
import { FormField, FieldInfo } from './fields/formFields';
import { BombCostIcon, PrizeIcon, JoinTimeoutIcon, RevealTimeoutIcon } from '../constants/icons';
import { breakpointHit, breakpointNotHit, breakpoints as bp } from '../constants/breakpoints';

const StyledGameFormContainer = styled.div`
    ${ centerFlex('column') }
    width: 100%;
`;
const GameForm = styled.form`
    ${ centerFlex('column') }
    width: 100%;
`;
const GameFormSections = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    @media ${ breakpointHit(bp.TABLET) } {
        flex-wrap: wrap;
    }
`;
const FormSectionTitle = styled.h2`
    text-align: center;
`;
const ConfigSection = styled.div`
    width: 400px;
    flex-shrink: 2;
    @media ${ breakpointNotHit(bp.TABLET) } {
        margin-right: 40px;
    }
`;
const ShipsSection = styled.div`
    width: 500px;
    flex-shrink: 1;
`;

export default class CreateGameForm extends Component {
    state = {
        data: {
            initialValue: '0.01',
            bombCost: '0.0002',
            joinTimeoutBlocks: '20',
            revealTimeoutBlocks: '20',
            ships: [],
        },
        validity: {
            initialValue: true,
            bombCost: true,
            joinTimeoutBlocks: true,
            revealTimeoutBlocks: true
        }
    }

    onInputChange = (e, modifiedValue = null, errors = []) => {
        // FIXME: Cross-validity between initialValue and bombCost!
        const {target} = e;
        this.setState(
            ({ data, validity }) => (
                {
                    data: { ...data, [target.name]: modifiedValue || target.value },
                    validity: { ...validity, [target.name]: errors.length === 0 ? true : false }
                }
            )
        )
    }

    onShipPlacement = (ship) => {
        const newShipsLength = this.state.data.ships.length + 1;
        this.setState(
            ({ data, validity }) => (
                {
                    data: { ...data, ships: [...data.ships, ship] },
                    validity: { ...validity, ships: newShipsLength === 5 ? true : false }
                }
            ),
        );
    }

    isValid = () => {
        const { data, validity } = this.state;
        return Object.keys(data).every(fieldName => validity[fieldName]);
    }

    submit = (e) => {
        e.preventDefault();
        const { onSubmit } = this.props;

        if (this.isValid()) {
            onSubmit(this.state.data);
        }
    }

    render() {
        const { data, validity } = this.state;

        return (
            <StyledGameFormContainer>
                <h1>Create a game</h1>
                <GameForm onSubmit={ this.submit }>
                    <GameFormSections>
                        <ConfigSection>
                            <FormSectionTitle>Configuration:</FormSectionTitle>
                            <FormField>
                                <NumberInput
                                    label="Winning prize"
                                    name="initialValue"
                                    value={ data.initialValue }
                                    onChange={ this.onInputChange }
                                    unit={ 'ETH' }
                                    min={ 0.00001 }
                                    max={ 1 }
                                    required={ true }
                                    icon={ <PrizeIcon /> }
                                    />
                            </FormField>
                            <FormField>
                                <NumberInput
                                    label="Bomb cost"
                                    name="bombCost"
                                    value={ data.bombCost }
                                    onChange={ this.onInputChange }
                                    unit={ 'ETH' }
                                    min={ validity.initialValue ? data.initialValue / 100 : 0.00001 }
                                    max={ validity.initialValue ? data.initialValue / 26 : 1 }
                                    required={ true }
                                    icon={ <BombCostIcon /> }
                                    />
                                    { (validity.initialValue && validity.bombCost) && (
                                        <FieldInfo
                                            text= { `Placing more than ${ Math.ceil(data.initialValue / data.bombCost) - 1 } bombs will become unprofitable` } />
                                    ) }
                            </FormField>
                            <FormField>
                                <NumberInput
                                    label="Reveal timeout"
                                    name="revealTimeoutBlocks"
                                    value={ data.revealTimeoutBlocks }
                                    onChange={ this.onInputChange }
                                    unit={ 'blocks' }
                                    min={ 10 }
                                    max={ 120 }
                                    required={ true }
                                    icon={ <RevealTimeoutIcon /> }
                                    />
                                    { (validity.revealTimeoutBlocks) && (
                                        <FieldInfo
                                            text= { `For 14s per block it's ` + secondsToStringInterval(data.revealTimeoutBlocks * 14) } />
                                    ) }
                            </FormField>
                            <FormField>
                                <NumberInput
                                        label="Join timeout"
                                        name="joinTimeoutBlocks"
                                        value={ data.joinTimeoutBlocks }
                                        onChange={ this.onInputChange }
                                        unit={ 'blocks' }
                                        min={ 10 }
                                        max={ 43200 }
                                        required={ true }
                                        icon={ <JoinTimeoutIcon /> }
                                        />
                                { (validity.joinTimeoutBlocks) && (
                                    <FieldInfo
                                        text= { `For 14s per block it's ` + secondsToStringInterval(data.joinTimeoutBlocks * 14) } />
                                ) }
                            </FormField>
                        </ConfigSection>
                        <ShipsSection>
                            <FormSectionTitle>Ships:</FormSectionTitle>
                            <ShipsBoard onPlacement={ this.onShipPlacement } />
                        </ShipsSection>
                    </GameFormSections>
                    <Submit text="Create game" disabled={ !this.isValid() }/>
                </GameForm>
            </StyledGameFormContainer>
        )
    }
}

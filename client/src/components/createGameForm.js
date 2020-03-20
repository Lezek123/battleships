import React, { Component } from 'react';
import ShipsBoard from './shipsBoard';
import NumberInput from './fields/NumberInput';
import Submit from './fields/Submit';
import { centerFlex } from '../styles/basic';
import styled from 'styled-components';
import { blocksToRoundedInterval, AVG_BLOCK_TIME } from '../helpers/converters';
import { FormField, FieldInfo } from './fields/formFields';
import { BombCostIcon, PrizeIcon, JoinTimeoutIcon, RevealTimeoutIcon } from '../constants/icons';
import { breakpointHit, breakpointNotHit, breakpoints as bp } from '../constants/breakpoints';
import Loader from './loader';
import ContractsManager from '../helpers/contracts';
import { BigButton, themes } from './navigation/buttons';
import { generateGamePath } from '../constants/routes';
import { Link } from 'react-router-dom';

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

const GameCreated = styled.div`
    ${ centerFlex('column') };
`;
const GameCreatedTitle = styled.h1`
    text-align: center;
`;

export default class CreateGameForm extends Component {
    constructor(props) {
        super(props);
        this._contractsManager = new ContractsManager();
        this.state = this.getInitialState();
    }

    getInitialState = () => {
        return {
            data: {
                initialValue: '0.01',
                bombCost: '0.00015',
                joinTimeoutBlocks: Math.round(24 * 60 * 60 / AVG_BLOCK_TIME).toString(),
                revealTimeoutBlocks: Math.round(24 * 60 * 60 / AVG_BLOCK_TIME).toString(),
                ships: [],
            },
            validity: {
                initialValue: true,
                bombCost: true,
                joinTimeoutBlocks: true,
                revealTimeoutBlocks: true
            },
            creating: false,
            created: false,
            createdGameIndex: null
        };
    }

    onInputChange = (e, modifiedValue = null, errors = []) => {
        const {target} = e;
        this.setState(
            ({ data, validity }) => (
                {
                    data: { ...data, [target.name]: modifiedValue || target.value },
                    validity: { ...validity, [target.name]: errors.length === 0 ? true : false }
                }
            )
        );
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

        if (this.isValid()) {
            this.setState({ creating: true }, async () => {
                try {
                    let res = await this._contractsManager.createGame(this.state.data);
                    this.setState({ creating: false, created: true, createdGameIndex: res.logs[0].args._gameIndex });
                } catch(e) {
                    console.log(e);
                    this.setState(this.getInitialState());
                }
            });
        }
    }

    render() {
        const { data, validity, creating, created, createdGameIndex } = this.state;

        if (creating) return <Loader text="Creating a new game..." />;
        if (created) return (
            <GameCreated>
                <GameCreatedTitle>Game has been created!</GameCreatedTitle>
                <BigButton theme={themes.primary} as={Link} to={ generateGamePath(createdGameIndex) }>
                    GO TO GAME PAGE
                </BigButton>
            </GameCreated>
        );
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
                                        <FieldInfo>
                                            Placing more than <b>{ Math.ceil(data.initialValue / data.bombCost) - 1 } bombs</b> will become unprofitable
                                        </FieldInfo>
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
                                    max={ 43200 }
                                    required={ true }
                                    icon={ <RevealTimeoutIcon /> }
                                    />
                                    { (validity.revealTimeoutBlocks) && (
                                        <FieldInfo>
                                            For { AVG_BLOCK_TIME }s per block it's { blocksToRoundedInterval(data.revealTimeoutBlocks) }
                                        </FieldInfo>
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
                                    <FieldInfo>
                                        For { AVG_BLOCK_TIME }s per block it's { blocksToRoundedInterval(data.joinTimeoutBlocks) }
                                    </FieldInfo>
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

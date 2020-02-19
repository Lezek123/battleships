import React, { Component } from 'react';
import color from '../../constants/colors';
import styled, { css, keyframes } from 'styled-components';

const StyledInput = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin: 10px 0;
    position: relative;
`;

const Label = styled.label`
    margin-right: 10px;
    width: 100px;
    font-size: 16px;
    text-align: left;
`;

const FieldContainer = styled.div`
    position: relative;
`;

const InputField = styled.input`
    width: 100%;
    box-sizing: border-box;
    height: 35px;
    padding: 0 15px;
    border-radius: 20px;
    border: 2px solid #fff;
    transition: border-color 0.5s;
    font-size: 16px;
    ${ props => props.hasErrors && css`border-color: ${ color.DANGER };` }
    ${ props => props.withUnit && css`padding-right: 60px;` }
    &:focus {
        outline: 0;
    }
`;

const errorsFadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 0.9; }
`;

const InputErrors = styled.div`
    position: absolute;
    top: 100%;
    font-size: 14px;
    background: ${ color.DANGER };
    z-index: 10;
    width: 100%;
    box-sizing: border-box;
    padding: 5px 20px;
    border-radius: 20px;
    margin-top: 2px;
    animation: ${errorsFadeIn} 0.5s;
    opacity: 0.9;
`;

const InputError = styled.div``;

const InputUnit = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 40px;
    padding-right: 5px;
    font-size: 14px;
    color: #000;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
`;

/* Basic input component. May be extended in the future */
export default class Input extends Component {
    state = { errors: [] };

    getErrors() {
        const { errors: stateErrors } = this.state;
        const { errors: passedErrors = [] } = this.props;

        return passedErrors.concat(stateErrors);
    }

    onChange = (e) => {
        const { onChange: originOnChange, required } = this.props;
        let { target: { value } } = e;

        let errors = [];
        if (value === '' && required) errors.push(`Te pole jest wymagane!`);

        this.setState({ errors });

        originOnChange(e, value);
    }

    render() {
        const { type = 'text', name, value, label, unit, min, max } = this.props;
        const errors = this.getErrors();

        return (
            <StyledInput
                hasErrors={ errors.length ? true : false }
                withUnit={ unit ? true : false }>
                <Label htmlFor={ 'Input__' + name }>{ label }</Label>
                <FieldContainer>
                    <InputField
                        id={ 'Input__' + name }
                        type={ type }
                        name={ name }
                        value={ value }
                        onChange={ this.onChange }
                        autocomplete="off"
                        min={ min }
                        max={ max }/>
                    { unit && <InputUnit>{ unit }</InputUnit> }
                    { errors.length > 0 && (
                        <InputErrors>
                            { errors.map((error, key) =>
                                <InputError key={ key }>{ error }</InputError>
                            ) }
                        </InputErrors>
                    ) }
                </FieldContainer>
            </StyledInput>
        );
    }
}

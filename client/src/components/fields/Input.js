import React, { Component } from 'react';
import color, { colorWithAlpha } from '../../constants/colors';
import styled, { css, keyframes } from 'styled-components';
import { centerFlex } from '../../styles/basic';
import { MdErrorOutline } from 'react-icons/md';

const StyledInput = styled.div`
    ${ centerFlex('column') }
    margin: 10px 0;
    position: relative;
    box-shadow: 0 0 5px ${ props => props.hasErrors ? colorWithAlpha(color.DANGER, 0.5) : 'rgba(255, 255, 255, 0)' };
    /* border-bottom: 0; */
    padding: 15px;
    padding-top: 20px;
    border-radius: 20px;
    width: 100%;
    background: rgba(0,0,0,0.2);
`;

const Label = styled.label`
    font-size: 16px;
    text-align: left;
    margin-bottom: 5px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    padding: 0 10px;
    white-space: nowrap;
    ${centerFlex('row')}
`;

const LabelIcon = styled.div`
    font-size: 20px;
    line-height: 1;
    margin-right: 5px;
`;

const FieldContainer = styled.div`
    position: relative;
    width: 100%;
`;

const InputField = styled.input`
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    height: 35px;
    padding: 0 15px;
    border-radius: 20px;
    border: 0;
    transition: background-color 0.2s;
    font-size: 18px;
    ${ props => props.withUnit && css`padding-right: 60px;` }
    &:focus {
        outline: 0;
        background: #fff;
    }
`;

const errorsFadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const InputErrors = styled.div`
    font-size: 14px;
    background: ${ colorWithAlpha(color.DANGER, 0.7) };
    text-align: center;
    width: 100%;
    padding: 5px 20px;
    border-radius: 20px;
    margin-top: 2px;
    animation: ${errorsFadeIn} 0.5s;
`;

const ErrorIcon = styled.div`
    margin-right: 5px;
    font-size: 20px;
    line-height: 1;
`;
const InputError = styled.div`
    ${centerFlex('row')}
`;

const InputUnit = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 50px;
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

    componentDidMount() {
        this.triggerChange();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) this.triggerChange();
    }

    triggerChange() {
        this.onChange({ target: { name: this.props.name, value: this.props.value }});
    }

    getErrors() {
        const { errors: stateErrors } = this.state;
        const { errors: passedErrors = [] } = this.props;

        return passedErrors.concat(stateErrors);
    }

    onChange = (e) => {
        const { onChange: originOnChange, required, normalizeValue } = this.props;
        let { target: { value } } = e;

        if (normalizeValue) value = normalizeValue(value);

        let errors = [];
        if (value === '' && required) errors.push(`This field is required!`);

        this.setState({ errors });

        originOnChange(e, value, errors);
    }

    render() {
        const { type = 'text', name, value, label, unit, min, max, icon, children } = this.props;
        const errors = this.getErrors();

        return (
            <StyledInput
                hasErrors={ errors.length ? true : false }
                withUnit={ unit ? true : false }>
                <Label htmlFor={ 'Input__' + name }>
                    { icon && <LabelIcon>{ icon }</LabelIcon> }
                    { label }
                </Label>
                <FieldContainer>
                    <InputField
                        id={ 'Input__' + name }
                        type={ type }
                        name={ name }
                        value={ value }
                        onChange={ this.onChange }
                        autoComplete="off"
                        min={ min }
                        max={ max }/>
                    { unit && <InputUnit>{ unit }</InputUnit> }
                </FieldContainer>
                { errors.length > 0 && (
                    <InputErrors>
                        { errors.map((error, key) =>
                            <InputError key={ key }>
                                <ErrorIcon><MdErrorOutline /></ErrorIcon>
                                { error }
                            </InputError>
                        ) }
                    </InputErrors>
                ) }
                { children }
            </StyledInput>
        );
    }
}

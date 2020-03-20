import React, { Component } from 'react';
import Input from './Input';

export default class NumberInput extends Component {
    state = { errors: [], needsReload: false };

    componentDidUpdate = (prevProps) => {
        if (prevProps.max !== this.props.max || prevProps.min !== this.props.min) {
            this.setState({ needsReload: true });
        }
    }

    onChange = (e, modifiedValue = null, passedErrors = []) => {
        const { onChange: originOnChange } = this.props;
        let value = modifiedValue || e.target.value;
        value = value.replace(/[^0-9\.\,]/g, '');
        value = value.replace(',', '.');
        const decimalPointIndex = value.indexOf('.');
        while (decimalPointIndex && value.indexOf('.', decimalPointIndex + 1) !== -1) {
            const removeIndex = value.indexOf('.', decimalPointIndex + 1);
            value = value.slice(0, removeIndex) + value.slice(removeIndex + 1);
        }
        value = value.replace(/(\.[0-9]{8})[0-9]+$/, '$1');
        const errors = this.validateByValue(value);
        this.setState({ needsReload: false });
        originOnChange(e, value, passedErrors.concat(errors));
    }

    validateByValue = (value) => {
        const { min, max } = this.props;

        let errors = [];
        if (parseFloat(value) > max) errors.push(`Maksymalna wartość to: ${ max }`);
        if (parseFloat(value) < min) errors.push(`Minimalna wartość to: ${ min }`);

        this.setState({ errors });

        return errors;
    }

    render() {
        const { errors: stateErrors, needsReload } = this.state;
        const { errors: passedErrors = [] } = this.props;

        let errors = passedErrors.concat(stateErrors);
        
        return (
            <Input
                { ...this.props }
                onChange={ this.onChange }
                errors={ errors }
                needsReload={needsReload}/>
        );
    }
}
import React, { Component } from 'react';
import Input from './Input';

export default class NumberInput extends Component {
    state = { errors: [] };

    onChange = (e, modifiedValue = null, passedErrors = []) => {
        const { onChange: originOnChange, min, max } = this.props;
        let value = modifiedValue || e.target.value;

        value = value.replace(/[^0-9\.\,]/g, '');
        value = value.replace(',', '.');

        let errors = [];
        if (parseFloat(value) > max) errors.push(`Maksymalna wartość to: ${ max }`);
        if (parseFloat(value) < min) errors.push(`Minimalna wartość to: ${ min }`);

        this.setState({ errors });

        originOnChange(e, value, passedErrors.concat(errors));
    }

    render() {
        const { errors: stateErrors } = this.state;
        const { errors: passedErrors = [] } = this.props;

        let errors = passedErrors.concat(stateErrors);
        
        return (
            <Input
                { ...this.props }
                onChange={ this.onChange }
                errors={ errors }/>
        );
    }
}
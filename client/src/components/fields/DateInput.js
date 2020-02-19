import React, { Component } from 'react';
import Input from './Input';

export default class DateInput extends Component {
    state = { errors: [] };

    onChange = (e) => {
        const { onChange: originOnChange, min, max } = this.props;
        let { target: { value } } = e;

        let errors = [];
        if (new Date(value) > new Date(max)) errors.push(`Maksymalna wartość to: ${ max }`);
        if (new Date(value) < new Date(min)) errors.push(`Minimalna wartość to: ${ min }`);

        this.setState({ errors });

        originOnChange(e, value);
    }

    render() {
        const { errors: stateErrors } = this.state;
        const { errors: passedErrors = [] } = this.props;

        let errors = passedErrors.concat(stateErrors);
        
        return (
            <Input
                { ...this.props }
                type={ 'date' }
                onChange={ this.onChange }
                errors={ errors }/>
        );
    }
}
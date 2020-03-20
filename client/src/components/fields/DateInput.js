import React, { Component } from 'react';
import Input from './Input';

export default class DateInput extends Component {
    state = { errors: [] };

    onChange = (e) => {
        const { onChange: originOnChange, min, max } = this.props;
        let { target: { value } } = e;

        let errors = [];
        if (new Date(value) > new Date(max)) errors.push(`Max. value is: ${ max }`);
        if (new Date(value) < new Date(min)) errors.push(`Min. value is: ${ min }`);

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
import React, { Component } from 'react';
import styled from 'styled-components';
import { themes, BigButton } from '../navigation/buttons';

const SubmitButton = styled(BigButton)`
    margin-top: 20px;
    margin-bottom: 20px;
`;

export default class Submit extends Component {
    render() {
        const { text, disabled } = this.props;
        return (
            <SubmitButton theme={ themes.primary } type="submit" disabled={ disabled }>
                { text }
            </SubmitButton>
        )
    }
}

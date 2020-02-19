import React, { Component } from 'react';
import styled from 'styled-components';

const SubmitButton = styled.button`
    border-radius: 20px;
    padding: 5px 20px;
    font-size: 26px;
    border: 0;
    margin: 20px 0;
    cursor: pointer;
`;

export default class Submit extends Component {
    render() {
        const { text } = this.props;
        return (
            <SubmitButton type="submit">
                { text }
            </SubmitButton>
        )
    }
}

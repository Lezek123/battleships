// Basic styles / components of customizable form fields
import React from 'react';
import styled from 'styled-components';
import { Info as InfoIcon } from '@material-ui/icons';
import color from '../../constants/colors';
import { centerFlex } from '../../styles/basic';

export const FormField = styled.div`
    width: 100%;
    ${ centerFlex('column') };
`;
export const BigLabel = styled.label`
    margin-top: 10px;
    font-size: 20px;
`;

const StyledFieldInfo = styled.div`
    margin: 10px 0;
    ${ centerFlex('row') };
    color: ${ color.INFO_LIGHT };
    font-size: 14px;
`;
const FieldInfoIcon = styled(InfoIcon)`
    margin-right: 5px;
`;

export const FieldInfo = ({ text }) => (
    <StyledFieldInfo>
        <FieldInfoIcon />
        { text }
    </StyledFieldInfo>
);
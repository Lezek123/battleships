// Basic styles / components of customizable form fields
import React from 'react';
import styled from 'styled-components';
import { MdInfo as InfoIcon } from 'react-icons/md';
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
    margin-bottom: 15px;
    ${ centerFlex('row') };
    color: ${ color.INFO_LIGHT };
    font-size: 14px;
`;
const FieldInfoIcon = styled(InfoIcon)`
    font-size: 22px;
    margin-right: 8px;
    flex-shrink: 0;
`;

export const FieldInfo = ({ text }) => (
    <StyledFieldInfo>
        <FieldInfoIcon />
        { text }
    </StyledFieldInfo>
);
// Basic styles / components of customizable form fields
import React from 'react';
import styled from 'styled-components';
import { MdInfo as InfoIcon } from 'react-icons/md';
import { colors as color, colorWithAlpha } from '../../constants/colors';
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
    width: 100%;
    ${ centerFlex('row') };
    display: inline-flex;
    color: ${ color.INFO_LIGHT };
    background: ${ colorWithAlpha(color.INFO_DARK, 0.4) };
    font-size: 14px;
    padding: 5px 10px;
    border-radius: 12px;
    margin-top: 10px;
`;
const FieldInfoIcon = styled(InfoIcon)`
    font-size: 22px;
    margin-right: 8px;
    flex-shrink: 0;
`;
const FieldInfoContent = styled.span``;

export const FieldInfo = ({ children }) => (
    <StyledFieldInfo>
        <FieldInfoIcon />
        <FieldInfoContent>
            { children }
        </FieldInfoContent>
    </StyledFieldInfo>
);
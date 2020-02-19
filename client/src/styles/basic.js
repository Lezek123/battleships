import { css } from 'styled-components';

export const centerFlex = (direction) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${ direction };
`;
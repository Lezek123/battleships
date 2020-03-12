import styled, { css, keyframes } from 'styled-components';
import color from '../../constants/colors';

const themes = {
    default: {
        color: '#fff',
        bgColor: '#777',
        hoverColor: '#fff',
        hoverBgColor: 'transparent',
        hoverShadowColor: '#fff',
        activeColor: '#222',
        activeBgColor: '#fff',
    },
    primary: {
        color: '#fff',
        bgColor: color.PRIMARY,
        hoverColor: '#b9c3d7',
        hoverBgColor: 'transparent',
        hoverShadowColor: '#b9c3d7',
        shiningColor: '#222',
        shiningBgColor: '#fff',
    }
};

const shiningAnimation = ({ bgColor, shiningBgColor, color, shiningColor  }) => keyframes`
    from { background: ${ bgColor }; color: ${ color }; }
    to { background: ${ shiningBgColor }; color: ${ shiningColor }; }
`;

const BasicButton = styled.button`
    font-weight: 600;
    display: inline-block;
    padding: 15px;
    border: 0;
    cursor: ${ props => props.disabled ? 'not-allowed' : 'pointer' };
    color: ${ props => props.theme.color } !important;
    background: ${ props => props.theme.bgColor };
    text-decoration: none !important;
    width: 200px;
    text-align: center;
    box-shadow: none;
    transition: box-shadow 0.5s, background-color 0.5s, color 0.5s, padding 0.5s;
    font-size: 20px;
    border-radius: 100px;
    ${ props => props.shining && css`animation: ${ shiningAnimation(props.theme) } 1s infinite alternate ease-in-out;` }
    ${ props => props.disabled ?
        css`
            opacity: 0.5;
        `
        :
        css`
            &:focus {
                outline: 0;
            }
            &:hover {
                color: ${ props => props.theme.hoverColor } !important;
                background: ${ props => props.theme.hoverBgColor };
                box-shadow: 0 0 5px ${ props => props.theme.hoverShadowColor };
            }
            &.active {
                color: ${ props => props.theme.activeColor || 'initial' } !important;
                background: ${ props => props.theme.activeBgColor || 'initial' } !important;
                box-shadow: none !important;
            }
        `
    }
`;

BasicButton.defaultProps = { theme: themes.default };

const BigButton = styled(BasicButton)`
    padding: 20px;
`;

const SmallButton = styled(BasicButton)`
    padding: 10px;
    font-size: 18px;
    width: 150px;
`;

export { themes, BasicButton, BigButton, SmallButton };
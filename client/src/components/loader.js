import React, { Component } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { centerFlex } from '../styles/basic';
import colors from '../constants/colors';

// Some ugly "snakelike" loader, perhaps it'll be useful some other time...
const position = (top, right, bottom, left) => `
    top: ${top};
    right: ${right};
    bottom: ${bottom};
    left: ${left};
`;

const slAnimationStages = [
    css`${ position(0, '50%', '50%', 0) }; border-width: 25px 0 0 25px;`,
    css`${ position(0, 0, 0, 0) }; border-width: 25px 0 0 0;`,
    css`${ position(0, 0, '50%', '50%') }; border-width: 25px 25px 0 0;`,
    css`${ position(0, 0, 0, 0) }; border-width: 0 25px 0 0;`,
    css`${ position('50%', 0, 0, '50%') }; border-width: 0 25px 25px 0;`,
    css`${ position(0, 0, 0, 0) }; border-width: 0 0 25px 0;`,
    css`${ position('50%', '50%', 0, 0) }; border-width: 0 0 25px 25px;`,
    css`${ position(0, 0, 0, 0) }; border-width: 0 0 0 25px;`,
];

const slAnimation = keyframes`
    ${ slAnimationStages.map((cssChange, key) =>
        `${ 12.5 * key }% { ${ cssChange } }\n`
    ) }
`;

const SlLoaderContainer = styled.div`
    width: 100px;
    height: 100px;
    position: relative;
`;

const SlLoaderInner = styled.div`
    position: absolute;
    border-style: solid;
    border-color: #465d8a;
    animation: ${slAnimation} 1s step-end 0s infinite;
`;

export const SnakelikeLoader = () => (
    <SlLoaderContainer>
        <SlLoaderInner />
    </SlLoaderContainer>
);

// Current loader
const StyledBoxLoader = styled.div`
    ${ centerFlex('column') };
`;
const BoxLoaderBoxes = styled.div`
    display: flex;
    flex-wrap: wrap;
    width: 90px;
`;
const BoxLoaderBox = styled.div`
    width: 28px;
    height: 28px;
    margin: 1px;
    border-radius: 3px;
    background: ${ props => props.type === 'active' ? colors.INFO_LIGHT : 'transparent' };
    transition: background-color 1s;
`;
const BoxLoaderText = styled.div`
    margin-top: 10px;
    color: #fff;
    font-size: 14px;
`;

class BoxLoader extends Component {

    constructor(props) {
        super(props);
        this.state = {
            boxes: Array.from(Array(9)).map(() => 'default')
        }
    }
    
    componentDidMount() {
        this.updateAnimation();
        const { intervalMs = 500 } = this.props;
        this.loaderInterval = setInterval(this.updateAnimation, intervalMs);
    }

    componentWillUnmount() {
        if (this.loaderInterval) clearInterval(this.loaderInterval);
    }

    updateAnimation = () => {
        const { boxes: oldBoxes } = this.state; 
        let newBoxes = Array.from(Array(9)).map(() => 'default');
        for (let i = 0; i < 3; ++i) {
            const boxIndex = Math.floor(Math.random() * 9);
            if (newBoxes[boxIndex] === 'active' || oldBoxes[boxIndex] === 'active') {
                --i;
                continue;
            }
            newBoxes[boxIndex] = 'active';
        }
        this.setState({ boxes: newBoxes });
    }
    render() {
        const { text = 'Loading...' } = this.props;
        return (
            <StyledBoxLoader>
                <BoxLoaderBoxes>
                    { this.state.boxes.map((type, key) => <BoxLoaderBox type={type} key={key} />) }
                </BoxLoaderBoxes>
                <BoxLoaderText>{ text }</BoxLoaderText>
            </StyledBoxLoader>
        );
    }
}



export default BoxLoader;
import React, { Component } from 'react';
import Input from './Input';
import styled from 'styled-components';
import colors from '../../constants/colors';
import { round } from '../../helpers/math';

const NumberSlider = styled.div`
    height: 28px;
    width: 100%;
    margin: 10px 0;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    position: relative;
    color: #000;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.5s;
    &.clicked {
        background: #fff;
    }
`;
const SliderPointer = styled.div`
    position: absolute;
    margin: 2px;
    top: 0;
    left: ${ props => `calc(${ props.value }% - ${ 28 * props.value / 100 }px)` };
    background: #777;
    border-radius: 100%;
    width: 24px;
    height: 24px;
    transition: background-color 0.5s;
    &.clicked {
        background: ${ colors.PRIMARY }
    }
`;

export default class NumberInput extends Component {
    state = { errors: [], normalizedValue: null, sliderClicked: false };

    componentDidMount() {
        window.addEventListener('mousedown', this.mouseDownListener);
        window.addEventListener('mousemove', this.mouseMoveListener);
        window.addEventListener('mouseup', this.mouseUpListener);
    }

    componentWillUnmount() {
        window.removeEventListener('mousedown', this.mouseDownListener);
        window.removeEventListener('mousemove', this.mouseMoveListener);
        window.removeEventListener('mouseup', this.mouseUpListener);
    }

    mouseDownListener = (e) => {
        if (this.sliderRef && this.sliderRef.contains(e.target)) {
            this.isSliding = true;
            this.setState({ sliderClicked: true });
            this.updateSliderPointerPos(e);
        }
    }

    mouseMoveListener = (e) => {
        if (this.isSliding && this.sliderRef) {
            this.updateSliderPointerPos(e);
        }
    }

    mouseUpListener = (e) => {
        if (this.isSliding) {
            this.isSliding = false;
            this.mouseMoveChachedX = null;
            this.setState({ sliderClicked: false });
        }
    }

    updateSliderPointerPos = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { min, max } = this.props;
        
        if (this.mouseMoveChachedX && Math.abs(e.clientX - this.mouseMoveChachedX) < 5) return;
        this.mouseMoveChachedX = e.clientX;

        const rect = this.sliderRef.getBoundingClientRect();
        const width = rect.right - rect.left;
        const cursorRelativeX = e.clientX - rect.x;
        let position = Math.round((cursorRelativeX) / width * 100);
        position = Math.max(0, Math.min(100, position));
        let value = (max - min) * (position / 100) + min;
        value = Math.max(min, Math.min(max, value));
        this.forceChange(value.toString());
    }

    forceChange(newValue) {
        this.onChange({ target: { name: this.props.name, value: newValue }});
    }

    componentDidUpdate = (prevProps) => {
        if (prevProps.max !== this.props.max || prevProps.min !== this.props.min) {
            this.forceChange(this.props.value);
        }
    }

    onChange = (e, modifiedValue = null, passedErrors = []) => {
        const { onChange: originOnChange, min, max } = this.props;
        let value = modifiedValue !== null ? modifiedValue : e.target.value;

        let errors = [];
        if (parseFloat(value) > max) errors.push('Max. value is: ' + max);
        if (parseFloat(value) < min) errors.push('Min. value is: ' + min);

        this.setState({ errors, normalizedValue: parseFloat(value) });
        originOnChange(e, value, passedErrors.concat(errors));
    }

    normalizeValue = (value) => {
        value = value.replace(/[^0-9\.\,]/g, '');
        value = value.replace(',', '.');
        const decimalPointIndex = value.indexOf('.');
        while (decimalPointIndex && value.indexOf('.', decimalPointIndex + 1) !== -1) {
            const removeIndex = value.indexOf('.', decimalPointIndex + 1);
            value = value.slice(0, removeIndex) + value.slice(removeIndex + 1);
        }
        value = value.replace(/(\.[0-9]{8})[0-9]+$/, '$1');
        if (Number.isNaN(parseFloat(value))) {
            value = '';
        }
        else if (value[value.length - 1] !== '.' && value.match(/\.[0-9]{8,}$/)) {
            value = round(parseFloat(value), 8).toFixed(8);
        }

        return value;
    }

    render() {
        const { errors: stateErrors, normalizedValue, sliderClicked } = this.state;
        const { errors: passedErrors = [], withSlider = false, min, max } = this.props;

        let errors = passedErrors.concat(stateErrors);

        const showSlider = (min || min === 0) && (max || max === 0) && withSlider && !Number.isNaN(normalizedValue);
        let sliderPointerPos = null;
        if (showSlider) { 
            sliderPointerPos = Math.round((normalizedValue - min) / (max - min) * 100);
            sliderPointerPos = Math.max(sliderPointerPos, 0);
            sliderPointerPos = Math.min(sliderPointerPos, 100);
        }

        return (<>
            <Input
                { ...this.props }
                onChange={ this.onChange }
                normalizeValue={ this.normalizeValue }
                errors={ errors }>
                { showSlider && (
                    <NumberSlider
                        className={ sliderClicked && 'clicked' }
                        ref={ ref => this.sliderRef = ref }>
                        <SliderPointer
                            className={ sliderClicked && 'clicked' }
                            value={ sliderPointerPos }
                            ref={ ref => this.sliderPointerRef = ref }/>
                    </NumberSlider>
                ) }
            </Input>
        </>);
    }
}
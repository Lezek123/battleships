import React, { Component } from 'react';
import ethLogo from '../images/eth-logo.png';
import styled from 'styled-components';
import { breakpointHit, breakpoints as bp } from '../constants/breakpoints';

const StyledShipLogo = styled.div`
	position: relative;
    height: 300px;
	@media ${ breakpointHit(bp.PHONE) } {
		height: 200px;
	}
`;
const ShipLogoBase = styled.img`
	height: 100%;
	filter: drop-shadow(0 2px 3px rgba(255, 255, 255, 1));
`;
const ShipLogoCanon = styled.div`
	z-index: 2;
	background: radial-gradient(circle, #999 0%, #444 100%);
	border-radius: 100%;
	width: 60px;
	height: 60px;
	position: absolute;
	top: 15%;
	left: 50%;
	transform: translateX(-50%);
	box-shadow: 0 0 10px #000;
	@media ${ breakpointHit(bp.PHONE) } {
		width: 40px;
		height: 40px;
	}
`;
const ShipLogoRiffleContainer = styled.div`
	z-index: 3;
	position: absolute;
	width: 15px;
	height: 200px;
	top: 25%;
	left: 50%;
	transform: translateX(-50%) translateY(-50%);
	@media ${ breakpointHit(bp.PHONE) } {
		width: 10px;
		height: 150px;
	}
`;
const ShipLogoRiffle = styled.div`
	z-index: 4;
	border-top-left-radius: 20px;
	border-top-right-radius: 20px;
	box-shadow: 0 0 5px #000;
	position: absolute;
	bottom: 0;
	left: 0;
	height: 50%;
	width: 100%;
	background-image: linear-gradient(90deg, #555 0%, #999 50%, #555 100%);
`;
const RiffleShot = styled.div`
	z-index: 5;
	position: absolute;
	bottom: -20px;
	width: 15px;
	height: 15px;
	border-radius: 100%;
	background: #222;
	box-shadow: 0 0 5px #fff;
`;

export default class ShipLogo extends Component {
	SHOT_ANIMATION_TIME = 500;
	state = { riffleAngle: 0, shooting: false, shotAnimationProgress: 0 };
	componentDidMount() {
		window.addEventListener('mousemove', this.onMouseMove);
		window.addEventListener('mousedown', this.onMouseDown)
	}
	componentWillUnmount() {
		window.removeEventListener('mousemove', this.onMouseMove);
		window.removeEventListener('mousedown', this.onMouseDown);
	}
	onMouseMove = (e) => {
		if (this.state.shooting) return;
		if (this.riffleRef) {
			const riffleRect = this.riffleRef.getBoundingClientRect();
			const riffleTopMiddle = {
				y: riffleRect.top + document.documentElement.scrollTop,
				x: riffleRect.left + (riffleRect.right - riffleRect.left) / 2
			};
			const atanX = riffleTopMiddle.x - e.pageX;
			const atanY = e.pageY - riffleTopMiddle.y;
			const riffleAngle = Math.atan2(atanX, atanY);
			this.setState({ riffleAngle: riffleAngle });
		}
	}
	onMouseDown = (e) => {
		if (this.state.shooting) return;
		this.setState({ shooting: true });
		this.shotAnimationIv = setInterval(
			() => this.setState(
				({ shotAnimationProgress }) => {
					const newProgress = shotAnimationProgress + 10 / this.SHOT_ANIMATION_TIME;
					const animationEnd = (newProgress >= 1);
					if (animationEnd) clearInterval(this.shotAnimationIv);
					return {
						shotAnimationProgress: animationEnd ? 0 : newProgress,
						shooting: !animationEnd
					}
				}
			),
			10
		);
	}
	render() {
		const { riffleAngle, shotAnimationProgress, shooting } = this.state;
		const { clientWidth, clientHeight } = document.body;
		const longestShotDistance = Math.sqrt(Math.pow(clientWidth, 2) + Math.pow(clientHeight, 2));
		return (
			<StyledShipLogo>
				<ShipLogoCanon />
				<ShipLogoRiffleContainer
					ref={ ref => this.riffleRef = ref }
					style={ {
						transform: `translateX(-50%) translateY(-50%) rotate(${ riffleAngle }rad)`,
					} } >
					<ShipLogoRiffle
						style={ {
							bottom: shotAnimationProgress > 0.5 ? `${ 10 - shotAnimationProgress * 10 }px` : `${ shotAnimationProgress * 10 }px`
						} }
					/>
					{ shooting && (
						<RiffleShot
							ref={ ref => this.shotRef = ref }
							style={ {
								bottom: `${ -20 - longestShotDistance * shotAnimationProgress }px`
							} } />
					) }
				</ShipLogoRiffleContainer>
				<ShipLogoBase src={ethLogo} alt="Ethereum logo"/>
			</StyledShipLogo>
		);
	}
}
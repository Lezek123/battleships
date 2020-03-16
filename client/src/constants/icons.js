// Commonly used icons
import React from 'react';
import { GiTrophy, GiConvergenceTarget, GiSandsOfTime } from 'react-icons/gi';
import { MdTimer, MdMenu } from 'react-icons/md';

export const MenuIcon = (props) => <MdMenu {...props}/>;
export const PrizeIcon = (props) => <GiTrophy {...props}/>;
export const BombCostIcon = (props) => <GiConvergenceTarget {...props}/>;
export const RevealTimeoutIcon = (props) => <GiSandsOfTime {...props}/>;
export const JoinTimeoutIcon = (props) => <MdTimer {...props}/>;
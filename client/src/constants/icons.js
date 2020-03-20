// Commonly used icons
import React from 'react';
import { GiTrophy, GiConvergenceTarget, GiSandsOfTime, GiShipWreck } from 'react-icons/gi';
import { MdTimer, MdMenu } from 'react-icons/md';
import { FaReceipt } from 'react-icons/fa';

export const MenuIcon = (props) => <MdMenu {...props}/>;
export const PrizeIcon = (props) => <GiTrophy {...props}/>;
export const LoseIcon = (props) => <GiShipWreck {...props}/>;
export const BombCostIcon = (props) => <GiConvergenceTarget {...props}/>;
export const RevealTimeoutIcon = (props) => <GiSandsOfTime {...props}/>;
export const JoinTimeoutIcon = (props) => <MdTimer {...props}/>;
export const TransactionIcon = (props) => <FaReceipt {...props}/>;
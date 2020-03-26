// Commonly used icons
import React from 'react';
import { GiOpenTreasureChest, GiBurningRoundShot, GiSandsOfTime, GiTimeBomb, GiShipWreck, GiBattleship } from 'react-icons/gi';
import { MdMenu, MdGavel } from 'react-icons/md';
import { FaReceipt, FaEthereum } from 'react-icons/fa';

export const MenuIcon = (props) => <MdMenu {...props}/>;
export const PrizeIcon = (props) => <GiOpenTreasureChest {...props}/>;
export const SunkenShipIcon = (props) => <GiShipWreck {...props}/>;
export const ShipIcon = (props) => <GiBattleship {...props}/>;
export const BombCostIcon = (props) => <GiBurningRoundShot {...props}/>;
export const RevealTimeoutIcon = (props) => <GiTimeBomb {...props}/>;
export const JoinTimeoutIcon = (props) => <GiSandsOfTime {...props}/>;
export const TransactionIcon = (props) => <FaReceipt {...props}/>;
export const EthereumIcon = (props) => <FaEthereum {...props}/>;
export const ClaimIcon = (props) => <MdGavel {...props}/>;
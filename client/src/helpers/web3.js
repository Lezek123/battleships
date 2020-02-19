import Web3 from 'web3';

export async function initWeb3() {
    let provider = null;
    if (window.ethereum) {
        provider = window.ethereum;
        try {
            // Request account access
            await window.ethereum.enable();
        } catch (error) {
            alert('This website will not work properly unless you enable MetaMask access :(');
            return null;
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
        alert('You need MetaMask in order use this website!');
        return null;
    }

    return new Web3(provider);
}
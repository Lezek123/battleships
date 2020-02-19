import Web3 from 'web3';

export async function initWeb3() {
    let provider = null;
    if (window.ethereum) {
        provider = window.ethereum;
        try {
            // Request account access
            await window.ethereum.enable();
        } catch (error) {
            // User denied account access...
            console.error("User denied account access");
            return null;
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
        // TODO: Actually: Display warning?
        provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    return new Web3(provider);
}
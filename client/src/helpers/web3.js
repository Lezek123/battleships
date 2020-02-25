import Web3 from 'web3';

class web3Global {};

async function initWeb3() {
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

export async function getWeb3() {
    if (!web3Global.initializing && !web3Global.instance) {
        web3Global.initializing = true;
        web3Global.instance = await initWeb3();
        web3Global.initializing = false;
    }
    else if (web3Global.initializing) {
        // Wait until we have the instance
        await new Promise((resolve, reject) => {
            let waitingInterval = setInterval(() => {
                if (web3Global.instance) {
                    clearInterval(waitingInterval);
                    resolve();
                }
            }, 100);
        });
    }
    return web3Global.instance;
}
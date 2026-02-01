
const NETWORKS = {
    sepolia: {
        name: "Sepolia Testnet",
        rpc: "https://sepolia.drpc.org",
        chainId: 11155111,
        symbol: "ETH"
    },
    mainnet: {
        name: "Ethereum Mainnet",
        rpc: "https://eth.drpc.org",
        chainId: 1,
        symbol: "ETH"
    },
    polygon: {
        name: "Polygon Mainnet",
        rpc: "https://polygon.drpc.org",
        chainId: 137,
        symbol: "MATIC"
    },
    amoy: {
        name: "Polygon Amoy",
        rpc: "https://rpc-amoy.polygon.technology",
        chainId: 80002,
        symbol: "MATIC"
    }
};

class WalletManager {
    constructor() {
        this.network = localStorage.getItem('current_network') || 'sepolia';
        this.provider = new ethers.JsonRpcProvider(NETWORKS[this.network].rpc);
        this.wallet = null;
        this.address = null;
        this.balance = 0;
        this.history = [];
        this.currentPin = null; 
        this.mnemonic = null;
    }

    getNetworks() {
        return NETWORKS;
    }

    async switchNetwork(networkKey) {
        if (!NETWORKS[networkKey]) throw new Error("Invalid network");
        
        this.network = networkKey;
        localStorage.setItem('current_network', networkKey);
        this.provider = new ethers.JsonRpcProvider(NETWORKS[this.network].rpc);
        
        if (this.wallet) {
            // Re-instantiate wallet with new provider
            this.wallet = ethers.Wallet.fromPhrase(this.mnemonic, this.provider);
            await this.updateBalance();
        }
    }

    hasWallet() {
        return !!localStorage.getItem('wallet_data');
    }

    async unlock(pin) {
        const data = localStorage.getItem('wallet_data');
        if (!data) return false;
        
        const parsed = JSON.parse(data);
        if (parsed.pin === pin) {
            this.address = parsed.address;
            this.history = parsed.history || [];
            this.currentPin = pin;
            this.mnemonic = parsed.mnemonic;
            
            if (this.mnemonic) {
                // Reconstruct wallet instance to sign transactions
                this.wallet = ethers.Wallet.fromPhrase(this.mnemonic, this.provider);
                // Fetch actual balance from RPC
                await this.updateBalance();
            } else {
                this.balance = parsed.balance || 0;
            }
            
            return true;
        }
        return false;
    }

    async updateBalance() {
        if (this.wallet) {
            try {
                const balanceWei = await this.provider.getBalance(this.address);
                this.balance = parseFloat(ethers.formatEther(balanceWei));
                this.save(); 
            } catch (error) {
                console.error("Failed to fetch balance:", error);
            }
        }
    }

    async fetchTransactionHistory() {
        if (!this.address) return;
        
        try {
            const blockNumber = await this.provider.getBlockNumber();
            const fromBlock = Math.max(0, blockNumber - 1000); // Last 1000 blocks
            
            // Fetch incoming transactions (to this address)
            const incomingFilter = {
                toAddress: this.address,
                fromBlock: fromBlock,
                toBlock: blockNumber
            };
            
            // Fetch outgoing transactions (from this address)
            const outgoingFilter = {
                fromAddress: this.address,
                fromBlock: fromBlock,
                toBlock: blockNumber
            };
            
            // Query logs for transfers (this is a simplified approach)
            const allLogs = await this.provider.getLogs({
                address: null,
                fromBlock: fromBlock,
                toBlock: blockNumber
            });
            
            // Filter for transactions involving this address
            for (const log of allLogs) {
                if (log.address && (log.topics[1] === ethers.zeroPadValue(this.address, 32) || 
                    log.topics[2] === ethers.zeroPadValue(this.address, 32))) {
                    // This is a token transfer, add to history if not already present
                    const txHash = log.transactionHash;
                    if (!this.history.find(tx => tx.hash === txHash)) {
                        try {
                            const tx = await this.provider.getTransaction(txHash);
                            if (tx) {
                                const type = tx.from.toLowerCase() === this.address.toLowerCase() ? 'sent' : 'received';
                                const amount = parseFloat(ethers.formatEther(tx.value || 0));
                                const counterparty = type === 'sent' ? tx.to : tx.from;
                                
                                this.history.unshift({
                                    hash: txHash,
                                    type: type,
                                    to: type === 'sent' ? tx.to : tx.from,
                                    from: tx.from,
                                    amount: amount,
                                    date: new Date().toLocaleTimeString(),
                                    network: this.network
                                });
                            }
                        } catch (e) {
                            console.log("Error fetching transaction details:", e);
                        }
                    }
                }
            }
            
            // Also fetch native ETH transfers
            try {
                const txns = [];
                for (let i = blockNumber - 100; i <= blockNumber; i++) {
                    const block = await this.provider.getBlock(i);
                    if (block) {
                        for (const txHash of block.transactions) {
                            const tx = await this.provider.getTransaction(txHash);
                            if (tx && (tx.from.toLowerCase() === this.address.toLowerCase() || 
                                      tx.to?.toLowerCase() === this.address.toLowerCase())) {
                                if (!this.history.find(h => h.hash === txHash)) {
                                    const type = tx.from.toLowerCase() === this.address.toLowerCase() ? 'sent' : 'received';
                                    const amount = parseFloat(ethers.formatEther(tx.value || 0));
                                    
                                    this.history.unshift({
                                        hash: txHash,
                                        type: type,
                                        to: tx.to,
                                        from: tx.from,
                                        amount: amount,
                                        date: new Date().toLocaleTimeString(),
                                        network: this.network
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.log("Error fetching native transactions:", e);
            }
            
            this.save();
        } catch (error) {
            console.error("Failed to fetch transaction history:", error);
        }
    }

    generateMnemonic() {
        const wallet = ethers.Wallet.createRandom();
        return {
            phrase: wallet.mnemonic.phrase,
            address: wallet.address
        };
    }

    saveWallet(pin, mnemonic) {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        this.address = wallet.address;
        this.balance = 0; 
        this.history = [];
        this.currentPin = pin;
        this.mnemonic = mnemonic;
        this.save();
    }

    async recoverWallet(mnemonic, pin) {
        try {
            // Normalize and validate mnemonic
            const normalized = mnemonic.trim().toLowerCase();
            ethers.Mnemonic.fromPhrase(normalized);
            ethers.Wallet.fromPhrase(normalized, this.provider);
        } catch (e) {
            throw new Error("Invalid Seed Phrase: " + e.message);
        }
        this.saveWallet(pin, mnemonic.trim().toLowerCase());
        await this.unlock(pin);
    }

    async sendTransaction(to, amount) {
        if (!this.wallet) throw new Error("Wallet not unlocked");

        const value = ethers.parseEther(amount);
        
        // Send transaction via RPC
        const txResponse = await this.wallet.sendTransaction({
            to: to,
            value: value
        });

        const tx = {
            hash: txResponse.hash,
            type: 'sent',
            to: to,
            from: this.address,
            amount: parseFloat(amount),
            date: new Date().toLocaleTimeString(),
            network: this.network
        };
        this.history.unshift(tx);
        this.save();
        return tx;
    }

    save() {
        const data = { 
            address: this.address, 
            balance: this.balance, 
            history: this.history, 
            pin: this.currentPin,
            mnemonic: this.mnemonic
        };
        localStorage.setItem('wallet_data', JSON.stringify(data));
    }
}

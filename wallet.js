
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
            to,
            amount: parseFloat(amount),
            date: new Date().toLocaleTimeString(),
            hash: txResponse.hash,
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

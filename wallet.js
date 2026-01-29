/**
 * Wallet Logic
 * Simulates encrypted storage and transaction logic.
 */
class WalletManager {
    constructor() {
        this.address = null;
        this.balance = 0;
        this.history = [];
        this.currentPin = null; // In memory only
    }

    hasWallet() {
        return !!localStorage.getItem('wallet_data');
    }

    unlock(pin) {
        const data = localStorage.getItem('wallet_data');
        if (!data) return false;
        
        const parsed = JSON.parse(data);
        // In a real app, you would hash the PIN and verify the hash
        // Here we do a simple string comparison for the mock
        if (parsed.pin === pin) {
            this.address = parsed.address;
            this.balance = parsed.balance;
            this.history = parsed.history || [];
            this.currentPin = pin;
            return true;
        }
        return false;
    }

    generateMnemonic() {
        // Use ethers to generate a random wallet
        const wallet = ethers.Wallet.createRandom();
        return {
            phrase: wallet.mnemonic.phrase,
            address: wallet.address
        };
    }

    saveWallet(pin, address) {
        this.address = address;
        this.balance = 2.5; // Give some mock ETH to start
        this.history = [];
        this.currentPin = pin;
        this.save();
    }

    sendTransaction(to, amount) {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) throw new Error("Invalid amount");
        if (val > this.balance) throw new Error("Insufficient funds");

        this.balance -= val;
        const tx = {
            to,
            amount: val,
            date: new Date().toLocaleTimeString(),
            hash: "0x" + Math.random().toString(16).slice(2, 10) + "..."
        };
        this.history.unshift(tx);
        this.save();
        return tx;
    }

    save() {
        // In a real app, encrypt this data before saving!
        const data = { address: this.address, balance: this.balance, history: this.history, pin: this.currentPin };
        localStorage.setItem('wallet_data', JSON.stringify(data));
    }
}
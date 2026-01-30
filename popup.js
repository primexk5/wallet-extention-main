document.addEventListener('DOMContentLoaded', () => {
    const walletManager = new WalletManager();
    let tempMnemonic = "";
    let tempAddress = "";

    // Views
    const loginView = document.getElementById('login-view');
    const setupView = document.getElementById('setup-view');
    const seedView = document.getElementById('seed-view');
    const pinSetupView = document.getElementById('pin-setup-view');
    const walletView = document.getElementById('wallet-view');
    const recoverView = document.getElementById('recover-view');

    // Elements
    const addressSpan = document.getElementById('address');
    const balanceSpan = document.getElementById('balance');
    const historyList = document.getElementById('tx-history');
    const seedPhraseDiv = document.getElementById('seed-phrase');
    const errorMsg = document.getElementById('login-error');
    const sendMsg = document.getElementById('send-msg');
    const networkSelector = document.getElementById('network-selector');
    const currencySymbol = document.getElementById('currency-symbol');
    const sendCurrency = document.getElementById('send-currency');

    // Inputs
    const loginPassInput = document.getElementById('login-password');
    const setupPinInput = document.getElementById('setup-pin');
    const sendToInput = document.getElementById('send-to');
    const sendAmountInput = document.getElementById('send-amount');
    const recoverPhraseInput = document.getElementById('recover-phrase');
    const recoverPinInput = document.getElementById('recover-pin');

    // Buttons
    const btnLogin = document.getElementById('btn-login');
    const btnCreateStart = document.getElementById('btn-create-start');
    const btnConfirmSeed = document.getElementById('btn-confirm-seed');
    const btnSetPin = document.getElementById('btn-set-pin');
    const btnSend = document.getElementById('btn-send');
    const btnLogout = document.getElementById('btn-logout');
    const btnRecoverMode = document.getElementById('btn-recover-mode');
    const btnRecoverConfirm = document.getElementById('btn-recover-confirm');
    const btnRecoverCancel = document.getElementById('btn-recover-cancel');
    const btnCopySeed = document.getElementById('btn-copy-seed');

    // Check if wallet exists
    if (walletManager.hasWallet()) {
        loginView.classList.remove('hidden');
    } else {
        setupView.classList.remove('hidden');
    }

    // --- Click Outside to Close ---
    document.addEventListener('click', (e) => {
        if (e.target === document.body) {
            window.close();
        }
    });

    // --- Password Visibility Toggle ---
    const eyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeClosed = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                toggle.innerHTML = eyeClosed;
            } else {
                input.type = 'password';
                toggle.innerHTML = eyeOpen;
            }
        });
    });

    // --- Copy to Clipboard ---
    if (btnCopySeed) {
        btnCopySeed.addEventListener('click', () => {
            const seed = seedPhraseDiv.textContent;
            navigator.clipboard.writeText(seed).then(() => {
                const originalText = btnCopySeed.textContent;
                btnCopySeed.textContent = "Copied!";
                btnCopySeed.style.color = "#81c784";
                setTimeout(() => {
                    btnCopySeed.textContent = originalText;
                    btnCopySeed.style.color = "";
                }, 2000);
            });
        });
    }

    // --- Network Selector Setup ---
    const networks = walletManager.getNetworks();
    Object.keys(networks).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = networks[key].name;
        if (key === walletManager.network) option.selected = true;
        networkSelector.appendChild(option);
    });

    networkSelector.addEventListener('change', async (e) => {
        try {
            await walletManager.switchNetwork(e.target.value);
            updateUI();
        } catch (error) {
            alert("Failed to switch network: " + error.message);
        }
    });

    // --- Event Listeners ---

    btnLogin.addEventListener('click', async () => {
        const pin = loginPassInput.value;
        if (await walletManager.unlock(pin)) {
            showWallet();
        } else {
            errorMsg.textContent = "Incorrect PIN";
            errorMsg.classList.remove('hidden');
        }
    });

    // Step 1: Generate Mnemonic
    btnCreateStart.addEventListener('click', () => {
        const data = walletManager.generateMnemonic();
        tempMnemonic = data.phrase;
        tempAddress = data.address;

        seedPhraseDiv.textContent = tempMnemonic;

        setupView.classList.add('hidden');
        seedView.classList.remove('hidden');
    });

    // Step 2: Confirm Saved
    btnConfirmSeed.addEventListener('click', () => {
        seedView.classList.add('hidden');
        pinSetupView.classList.remove('hidden');
    });

    // Step 3: Set PIN and Create
    btnSetPin.addEventListener('click', () => {
        const pin = setupPinInput.value;
        if (!/^\d{4}$/.test(pin)) {
            return alert("Please enter a 4-digit numeric PIN");
        }
        walletManager.saveWallet(pin, tempMnemonic);
        showWallet();
    });

    btnSend.addEventListener('click', async () => {
        const to = sendToInput.value;
        const amount = sendAmountInput.value;
        if (!to || !amount) {
            sendMsg.textContent = "Please fill in all fields";
            sendMsg.style.color = "#ff6b6b";
            sendMsg.classList.remove('hidden');
            return;
        }

        try {
            sendMsg.textContent = "Sending...";
            sendMsg.classList.remove('hidden');

            await walletManager.sendTransaction(to, amount);
            updateUI();
            sendToInput.value = '';
            sendAmountInput.value = '';
            sendMsg.textContent = "Transaction Sent!";
            sendMsg.style.color = "#4caf50";
        } catch (e) {
            sendMsg.textContent = e.message;
            sendMsg.style.color = "#ff6b6b";
            sendMsg.classList.remove('hidden');
        }
    });

    btnLogout.addEventListener('click', () => {
        location.reload();
    });

    // --- Recovery Logic ---
    if (btnRecoverMode) {
        btnRecoverMode.addEventListener('click', () => {
            setupView.classList.add('hidden');
            if (recoverView) recoverView.classList.remove('hidden');
        });
    }

    if (btnRecoverConfirm) {
        btnRecoverConfirm.addEventListener('click', async () => {
            const phrase = recoverPhraseInput.value.trim();
            const pin = recoverPinInput.value;

            if (!phrase || !pin) return alert("Please fill in all fields");
            if (!/^\d{4}$/.test(pin)) return alert("PIN must be 4 digits");

            try {
                await walletManager.recoverWallet(phrase, pin);
                showWallet();
            } catch (e) {
                alert("Recovery failed: " + e.message);
            }
        });
    }

    if (btnRecoverCancel) {
        btnRecoverCancel.addEventListener('click', () => {
            recoverView.classList.add('hidden');
            setupView.classList.remove('hidden');
        });
    }

    function showWallet() {
        // Hide all other views
        [loginView, setupView, seedView, pinSetupView, recoverView].forEach(el => el && el.classList.add('hidden'));
        walletView.classList.remove('hidden');
        updateUI();
    }

    function updateUI() {
        addressSpan.textContent = walletManager.address;
        balanceSpan.textContent = walletManager.balance.toFixed(4);
        const networks = walletManager.getNetworks();
        const currentNetwork = networks[walletManager.network];
        currencySymbol.textContent = currentNetwork.symbol;
        if (sendCurrency) sendCurrency.textContent = currentNetwork.symbol;

        historyList.innerHTML = walletManager.history
            .filter(tx => !tx.network || tx.network === walletManager.network)
            .map(tx =>
                `<div class="history-item">Sent to: ${tx.to.substring(0, 10)}... <span class="history-amount">-${tx.amount} ${currentNetwork.symbol}</span></div>`
            ).join('');
    }
});
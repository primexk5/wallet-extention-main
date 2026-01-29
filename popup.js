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

    // Elements
    const addressSpan = document.getElementById('address');
    const balanceSpan = document.getElementById('balance');
    const historyList = document.getElementById('tx-history');
    const seedPhraseDiv = document.getElementById('seed-phrase');
    const errorMsg = document.getElementById('login-error');
    const sendMsg = document.getElementById('send-msg');

    // Inputs
    const loginPassInput = document.getElementById('login-password');
    const setupPinInput = document.getElementById('setup-pin');
    const sendToInput = document.getElementById('send-to');
    const sendAmountInput = document.getElementById('send-amount');

    // Buttons
    const btnLogin = document.getElementById('btn-login');
    const btnCreateStart = document.getElementById('btn-create-start');
    const btnConfirmSeed = document.getElementById('btn-confirm-seed');
    const btnSetPin = document.getElementById('btn-set-pin');
    const btnSend = document.getElementById('btn-send');
    const btnLogout = document.getElementById('btn-logout');

    // Check if wallet exists
    if (walletManager.hasWallet()) {
        loginView.classList.remove('hidden');
    } else {
        setupView.classList.remove('hidden');
    }

    // --- Click Outside to Close ---
    document.addEventListener('click', (e) => {
        // If the click target is the body (the padding area outside container), close window
        if (e.target === document.body) {
            window.close();
        }
    });

    // --- Event Listeners ---

    btnLogin.addEventListener('click', () => {
        const pin = loginPassInput.value;
        if (walletManager.unlock(pin)) {
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

    
    btnConfirmSeed.addEventListener('click', () => {
        seedView.classList.add('hidden');
        pinSetupView.classList.remove('hidden');
    });

    
    btnSetPin.addEventListener('click', () => {
        const pin = setupPinInput.value;
        if (!/^\d{4}$/.test(pin)) {
            return alert("Please enter a 4-digit numeric PIN");
        }
        walletManager.saveWallet(pin, tempAddress);
        showWallet();
    });

    btnSend.addEventListener('click', () => {
        const to = sendToInput.value;
        const amount = sendAmountInput.value;
        if(!to || !amount) {
            sendMsg.textContent = "Please fill in all fields";
            sendMsg.style.color = "#ff6b6b";
            sendMsg.classList.remove('hidden');
            return;
        }

        try {
            walletManager.sendTransaction(to, amount);
            updateUI();
            sendToInput.value = '';
            sendAmountInput.value = '';
            sendMsg.textContent = "Sent!";
            sendMsg.style.color = "#4caf50"; // Green for success
            sendMsg.classList.remove('hidden');
        } catch (e) {
            sendMsg.textContent = e.message;
            sendMsg.style.color = "#ff6b6b";
            sendMsg.classList.remove('hidden');
        }
    });

    btnLogout.addEventListener('click', () => {
        location.reload(); // Simple reload to reset state
    });

    function showWallet() {
        loginView.classList.add('hidden');
        setupView.classList.add('hidden');
        seedView.classList.add('hidden');
        pinSetupView.classList.add('hidden');
        walletView.classList.remove('hidden');
        updateUI();
    }

    function updateUI() {
        addressSpan.textContent = walletManager.address;
        balanceSpan.textContent = walletManager.balance.toFixed(4);
        historyList.innerHTML = walletManager.history.map(tx => 
            `<div class="history-item">Sent to: ${tx.to.substring(0,10)}... <span class="history-amount">-${tx.amount} ETH</span></div>`
        ).join('');
    }
});
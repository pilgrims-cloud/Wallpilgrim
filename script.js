// Pilgrim Wallet - Crypto & Multi-Currency Wallet
// Owner: Olawale Abdul-Ganiyu

// ==================== OWNER INFORMATION ====================
const ownerInfo = {
    name: 'Olawale Abdul-Ganiyu',
    email: 'adeganglobal@gmail.com',
    phone: '+234 903 027 7275',
    location: 'Ikeja, Lagos, Ogun State, Nigeria'
};

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let isLoggedIn = false;

let wallet = {
    BTC: 0,
    ETH: 0,
    USDT: 0,
    PLG: 0,
    USD: 0,
    NGN: 0
};

let walletAddresses = {
    BTC: '',
    ETH: '',
    USDT: '',
    PLG: '',
    USD: '',
    NGN: ''
};

let barcodes = {
    BTC: '',
    ETH: '',
    USDT: '',
    PLG: '',
    USD: '',
    NGN: ''
};

// Exchange rates
const exchangeRates = {
    BTC_USD: 43750.00,
    ETH_USD: 2280.00,
    USDT_USD: 1.00,
    PLG_USD: 0.50,
    USD_NGN: 1500.00
};

// Mining variables
let isMining = false;
let miningInterval = null;
let miningStartTime = null;
let totalMined = 0;
let miningRate = 0.00000001; // Starting at 0.00000001 PLG/sec
let miningHistory = [];

// Transaction history
let transactions = [];

// Matrix network variables
let matrixId = '';
let matrixStats = {
    totalSent: 0,
    totalReceived: 0,
    members: 0
};
let matrixTransactions = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    
    // Check if logged in
    const loggedUser = localStorage.getItem('pilgrimLoggedIn');
    if (loggedUser) {
        currentUser = JSON.parse(loggedUser);
        isLoggedIn = true;
        showDashboard();
    }
    
    // Generate wallet addresses if not exists
    if (!walletAddresses.BTC) {
        generateWalletAddresses();
    }
    
    // Generate Matrix ID if not exists
    if (!matrixId) {
        generateMatrixId();
    }
    
    updateDashboard();
});

// ==================== AUTHENTICATION ====================
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    
    // For demo, create or load user
    const storedUsers = JSON.parse(localStorage.getItem('pilgrimUsers') || '[]');
    let user = storedUsers.find(u => u.email === email);
    
    if (!user) {
        // Create new user
        user = {
            id: Date.now(),
            email: email,
            password: password,
            name: email.split('@')[0],
            createdAt: new Date().toISOString()
        };
        storedUsers.push(user);
        localStorage.setItem('pilgrimUsers', JSON.stringify(storedUsers));
    } else if (user.password !== password) {
        showNotification('Invalid password', 'error');
        return;
    }
    
    currentUser = user;
    isLoggedIn = true;
    localStorage.setItem('pilgrimLoggedIn', JSON.stringify(currentUser));
    
    showNotification('Welcome to Pilgrim Wallet!', 'success');
    showDashboard();
}

function showRegister() {
    alert('Registration is automatic. Just login with your email and password to create an account.');
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('pilgrimLoggedIn');
    
    // Stop mining if active
    if (isMining) {
        toggleMining();
    }
    
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    
    showNotification('Logged out successfully', 'success');
}

// ==================== DASHBOARD ====================
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('profileEmail').value = currentUser.email;
        document.getElementById('profileName').value = currentUser.name;
    }
    
    updateDashboard();
    generateQRCodes();
}

function updateDashboard() {
    // Update balances
    document.getElementById('btcBalance').textContent = wallet.BTC.toFixed(8);
    document.getElementById('ethBalance').textContent = wallet.ETH.toFixed(8);
    document.getElementById('usdtBalance').textContent = wallet.USDT.toFixed(2);
    document.getElementById('plgBalance').textContent = wallet.PLG.toFixed(8);
    document.getElementById('usdBalance').textContent = wallet.USD.toFixed(2);
    document.getElementById('ngnBalance').textContent = wallet.NGN.toFixed(2);
    
    // Update USD values
    document.getElementById('btcUSDValue').textContent = (wallet.BTC * exchangeRates.BTC_USD).toFixed(2);
    document.getElementById('ethUSDValue').textContent = (wallet.ETH * exchangeRates.ETH_USD).toFixed(2);
    document.getElementById('usdtUSDValue').textContent = wallet.USDT.toFixed(2);
    document.getElementById('plgUSDValue').textContent = (wallet.PLG * exchangeRates.PLG_USD).toFixed(2);
    document.getElementById('usdNGNValue').textContent = (wallet.USD * exchangeRates.USD_NGN).toFixed(2);
    document.getElementById('ngnUSDValue').textContent = (wallet.NGN / exchangeRates.USD_NGN).toFixed(2);
    
    // Update wallet detail cards
    document.getElementById('btcWalletBalance').textContent = wallet.BTC.toFixed(8);
    document.getElementById('ethWalletBalance').textContent = wallet.ETH.toFixed(8);
    document.getElementById('usdtWalletBalance').textContent = wallet.USDT.toFixed(2);
    document.getElementById('plgWalletBalance').textContent = wallet.PLG.toFixed(8);
    document.getElementById('usdWalletBalance').textContent = wallet.USD.toFixed(2);
    document.getElementById('ngnWalletBalance').textContent = wallet.NGN.toFixed(2);
    
    document.getElementById('btcWalletUSDValue').textContent = (wallet.BTC * exchangeRates.BTC_USD).toFixed(2);
    document.getElementById('ethWalletUSDValue').textContent = (wallet.ETH * exchangeRates.ETH_USD).toFixed(2);
    document.getElementById('usdtWalletUSDValue').textContent = wallet.USDT.toFixed(2);
    document.getElementById('plgWalletUSDValue').textContent = (wallet.PLG * exchangeRates.PLG_USD).toFixed(2);
    document.getElementById('usdWalletNGNValue').textContent = (wallet.USD * exchangeRates.USD_NGN).toFixed(2);
    document.getElementById('ngnWalletUSDValue').textContent = (wallet.NGN / exchangeRates.USD_NGN).toFixed(2);
    
    // Update wallet addresses
    document.getElementById('btcWalletAddress').textContent = walletAddresses.BTC.substring(0, 20) + '...';
    document.getElementById('ethWalletAddress').textContent = walletAddresses.ETH.substring(0, 20) + '...';
    document.getElementById('usdtWalletAddress').textContent = walletAddresses.USDT.substring(0, 20) + '...';
    document.getElementById('plgWalletAddress').textContent = walletAddresses.PLG.substring(0, 20) + '...';
    document.getElementById('usdWalletAddress').textContent = walletAddresses.USD.substring(0, 20) + '...';
    document.getElementById('ngnWalletAddress').textContent = walletAddresses.NGN.substring(0, 20) + '...';
    
    // Update barcodes
    document.getElementById('btcBarcode').textContent = barcodes.BTC;
    document.getElementById('ethBarcode').textContent = barcodes.ETH;
    document.getElementById('usdtBarcode').textContent = barcodes.USDT;
    document.getElementById('plgBarcode').textContent = barcodes.PLG;
    document.getElementById('usdBarcode').textContent = barcodes.USD;
    document.getElementById('ngnBarcode').textContent = barcodes.NGN;
    
    // Calculate total portfolio value
    const totalUSD = 
        (wallet.BTC * exchangeRates.BTC_USD) +
        (wallet.ETH * exchangeRates.ETH_USD) +
        wallet.USDT +
        (wallet.PLG * exchangeRates.PLG_USD) +
        wallet.USD;
    
    document.getElementById('totalBalanceUSD').textContent = totalUSD.toFixed(2);
    document.getElementById('totalBalanceNGN').textContent = (totalUSD * exchangeRates.USD_NGN).toFixed(2);
    
    // Update mining display
    document.getElementById('totalMined').textContent = totalMined.toFixed(8);
    document.getElementById('miningRate').textContent = miningRate.toFixed(8);
    document.getElementById('miningUSDValue').textContent = (totalMined * exchangeRates.PLG_USD).toFixed(2);
    
    if (isMining && miningStartTime) {
        const elapsed = Math.floor((Date.now() - miningStartTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        document.getElementById('miningTime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Update Matrix stats
    document.getElementById('matrixTotalSent').textContent = matrixStats.totalSent.toFixed(2);
    document.getElementById('matrixTotalReceived').textContent = matrixStats.totalReceived.toFixed(2);
    document.getElementById('matrixMembers').textContent = matrixStats.members;
    document.getElementById('matrixId').textContent = matrixId;
    
    // Update transactions
    updateTransactionTable();
    updateRecentActivity();
    updateMiningHistory();
    updateMatrixHistory();
    
    saveToStorage();
}

// ==================== WALLET ADDRESSES ====================
function generateWalletAddresses() {
    const prefixes = {
        BTC: 'bc1',
        ETH: '0x',
        USDT: '0x',
        PLG: 'PLG',
        USD: 'USD',
        NGN: 'NGN'
    };
    
    Object.keys(prefixes).forEach(currency => {
        const randomPart = Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        walletAddresses[currency] = prefixes[currency] + randomPart;
        barcodes[currency] = Math.random().toString(36).substring(2, 15).toUpperCase();
    });
    
    saveToStorage();
}

function generateMatrixId() {
    const randomPart = Math.floor(Math.random() * 90000) + 10000;
    matrixId = 'XYZ-' + randomPart;
    matrixStats.members = Math.floor(Math.random() * 100) + 50;
    saveToStorage();
}

// ==================== QR CODE GENERATION ====================
function generateQRCodes() {
    // Simple QR code generation using canvas
    const currencies = ['BTC', 'ETH', 'USDT', 'PLG', 'USD', 'NGN'];
    
    currencies.forEach(currency => {
        const canvas = document.getElementById(currency.toLowerCase() + 'QR');
        if (canvas) {
            drawSimpleQR(canvas, walletAddresses[currency]);
        }
    });
}

function drawSimpleQR(canvas, data) {
    const ctx = canvas.getContext('2d');
    const size = 150;
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw simple pattern (simulating QR code)
    ctx.fillStyle = '#000000';
    const cellSize = size / 25;
    
    // Generate pattern based on data
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i);
        const x = (charCode % 25) * cellSize;
        const y = (i % 25) * cellSize;
        ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
    }
}

// ==================== MINING ====================
function toggleMining() {
    const btn = document.getElementById('toggleMiningBtn');
    const statusDiv = document.getElementById('miningStatus');
    const stateSpan = document.getElementById('miningState');
    
    if (!isMining) {
        // Start mining
        isMining = true;
        miningStartTime = Date.now();
        stateSpan.textContent = 'Active';
        statusDiv.classList.add('active');
        btn.textContent = '⏸️ Stop Mining';
        
        // Start mining interval
        miningInterval = setInterval(() => {
            const mined = miningRate;
            totalMined += mined;
            wallet.PLG += mined;
            
            // Convert to USD (1 PLG = $0.50)
            const usdValue = mined * exchangeRates.PLG_USD;
            wallet.USD += usdValue;
            
            // Add to mining history every 10 seconds
            if (Math.floor(Date.now() / 10000) % 10 === 0) {
                miningHistory.unshift({
                    id: Date.now(),
                    amount: mined,
                    usdValue: usdValue,
                    timestamp: new Date().toISOString()
                });
            }
            
            updateDashboard();
        }, 1000);
        
        showNotification('Mining started! Earning PLG coins', 'success');
    } else {
        // Stop mining
        isMining = false;
        clearInterval(miningInterval);
        stateSpan.textContent = 'Stopped';
        statusDiv.classList.remove('active');
        btn.textContent = '⛏️ Start Mining';
        
        showNotification('Mining stopped', 'warning');
    }
}

// ==================== NAVIGATION ====================
function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    const targetSection = document.getElementById(sectionId + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    } else if (sectionId === 'overview') {
        document.getElementById('overviewSection').style.display = 'block';
    }
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    event.target.classList.add('active');
}

// ==================== RECEIVE ====================
function receiveCrypto(currency) {
    document.getElementById('receiveCurrencyLabel').textContent = currency;
    document.getElementById('receiveWalletAddress').textContent = walletAddresses[currency];
    document.getElementById('receiveBarcode').textContent = barcodes[currency];
    
    // Generate QR code
    const canvas = document.getElementById('receiveQR');
    if (canvas) {
        drawSimpleQR(canvas, walletAddresses[currency]);
    }
    
    document.getElementById('receiveModal').style.display = 'flex';
}

function receiveFromExchange() {
    showNotification('Select a currency to receive from exchange', 'success');
}

function receiveFromPayeer() {
    showNotification('Select a currency to receive from Payeer', 'success');
}

function receiveFromPayPal() {
    showNotification('Receive USD from PayPal wallet address', 'success');
}

function receiveFromBank() {
    showNotification('Receive fiat via bank transfer', 'success');
}

function receiveInvestment() {
    showNotification('Investment returns will be credited to your USD wallet', 'success');
}

function receiveMatrix() {
    showNotification('Receive funds via Matrix Network using your Matrix ID: ' + matrixId, 'success');
}

function copyAddress() {
    const address = document.getElementById('receiveWalletAddress').textContent;
    navigator.clipboard.writeText(address).then(() => {
        showNotification('Address copied to clipboard!', 'success');
    });
}

// ==================== SEND ====================
function sendCrypto(currency) {
    document.getElementById('sendCurrency').value = currency;
    updateSendForm();
    showSection('send');
}

function updateSendForm() {
    const currency = document.getElementById('sendCurrency').value;
    let balance = 0;
    
    switch (currency) {
        case 'BTC': balance = wallet.BTC; break;
        case 'ETH': balance = wallet.ETH; break;
        case 'USDT': balance = wallet.USDT; break;
        case 'PLG': balance = wallet.PLG; break;
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    document.getElementById('sendAvailableBalance').textContent = formatCurrency(balance);
}

function updateRecipientFields() {
    const recipientType = document.getElementById('recipientType').value;
    
    document.getElementById('recipientNameGroup').style.display = 
        recipientType === 'bank' || recipientType === 'paypal' ? 'block' : 'none';
    
    document.getElementById('recipientBankGroup').style.display = 
        recipientType === 'bank' ? 'block' : 'none';
}

function sendFunds() {
    const currency = document.getElementById('sendCurrency').value;
    const recipientType = document.getElementById('recipientType').value;
    const recipientAddress = document.getElementById('recipientAddress').value;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const description = document.getElementById('sendDescription').value;
    
    if (!recipientAddress || !amount) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    let balance = 0;
    switch (currency) {
        case 'BTC': balance = wallet.BTC; break;
        case 'ETH': balance = wallet.ETH; break;
        case 'USDT': balance = wallet.USDT; break;
        case 'PLG': balance = wallet.PLG; break;
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    if (balance < amount) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    // Deduct from wallet
    switch (currency) {
        case 'BTC': wallet.BTC -= amount; break;
        case 'ETH': wallet.ETH -= amount; break;
        case 'USDT': wallet.USDT -= amount; break;
        case 'PLG': wallet.PLG -= amount; break;
        case 'USD': wallet.USD -= amount; break;
        case 'NGN': wallet.NGN -= amount; break;
    }
    
    // Add transaction
    addTransaction('send', currency, amount, recipientAddress, recipientType, description);
    
    // Update Matrix stats if sending via Matrix
    if (recipientType === 'matrix') {
        matrixStats.totalSent += amount;
    }
    
    // Clear form
    document.getElementById('recipientAddress').value = '';
    document.getElementById('sendAmount').value = '';
    document.getElementById('sendDescription').value = '';
    
    saveToStorage();
    updateDashboard();
    
    showNotification(`Sent ${formatCurrency(amount)} ${currency} successfully!`, 'success');
}

// ==================== EXCHANGE ====================
function updateExchangeRates() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    let balance = 0;
    switch (fromCurrency) {
        case 'BTC': balance = wallet.BTC; break;
        case 'ETH': balance = wallet.ETH; break;
        case 'USDT': balance = wallet.USDT; break;
        case 'PLG': balance = wallet.PLG; break;
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    document.getElementById('exchangeAvailableBalance').textContent = formatCurrency(balance);
    document.getElementById('fromRateLabel').textContent = fromCurrency;
    document.getElementById('toRateLabel').textContent = toCurrency;
    
    calculateExchange();
}

function calculateExchange() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = parseFloat(document.getElementById('exchangeAmount').value) || 0;
    
    // Calculate exchange rate
    let rate = 1;
    if (fromCurrency !== toCurrency) {
        // Convert to USD first
        let fromUSD = 0;
        switch (fromCurrency) {
            case 'BTC': fromUSD = amount * exchangeRates.BTC_USD; break;
            case 'ETH': fromUSD = amount * exchangeRates.ETH_USD; break;
            case 'USDT': fromUSD = amount; break;
            case 'PLG': fromUSD = amount * exchangeRates.PLG_USD; break;
            case 'USD': fromUSD = amount; break;
            case 'NGN': fromUSD = amount / exchangeRates.USD_NGN; break;
        }
        
        // Convert from USD to target
        switch (toCurrency) {
            case 'BTC': rate = fromUSD / exchangeRates.BTC_USD / amount; break;
            case 'ETH': rate = fromUSD / exchangeRates.ETH_USD / amount; break;
            case 'USDT': rate = fromUSD / amount; break;
            case 'PLG': rate = fromUSD / exchangeRates.PLG_USD / amount; break;
            case 'USD': rate = fromUSD / amount; break;
            case 'NGN': rate = fromUSD * exchangeRates.USD_NGN / amount; break;
        }
    }
    
    const receiveAmount = amount * rate * 0.99; // 1% fee
    const fee = amount * rate * 0.01;
    
    document.getElementById('exchangeRate').textContent = rate.toFixed(6);
    document.getElementById('receiveAmount').textContent = formatCurrency(receiveAmount);
    document.getElementById('receiveCurrencyLabel').textContent = toCurrency;
    document.getElementById('exchangeFee').textContent = formatCurrency(fee);
}

function exchangeCurrency() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = parseFloat(document.getElementById('exchangeAmount').value) || 0;
    
    if (amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    if (fromCurrency === toCurrency) {
        showNotification('Cannot exchange same currency', 'error');
        return;
    }
    
    // Check balance
    let balance = 0;
    switch (fromCurrency) {
        case 'BTC': balance = wallet.BTC; break;
        case 'ETH': balance = wallet.ETH; break;
        case 'USDT': balance = wallet.USDT; break;
        case 'PLG': balance = wallet.PLG; break;
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    if (balance < amount) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    // Convert to USD first
    let fromUSD = 0;
    switch (fromCurrency) {
        case 'BTC': fromUSD = amount * exchangeRates.BTC_USD; break;
        case 'ETH': fromUSD = amount * exchangeRates.ETH_USD; break;
        case 'USDT': fromUSD = amount; break;
        case 'PLG': fromUSD = amount * exchangeRates.PLG_USD; break;
        case 'USD': fromUSD = amount; break;
        case 'NGN': fromUSD = amount / exchangeRates.USD_NGN; break;
    }
    
    // Convert from USD to target
    let toAmount = 0;
    switch (toCurrency) {
        case 'BTC': toAmount = fromUSD / exchangeRates.BTC_USD; break;
        case 'ETH': toAmount = fromUSD / exchangeRates.ETH_USD; break;
        case 'USDT': toAmount = fromUSD; break;
        case 'PLG': toAmount = fromUSD / exchangeRates.PLG_USD; break;
        case 'USD': toAmount = fromUSD; break;
        case 'NGN': toAmount = fromUSD * exchangeRates.USD_NGN; break;
    }
    
    // Apply 1% fee
    toAmount *= 0.99;
    const fee = toAmount * 0.01;
    
    // Deduct from source
    switch (fromCurrency) {
        case 'BTC': wallet.BTC -= amount; break;
        case 'ETH': wallet.ETH -= amount; break;
        case 'USDT': wallet.USDT -= amount; break;
        case 'PLG': wallet.PLG -= amount; break;
        case 'USD': wallet.USD -= amount; break;
        case 'NGN': wallet.NGN -= amount; break;
    }
    
    // Add to target
    switch (toCurrency) {
        case 'BTC': wallet.BTC += toAmount; break;
        case 'ETH': wallet.ETH += toAmount; break;
        case 'USDT': wallet.USDT += toAmount; break;
        case 'PLG': wallet.PLG += toAmount; break;
        case 'USD': wallet.USD += toAmount; break;
        case 'NGN': wallet.NGN += toAmount; break;
    }
    
    // Add transaction
    addTransaction('exchange', fromCurrency + '->' + toCurrency, amount, toAmount.toFixed(6), 'Exchange', `Fee: ${formatCurrency(fee)} ${toCurrency}`);
    
    // Clear form
    document.getElementById('exchangeAmount').value = '';
    
    saveToStorage();
    updateDashboard();
    
    showNotification(`Exchanged ${formatCurrency(amount)} ${fromCurrency} to ${formatCurrency(toAmount)} ${toCurrency}`, 'success');
}

// ==================== MATRIX ====================
function sendMatrix() {
    const recipientId = document.getElementById('matrixRecipientId').value;
    const currency = document.getElementById('matrixCurrency').value;
    const amount = parseFloat(document.getElementById('matrixAmount').value) || 0;
    const message = document.getElementById('matrixMessage').value;
    
    if (!recipientId || !amount) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    let balance = 0;
    switch (currency) {
        case 'BTC': balance = wallet.BTC; break;
        case 'ETH': balance = wallet.ETH; break;
        case 'USDT': balance = wallet.USDT; break;
        case 'PLG': balance = wallet.PLG; break;
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    if (balance < amount) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    // Deduct from wallet
    switch (currency) {
        case 'BTC': wallet.BTC -= amount; break;
        case 'ETH': wallet.ETH -= amount; break;
        case 'USDT': wallet.USDT -= amount; break;
        case 'PLG': wallet.PLG -= amount; break;
        case 'USD': wallet.USD -= amount; break;
        case 'NGN': wallet.NGN -= amount; break;
    }
    
    // Update Matrix stats
    matrixStats.totalSent += amount;
    
    // Add Matrix transaction
    matrixTransactions.unshift({
        id: Date.now(),
        type: 'send',
        recipientId: recipientId,
        currency: currency,
        amount: amount,
        message: message,
        timestamp: new Date().toISOString()
    });
    
    // Add to transactions
    addTransaction('send', currency, amount, recipientId, 'Matrix', message || 'Matrix transfer');
    
    // Clear form
    document.getElementById('matrixRecipientId').value = '';
    document.getElementById('matrixAmount').value = '';
    document.getElementById('matrixMessage').value = '';
    
    saveToStorage();
    updateDashboard();
    
    showNotification(`Sent ${formatCurrency(amount)} ${currency} via Matrix to ${recipientId}`, 'success');
}

// ==================== DEPOSIT/WITHDRAW ====================
function depositFiat(currency) {
    document.getElementById('depositCurrencyLabel').textContent = currency;
    document.getElementById('depositModal').style.display = 'flex';
}

function withdrawFiat(currency) {
    let balance = 0;
    switch (currency) {
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    document.getElementById('withdrawCurrencyLabel').textContent = currency;
    document.getElementById('withdrawAvailableBalance').textContent = formatCurrency(balance);
    document.getElementById('withdrawModal').style.display = 'flex';
}

function processDeposit() {
    const currency = document.getElementById('depositCurrencyLabel').textContent;
    const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
    const method = document.getElementById('depositMethod').value;
    
    if (amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    // Add to wallet
    switch (currency) {
        case 'USD': wallet.USD += amount; break;
        case 'NGN': wallet.NGN += amount; break;
    }
    
    // Add transaction
    addTransaction('deposit', currency, amount, method, 'Deposit', 'Fiat deposit');
    
    // Clear form
    document.getElementById('depositAmount').value = '';
    
    saveToStorage();
    updateDashboard();
    closeModals();
    
    showNotification(`Deposit of ${formatCurrency(amount)} ${currency} successful!`, 'success');
}

function processWithdrawal() {
    const currency = document.getElementById('withdrawCurrencyLabel').textContent;
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    const method = document.getElementById('withdrawMethod').value;
    const bank = document.getElementById('withdrawBank').value;
    const account = document.getElementById('withdrawAccount').value;
    const accountName = document.getElementById('withdrawAccountName').value;
    
    if (amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    let balance = 0;
    switch (currency) {
        case 'USD': balance = wallet.USD; break;
        case 'NGN': balance = wallet.NGN; break;
    }
    
    if (balance < amount) {
        showNotification('Insufficient balance', 'error');
        return;
    }
    
    if (method === 'bank' && (!account || !accountName)) {
        showNotification('Please enter account details', 'error');
        return;
    }
    
    // Deduct from wallet
    switch (currency) {
        case 'USD': wallet.USD -= amount; break;
        case 'NGN': wallet.NGN -= amount; break;
    }
    
    // Add transaction
    addTransaction('withdrawal', currency, amount, account || method, method, `Withdrawal to ${accountName || method}`);
    
    // Clear form
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawAccount').value = '';
    document.getElementById('withdrawAccountName').value = '';
    
    saveToStorage();
    updateDashboard();
    closeModals();
    
    showNotification(`Withdrawal of ${formatCurrency(amount)} ${currency} submitted!`, 'success');
}

// ==================== TRANSACTIONS ====================
function addTransaction(type, currency, amount, to, method, description) {
    const transaction = {
        id: Date.now(),
        type: type,
        currency: currency,
        amount: amount,
        to: to,
        from: matrixId,
        method: method,
        description: description,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    
    // Limit to 100 transactions
    if (transactions.length > 100) {
        transactions.pop();
    }
}

function updateTransactionTable() {
    const tbody = document.getElementById('transactionsTableBody');
    const typeFilter = document.getElementById('transactionTypeFilter')?.value || 'all';
    const currencyFilter = document.getElementById('transactionCurrencyFilter')?.value || 'all';
    
    let filteredTransactions = [...transactions];
    
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    if (currencyFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.currency.includes(currencyFilter));
    }
    
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No transactions</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredTransactions.slice(0, 50).map(transaction => `
        <tr>
            <td>${new Date(transaction.timestamp).toLocaleDateString()}</td>
            <td>${transaction.type}</td>
            <td>${transaction.to || transaction.from}</td>
            <td>${formatCurrency(transaction.amount)} ${transaction.currency}</td>
            <td><span class="status-badge active">${transaction.status}</span></td>
            <td>${transaction.id.toString().substring(0, 10)}...</td>
        </tr>
    `).join('');
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    
    container.innerHTML = transactions.slice(0, 5).map(transaction => `
        <div class="activity-item">
            <div>
                <p><strong>${transaction.type}</strong> ${transaction.currency}</p>
                <p class="timestamp">${new Date(transaction.timestamp).toLocaleString()}</p>
            </div>
            <p class="amount">${transaction.type === 'send' || transaction.type === 'withdrawal' || transaction.type === 'exchange' ? '-' : '+'}${formatCurrency(transaction.amount)}</p>
        </div>
    `).join('');
}

function updateMiningHistory() {
    const container = document.getElementById('miningHistory');
    
    if (miningHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">No mining history</p>';
        return;
    }
    
    container.innerHTML = miningHistory.slice(0, 10).map(mining => `
        <div class="history-item">
            <div>
                <p><strong>Mining</strong></p>
                <p class="timestamp">${new Date(mining.timestamp).toLocaleString()}</p>
            </div>
            <p class="amount">+${mining.amount.toFixed(8)} PLG</p>
        </div>
    `).join('');
}

function updateMatrixHistory() {
    const container = document.getElementById('matrixHistory');
    
    if (matrixTransactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No Matrix transactions</p>';
        return;
    }
    
    container.innerHTML = matrixTransactions.slice(0, 10).map(transaction => `
        <div class="history-item">
            <div>
                <p><strong>${transaction.type}</strong></p>
                <p>To: ${transaction.recipientId}</p>
                <p class="timestamp">${new Date(transaction.timestamp).toLocaleString()}</p>
            </div>
            <p class="amount">${transaction.type === 'send' ? '-' : '+'}${formatCurrency(transaction.amount)} ${transaction.currency}</p>
        </div>
    `).join('');
}

function filterTransactions() {
    updateTransactionTable();
}

// ==================== PROFILE ====================
function saveProfile() {
    if (!currentUser) return;
    
    currentUser.name = document.getElementById('profileName').value;
    currentUser.phone = document.getElementById('profilePhone').value;
    currentUser.country = document.getElementById('profileCountry').value;
    currentUser.state = document.getElementById('profileState').value;
    currentUser.address = document.getElementById('profileAddress').value;
    
    localStorage.setItem('pilgrimLoggedIn', JSON.stringify(currentUser));
    
    // Update in users list
    const storedUsers = JSON.parse(localStorage.getItem('pilgrimUsers') || '[]');
    const userIndex = storedUsers.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        storedUsers[userIndex] = currentUser;
        localStorage.setItem('pilgrimUsers', JSON.stringify(storedUsers));
    }
    
    document.getElementById('userName').textContent = currentUser.name;
    
    saveToStorage();
    showNotification('Profile saved successfully!', 'success');
}

function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (currentUser.password !== currentPassword) {
        showNotification('Current password is incorrect', 'error');
        return;
    }
    
    currentUser.password = newPassword;
    
    localStorage.setItem('pilgrimLoggedIn', JSON.stringify(currentUser));
    
    // Update in users list
    const storedUsers = JSON.parse(localStorage.getItem('pilgrimUsers') || '[]');
    const userIndex = storedUsers.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        storedUsers[userIndex] = currentUser;
        localStorage.setItem('pilgrimUsers', JSON.stringify(storedUsers));
    }
    
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    saveToStorage();
    showNotification('Password changed successfully!', 'success');
}

// ==================== MODALS ====================
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// ==================== UTILITY FUNCTIONS ====================
function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==================== STORAGE ====================
function saveToStorage() {
    localStorage.setItem('pilgrimWallet', JSON.stringify(wallet));
    localStorage.setItem('pilgrimAddresses', JSON.stringify(walletAddresses));
    localStorage.setItem('pilgrimBarcodes', JSON.stringify(barcodes));
    localStorage.setItem('pilgrimTransactions', JSON.stringify(transactions));
    localStorage.setItem('pilgrimMiningHistory', JSON.stringify(miningHistory));
    localStorage.setItem('pilgrimMatrixId', matrixId);
    localStorage.setItem('pilgrimMatrixStats', JSON.stringify(matrixStats));
    localStorage.setItem('pilgrimMatrixTransactions', JSON.stringify(matrixTransactions));
}

function loadFromStorage() {
    const storedWallet = localStorage.getItem('pilgrimWallet');
    if (storedWallet) {
        wallet = JSON.parse(storedWallet);
    }
    
    const storedAddresses = localStorage.getItem('pilgrimAddresses');
    if (storedAddresses) {
        walletAddresses = JSON.parse(storedAddresses);
    }
    
    const storedBarcodes = localStorage.getItem('pilgrimBarcodes');
    if (storedBarcodes) {
        barcodes = JSON.parse(storedBarcodes);
    }
    
    const storedTransactions = localStorage.getItem('pilgrimTransactions');
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }
    
    const storedMiningHistory = localStorage.getItem('pilgrimMiningHistory');
    if (storedMiningHistory) {
        miningHistory = JSON.parse(storedMiningHistory);
        totalMined = miningHistory.reduce((sum, m) => sum + m.amount, 0);
    }
    
    const storedMatrixId = localStorage.getItem('pilgrimMatrixId');
    if (storedMatrixId) {
        matrixId = storedMatrixId;
    }
    
    const storedMatrixStats = localStorage.getItem('pilgrimMatrixStats');
    if (storedMatrixStats) {
        matrixStats = JSON.parse(storedMatrixStats);
    }
    
    const storedMatrixTransactions = localStorage.getItem('pilgrimMatrixTransactions');
    if (storedMatrixTransactions) {
        matrixTransactions = JSON.parse(storedMatrixTransactions);
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModals();
    }
}

// Warn before closing if mining
window.onbeforeunload = function() {
    if (isMining) {
        return 'Mining is active. Are you sure you want to close?';
    }
};
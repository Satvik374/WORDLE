// Game state
let currentWord = '';
let currentRow = 0;
let currentCol = 0;
let gameOver = false;
let gameWon = false;
let guesses = [];
let gameBoard = [];
let keyboardState = {};

// Statistics
let stats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0]
};

// DOM elements
let boardElement;
let keyboardElement;
let gameModal;
let statsModal;
let settingsModal;
let themeToggle;

// Settings
let settings = {
    hardMode: false,
    darkTheme: true,
    highContrast: false,
    reduceMotion: false,
    soundEffects: true
};

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    boardElement = document.getElementById('game-board');
    keyboardElement = document.getElementById('keyboard');
    gameModal = document.getElementById('game-modal');
    statsModal = document.getElementById('stats-modal');
    settingsModal = document.getElementById('settings-modal');
    themeToggle = document.getElementById('theme-toggle');
    
    initializeBoard();
    initializeKeyboard();
    loadStats();
    loadSettings();
    loadTheme();
    startNewGame();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyPress);
    keyboardElement.addEventListener('click', handleKeyboardClick);
    document.getElementById('play-again-btn').addEventListener('click', startNewGame);
    document.getElementById('stats-btn').addEventListener('click', showStats);
    document.getElementById('settings-btn').addEventListener('click', showSettings);
    document.getElementById('close-modal').addEventListener('click', hideGameModal);
    document.getElementById('close-stats').addEventListener('click', hideStatsModal);
    document.getElementById('close-settings').addEventListener('click', hideSettingsModal);
    themeToggle.addEventListener('click', toggleTheme);
    
    // Settings event listeners
    initializeSettingsListeners();
    
    // Close modals when clicking outside
    gameModal.addEventListener('click', function(e) {
        if (e.target === gameModal) hideGameModal();
    });
    
    statsModal.addEventListener('click', function(e) {
        if (e.target === statsModal) hideStatsModal();
    });
    
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) hideSettingsModal();
    });
});

// Initialize the game board
function initializeBoard() {
    boardElement.innerHTML = '';
    gameBoard = [];
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        
        const rowArray = [];
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${i}-${j}`;
            row.appendChild(tile);
            rowArray.push({
                element: tile,
                letter: '',
                state: ''
            });
        }
        
        boardElement.appendChild(row);
        gameBoard.push(rowArray);
    }
}

// Initialize keyboard
function initializeKeyboard() {
    const keys = keyboardElement.querySelectorAll('button[data-key]');
    keys.forEach(key => {
        const letter = key.getAttribute('data-key');
        keyboardState[letter] = '';
    });
}

// Start a new game
function startNewGame() {
    currentWord = getRandomWord();
    console.log('Answer:', currentWord); // For debugging - remove in production
    currentRow = 0;
    currentCol = 0;
    gameOver = false;
    gameWon = false;
    guesses = [];
    
    // Reset board
    gameBoard.forEach(row => {
        row.forEach(tile => {
            tile.element.textContent = '';
            tile.element.className = 'tile';
            tile.letter = '';
            tile.state = '';
        });
    });
    
    // Reset keyboard
    const keys = keyboardElement.querySelectorAll('button[data-key]');
    keys.forEach(key => {
        const letter = key.getAttribute('data-key');
        key.className = key.className.replace(/\b(correct|present|absent)\b/g, '');
        keyboardState[letter] = '';
    });
    
    hideGameModal();
    hideStatsModal();
}

// Handle keyboard input
function handleKeyPress(event) {
    if (gameOver) return;
    
    const key = event.key.toUpperCase();
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (key.match(/[A-Z]/) && key.length === 1) {
        addLetter(key);
    }
}

// Handle on-screen keyboard clicks
function handleKeyboardClick(event) {
    if (gameOver) return;
    
    const key = event.target.getAttribute('data-key');
    if (!key) return;
    
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else {
        addLetter(key);
    }
}

// Add letter to current position
function addLetter(letter) {
    if (currentCol < 5 && currentRow < 6) {
        const tile = gameBoard[currentRow][currentCol];
        tile.letter = letter;
        tile.element.textContent = letter;
        tile.element.classList.add('filled');
        
        // Add scale animation
        tile.element.style.animation = 'none';
        tile.element.offsetHeight; // Trigger reflow
        tile.element.style.animation = 'scale 0.1s ease-in-out';
        
        currentCol++;
    }
}

// Delete letter from current position
function deleteLetter() {
    if (currentCol > 0) {
        currentCol--;
        const tile = gameBoard[currentRow][currentCol];
        tile.letter = '';
        tile.element.textContent = '';
        tile.element.classList.remove('filled');
    }
}

// Submit current guess
function submitGuess() {
    if (currentCol !== 5) {
        showToast('Not enough letters');
        shakeRow(currentRow);
        return;
    }
    
    const guess = gameBoard[currentRow].map(tile => tile.letter).join('');
    
    if (!isValidWord(guess)) {
        showToast('Not in word list');
        shakeRow(currentRow);
        return;
    }
    
    if (!validateHardMode(guess)) {
        shakeRow(currentRow);
        return;
    }
    
    guesses.push(guess);
    checkGuess(guess);
    
    if (guess === currentWord) {
        gameWon = true;
        gameOver = true;
        celebrateWin();
        updateStats(true, currentRow + 1);
        setTimeout(() => showGameModal(true), 2000);
    } else if (currentRow === 5) {
        gameOver = true;
        updateStats(false);
        setTimeout(() => showGameModal(false), 1500);
    } else {
        currentRow++;
        currentCol = 0;
    }
}

// Check guess against answer
function checkGuess(guess) {
    const answerArray = currentWord.split('');
    const guessArray = guess.split('');
    const result = ['', '', '', '', ''];
    
    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
        if (guessArray[i] === answerArray[i]) {
            result[i] = 'correct';
            answerArray[i] = null; // Mark as used
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
        if (result[i] === '') {
            const letterIndex = answerArray.indexOf(guessArray[i]);
            if (letterIndex !== -1) {
                result[i] = 'present';
                answerArray[letterIndex] = null; // Mark as used
            } else {
                result[i] = 'absent';
            }
        }
    }
    
    // Apply results with animation
    for (let i = 0; i < 5; i++) {
        const tile = gameBoard[currentRow][i];
        const keyboardKey = keyboardElement.querySelector(`[data-key="${guessArray[i]}"]`);
        
        setTimeout(() => {
            tile.state = result[i];
            tile.element.classList.add('revealed', result[i]);
            
            // Update keyboard state
            updateKeyboardKey(guessArray[i], result[i]);
        }, i * 100);
    }
}

// Update keyboard key color
function updateKeyboardKey(letter, state) {
    const key = keyboardElement.querySelector(`[data-key="${letter}"]`);
    if (!key) return;
    
    const currentState = keyboardState[letter];
    
    // Priority: correct > present > absent
    if (state === 'correct' || 
        (state === 'present' && currentState !== 'correct') ||
        (state === 'absent' && currentState !== 'correct' && currentState !== 'present')) {
        
        key.classList.remove('correct', 'present', 'absent');
        key.classList.add(state);
        keyboardState[letter] = state;
    }
}

// Shake animation for invalid guess
function shakeRow(row) {
    gameBoard[row].forEach(tile => {
        tile.element.classList.add('shake');
        setTimeout(() => {
            tile.element.classList.remove('shake');
        }, 500);
    });
}

// Celebrate win with bounce animation
function celebrateWin() {
    gameBoard[currentRow].forEach((tile, index) => {
        setTimeout(() => {
            tile.element.classList.add('win');
        }, index * 100);
    });
}

// Show toast message
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 2000);
}

// Show game end modal
function showGameModal(won) {
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    const word = document.getElementById('modal-word');
    
    if (won) {
        const messages = [
            'Genius!',
            'Magnificent!',
            'Impressive!',
            'Splendid!',
            'Great!',
            'Phew!'
        ];
        title.textContent = messages[currentRow] || 'Amazing!';
        message.textContent = `You solved it in ${currentRow + 1} guess${currentRow === 0 ? '' : 'es'}!`;
    } else {
        title.textContent = 'Game Over';
        message.textContent = 'Better luck next time!';
    }
    
    word.textContent = currentWord;
    gameModal.classList.remove('hidden');
}

// Hide game modal
function hideGameModal() {
    gameModal.classList.add('hidden');
}

// Show statistics modal
function showStats() {
    updateStatsDisplay();
    statsModal.classList.remove('hidden');
}

// Hide statistics modal
function hideStatsModal() {
    statsModal.classList.add('hidden');
}

// Update statistics
function updateStats(won, guessCount = 0) {
    stats.gamesPlayed++;
    
    if (won) {
        stats.gamesWon++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.guessDistribution[guessCount - 1]++;
    } else {
        stats.currentStreak = 0;
    }
    
    saveStats();
}

// Update statistics display
function updateStatsDisplay() {
    document.getElementById('games-played').textContent = stats.gamesPlayed;
    document.getElementById('win-percentage').textContent = 
        stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    document.getElementById('current-streak').textContent = stats.currentStreak;
    document.getElementById('max-streak').textContent = stats.maxStreak;
    
    // Update guess distribution
    const distributionElement = document.getElementById('distribution');
    distributionElement.innerHTML = '';
    
    const maxGuesses = Math.max(...stats.guessDistribution, 1);
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'distribution-row';
        
        const label = document.createElement('div');
        label.className = 'distribution-label';
        label.textContent = i + 1;
        
        const bar = document.createElement('div');
        bar.className = 'distribution-bar';
        bar.textContent = stats.guessDistribution[i];
        
        const percentage = maxGuesses > 0 ? (stats.guessDistribution[i] / maxGuesses) * 100 : 0;
        bar.style.width = `${Math.max(percentage, 7)}%`;
        
        // Highlight current game's guess count
        if (gameWon && currentRow === i) {
            bar.classList.add('highlight');
        }
        
        row.appendChild(label);
        row.appendChild(bar);
        distributionElement.appendChild(row);
    }
}

// Save statistics to localStorage
function saveStats() {
    localStorage.setItem('wordleStats', JSON.stringify(stats));
}

// Load statistics from localStorage
function loadStats() {
    const saved = localStorage.getItem('wordleStats');
    if (saved) {
        stats = { ...stats, ...JSON.parse(saved) };
    }
}

// Utility function to get current date string (for daily word feature)
function getTodayDateString() {
    const today = new Date();
    return today.getFullYear() + '-' + 
           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getDate()).padStart(2, '0');
}

// Optional: Implement daily word feature
function getDailyWord() {
    const dateString = getTodayDateString();
    const seed = dateString.split('-').join('');
    const index = parseInt(seed) % ANSWER_WORDS.length;
    return ANSWER_WORDS[index];
}

// Optional: Use daily word instead of random
// Uncomment the following line and comment out the random word in startNewGame()
// currentWord = getDailyWord();

// Theme management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    updateThemeIcon(newTheme);
    saveTheme(newTheme);
}

function updateThemeIcon(theme) {
    const icon = theme === 'light' ? '🌙' : '☀️';
    themeToggle.textContent = icon;
    themeToggle.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
}

function saveTheme(theme) {
    localStorage.setItem('wordleTheme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('wordleTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// System theme detection (optional)
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('wordleTheme')) {
            const newTheme = e.matches ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);
        }
    });
}

// Settings Management
function initializeSettingsListeners() {
    // Hard mode toggle
    document.getElementById('hard-mode').addEventListener('change', function(e) {
        if (currentRow > 0 && e.target.checked) {
            showToast('Hard mode can only be enabled at the start');
            e.target.checked = false;
            return;
        }
        settings.hardMode = e.target.checked;
        saveSettings();
    });
    
    // Dark theme toggle (sync with theme toggle button)
    document.getElementById('dark-theme-setting').addEventListener('change', function(e) {
        const newTheme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeIcon(newTheme);
        saveTheme(newTheme);
        settings.darkTheme = e.target.checked;
        saveSettings();
    });
    
    // High contrast mode
    document.getElementById('high-contrast').addEventListener('change', function(e) {
        settings.highContrast = e.target.checked;
        document.documentElement.setAttribute('data-contrast', e.target.checked ? 'high' : 'normal');
        saveSettings();
    });
    
    // Reduce motion
    document.getElementById('reduce-motion').addEventListener('change', function(e) {
        settings.reduceMotion = e.target.checked;
        document.documentElement.setAttribute('data-motion', e.target.checked ? 'reduced' : 'normal');
        saveSettings();
    });
    
    // Sound effects
    document.getElementById('sound-effects').addEventListener('change', function(e) {
        settings.soundEffects = e.target.checked;
        saveSettings();
    });
    
    // Reset statistics
    document.getElementById('reset-stats').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
            stats = {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: [0, 0, 0, 0, 0, 0]
            };
            saveStats();
            updateStatsDisplay();
            showToast('Statistics reset successfully');
        }
    });
    
    // Reset settings
    document.getElementById('reset-settings').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            settings = {
                hardMode: false,
                darkTheme: true,
                highContrast: false,
                reduceMotion: false,
                soundEffects: true
            };
            saveSettings();
            applySettings();
            updateSettingsDisplay();
            showToast('Settings reset to defaults');
        }
    });
}

function showSettings() {
    updateSettingsDisplay();
    settingsModal.classList.remove('hidden');
}

function hideSettingsModal() {
    settingsModal.classList.add('hidden');
}

function updateSettingsDisplay() {
    document.getElementById('hard-mode').checked = settings.hardMode;
    document.getElementById('dark-theme-setting').checked = settings.darkTheme;
    document.getElementById('high-contrast').checked = settings.highContrast;
    document.getElementById('reduce-motion').checked = settings.reduceMotion;
    document.getElementById('sound-effects').checked = settings.soundEffects;
}

function applySettings() {
    // Apply theme
    const theme = settings.darkTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
    
    // Apply high contrast
    document.documentElement.setAttribute('data-contrast', settings.highContrast ? 'high' : 'normal');
    
    // Apply motion preferences
    document.documentElement.setAttribute('data-motion', settings.reduceMotion ? 'reduced' : 'normal');
}

function loadSettings() {
    const savedSettings = localStorage.getItem('wordleSettings');
    if (savedSettings) {
        settings = { ...settings, ...JSON.parse(savedSettings) };
    }
    applySettings();
}

function saveSettings() {
    localStorage.setItem('wordleSettings', JSON.stringify(settings));
}

// Enhanced hard mode validation
function validateHardMode(guess) {
    if (!settings.hardMode || currentRow === 0) return true;
    
    // Get all revealed hints from previous guesses
    const revealedHints = [];
    for (let row = 0; row < currentRow; row++) {
        for (let col = 0; col < 5; col++) {
            const tile = gameBoard[row][col];
            if (tile.state === 'correct') {
                revealedHints.push({ position: col, letter: tile.letter, type: 'correct' });
            } else if (tile.state === 'present') {
                revealedHints.push({ position: col, letter: tile.letter, type: 'present' });
            }
        }
    }
    
    // Check if guess uses all revealed hints
    for (const hint of revealedHints) {
        if (hint.type === 'correct') {
            if (guess[hint.position] !== hint.letter) {
                showToast(`${hint.position + 1}${getOrdinalSuffix(hint.position + 1)} letter must be ${hint.letter}`);
                return false;
            }
        } else if (hint.type === 'present') {
            if (!guess.includes(hint.letter)) {
                showToast(`Guess must contain ${hint.letter}`);
                return false;
            }
        }
    }
    
    return true;
}

function getOrdinalSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
}
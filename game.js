// Game state object
const gameState = {
    metal: 0,
    facilities: 1,
    ships: 0,
    research: {
        production: 0,
        exploration: 0,
        automation: 0
    },
    day: 1,
    lastUpdate: Date.now()
};

// Game constants and costs
const costs = {
    facility: 100,
    ship: 50,
    research: {
        production: 200,
        exploration: 300,
        automation: 500
    }
};

// Production rates
const baseProductionRate = 1.0; // metal per second per facility

// Calculate current metal production rate
function getProductionRate() {
    const baseRate = gameState.facilities * baseProductionRate;
    const productionBonus = 1 + (gameState.research.production * 0.25); // +25% per level
    const automationBonus = 1 + (gameState.research.automation * 0.15); // +15% per level
    return baseRate * productionBonus * automationBonus;
}

// Calculate costs with scaling
function getFacilityCost() {
    return Math.floor(costs.facility * Math.pow(1.5, gameState.facilities - 1));
}

function getShipCost() {
    return Math.floor(costs.ship * Math.pow(1.4, gameState.ships));
}

function getResearchCost(type) {
    const baseCost = costs.research[type];
    const level = gameState.research[type];
    return Math.floor(baseCost * Math.pow(2, level));
}

// Update UI
function updateUI() {
    // Resources
    document.getElementById('metal-count').textContent = Math.floor(gameState.metal).toLocaleString();
    document.getElementById('metal-rate').textContent = getProductionRate().toFixed(1);
    
    // Facilities
    document.getElementById('facility-count').textContent = gameState.facilities;
    const facilityCost = getFacilityCost();
    document.getElementById('facility-cost').textContent = facilityCost.toLocaleString();
    document.getElementById('build-facility').disabled = gameState.metal < facilityCost;
    
    // Ships
    document.getElementById('ship-count').textContent = gameState.ships;
    const shipCost = getShipCost();
    document.getElementById('ship-cost').textContent = shipCost.toLocaleString();
    document.getElementById('build-ship').disabled = gameState.metal < shipCost;
    
    // Research
    updateResearchUI('production', 'Production Efficiency');
    updateResearchUI('exploration', 'Exploration Range');
    updateResearchUI('automation', 'Automated Systems');
    
    // Footer
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString();
}

function updateResearchUI(type, name) {
    const cost = getResearchCost(type);
    const level = gameState.research[type];
    document.getElementById(`${type}-research-cost`).textContent = cost.toLocaleString();
    document.getElementById(`${type}-level`).textContent = level;
    document.getElementById(`research-${type}`).disabled = gameState.metal < cost;
}

// Add log entry
function addLogEntry(message) {
    const logContent = document.getElementById('game-log');
    const entry = document.createElement('p');
    entry.className = 'log-entry';
    entry.textContent = `[Day ${gameState.day}] ${message}`;
    logContent.insertBefore(entry, logContent.firstChild);
    
    // Keep only last 20 entries
    while (logContent.children.length > 20) {
        logContent.removeChild(logContent.lastChild);
    }
}

// Build facility
function buildFacility() {
    const cost = getFacilityCost();
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.facilities++;
        addLogEntry(`New mining facility constructed. Total facilities: ${gameState.facilities}`);
        updateUI();
    }
}

// Build ship
function buildShip() {
    const cost = getShipCost();
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.ships++;
        addLogEntry(`Explorer ship launched. Fleet size: ${gameState.ships}`);
        
        // Ships have a chance to discover things
        if (Math.random() < 0.3) {
            const discoveries = [
                'Ship discovered a dense asteroid cluster rich in minerals!',
                'Exploration team found ancient debris from an unknown civilization.',
                'Scanners detected unusual energy signatures in the ring system.',
                'Ship mapped a new sector of Saturn\'s rings.',
                'Explorer discovered a pocket of rare ice crystals.'
            ];
            const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
            setTimeout(() => addLogEntry(discovery), 2000);
        }
        
        updateUI();
    }
}

// Research upgrade
function conductResearch(type, name) {
    const cost = getResearchCost(type);
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.research[type]++;
        addLogEntry(`${name} research completed. Level ${gameState.research[type]} achieved.`);
        updateUI();
    }
}

// Game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastUpdate) / 1000; // Convert to seconds
    gameState.lastUpdate = now;
    
    // Produce metal
    gameState.metal += getProductionRate() * deltaTime;
    
    // Update day counter (every 60 seconds = 1 day)
    const newDay = Math.floor(Date.now() / 60000) + 1;
    if (newDay > gameState.day) {
        gameState.day = newDay;
        // Random events
        if (Math.random() < 0.2 && gameState.ships > 0) {
            const events = [
                'Exploration teams report increased mineral deposits in sector 7.',
                'Minor solar storm passed through. All systems stable.',
                'Long-range sensors detected movement in distant sectors.',
                'Automated systems running at peak efficiency.',
                'Fleet coordination protocols optimized.'
            ];
            const event = events[Math.floor(Math.random() * events.length)];
            addLogEntry(event);
        }
    }
    
    updateUI();
}

// Save game
function saveGame() {
    try {
        localStorage.setItem('saturnMiningGame', JSON.stringify(gameState));
        addLogEntry('Game progress saved to local systems.');
        alert('Game saved successfully!');
    } catch (e) {
        alert('Failed to save game: ' + e.message);
    }
}

// Load game
function loadGame() {
    try {
        const saved = localStorage.getItem('saturnMiningGame');
        if (saved) {
            const loadedState = JSON.parse(saved);
            Object.assign(gameState, loadedState);
            gameState.lastUpdate = Date.now();
            addLogEntry('Previous game state restored from backup systems.');
            updateUI();
            alert('Game loaded successfully!');
        } else {
            alert('No saved game found.');
        }
    } catch (e) {
        alert('Failed to load game: ' + e.message);
    }
}

// Reset game
function resetGame() {
    if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        gameState.metal = 0;
        gameState.facilities = 1;
        gameState.ships = 0;
        gameState.research.production = 0;
        gameState.research.exploration = 0;
        gameState.research.automation = 0;
        gameState.day = 1;
        gameState.lastUpdate = Date.now();
        
        // Clear log
        const logContent = document.getElementById('game-log');
        logContent.innerHTML = `
            <p class="log-entry">[Day 1] Systems initialized. Communications lost with Earth Command.</p>
            <p class="log-entry">[Day 1] All mining systems operational. Metal alloy production nominal.</p>
            <p class="log-entry">[Day 1] Awaiting further instructions... none received.</p>
            <p class="log-entry">[Day 1] Beginning autonomous operations.</p>
        `;
        
        localStorage.removeItem('saturnMiningGame');
        updateUI();
        addLogEntry('All systems reset to initial state.');
    }
}

// Event listeners
document.getElementById('build-facility').addEventListener('click', buildFacility);
document.getElementById('build-ship').addEventListener('click', buildShip);
document.getElementById('research-production').addEventListener('click', () => 
    conductResearch('production', 'Production Efficiency'));
document.getElementById('research-exploration').addEventListener('click', () => 
    conductResearch('exploration', 'Exploration Range'));
document.getElementById('research-automation').addEventListener('click', () => 
    conductResearch('automation', 'Automated Systems'));
document.getElementById('save-game').addEventListener('click', saveGame);
document.getElementById('load-game').addEventListener('click', loadGame);
document.getElementById('reset-game').addEventListener('click', resetGame);

// Auto-save every 30 seconds
setInterval(() => {
    saveGame();
}, 30000);

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Try to load saved game
    const saved = localStorage.getItem('saturnMiningGame');
    if (saved) {
        try {
            const loadedState = JSON.parse(saved);
            Object.assign(gameState, loadedState);
            addLogEntry('Resuming from previous session...');
        } catch (e) {
            console.error('Failed to load saved game:', e);
        }
    }
    
    gameState.lastUpdate = Date.now();
    updateUI();
    
    // Start game loop (update every 100ms)
    setInterval(gameLoop, 100);
});

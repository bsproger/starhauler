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
    gameStartTime: Date.now(),
    lastUpdate: Date.now(),
    activeRewards: {
        explorationBonus: 0, // Bonus to exploration effectiveness
        productionBonus: 0, // Bonus to production rate
        temporaryMetalBonus: 0 // One-time metal bonuses
    },
    eventCooldown: 0 // Days until next event can trigger
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
    const rewardBonus = 1 + (gameState.activeRewards.productionBonus || 0); // Reward bonus from events
    return baseRate * productionBonus * automationBonus * rewardBonus;
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
    
    // Active rewards display
    updateActiveRewardsUI();
    
    // Footer
    const now = new Date();
    document.getElementById('last-update').textContent = now.toLocaleTimeString();
}

function updateActiveRewardsUI() {
    const rewardsElement = document.getElementById('active-rewards');
    if (!rewardsElement) return;
    
    const rewards = [];
    
    if (gameState.activeRewards.explorationBonus > 0) {
        rewards.push(`⭐ Exploration: +${(gameState.activeRewards.explorationBonus * 100).toFixed(0)}%`);
    } else if (gameState.activeRewards.explorationBonus < 0) {
        rewards.push(`⚠️ Exploration: ${(gameState.activeRewards.explorationBonus * 100).toFixed(0)}%`);
    }
    
    if (gameState.activeRewards.productionBonus > 0) {
        rewards.push(`⭐ Production: +${(gameState.activeRewards.productionBonus * 100).toFixed(0)}%`);
    } else if (gameState.activeRewards.productionBonus < 0) {
        rewards.push(`⚠️ Production: ${(gameState.activeRewards.productionBonus * 100).toFixed(0)}%`);
    }
    
    if (gameState.eventCooldown > 0) {
        rewards.push(`⏳ Next event in ${gameState.eventCooldown} day${gameState.eventCooldown > 1 ? 's' : ''}`);
    }
    
    if (rewards.length > 0) {
        rewardsElement.innerHTML = '<strong>Active Effects:</strong> ' + rewards.join(' | ');
        rewardsElement.style.display = 'block';
    } else {
        rewardsElement.style.display = 'none';
    }
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

// Exploration events system
const explorationEvents = {
    positive: [
        {
            name: 'Abandoned Research Station',
            message: '🎉 Explorer discovered an abandoned research station with intact starship blueprints! Exploration efficiency increased by 20%.',
            effect: () => {
                gameState.activeRewards.explorationBonus += 0.20;
            }
        },
        {
            name: 'Lost Signal Discovery',
            message: '🎉 A lost signal led to a cache of pre-processed metal alloys! Gained ',
            effect: () => {
                const bonus = Math.floor(gameState.ships * 50 * (1 + gameState.research.exploration * 0.1));
                gameState.metal += bonus;
                gameState.activeRewards.temporaryMetalBonus += bonus;
                return `${bonus.toLocaleString()} metal alloys!`;
            }
        },
        {
            name: 'Ancient Mining Facility',
            message: '🎉 Explorer teams found an ancient automated mining facility! Production rate increased by 15% permanently.',
            effect: () => {
                gameState.activeRewards.productionBonus += 0.15;
            }
        },
        {
            name: 'Technological Artifact',
            message: '🎉 Scans revealed a technological artifact that enhances all ship systems! All ships are now 10% more effective.',
            effect: () => {
                gameState.activeRewards.explorationBonus += 0.10;
            }
        },
        {
            name: 'Resource-Rich Asteroid',
            message: '🎉 Fleet located a resource-rich asteroid field! Immediate metal gain of ',
            effect: () => {
                const bonus = Math.floor(gameState.facilities * 200 * (1 + gameState.research.production * 0.1));
                gameState.metal += bonus;
                gameState.activeRewards.temporaryMetalBonus += bonus;
                return `${bonus.toLocaleString()} metal alloys!`;
            }
        },
        {
            name: 'Efficient Route Discovery',
            message: '🎉 New efficient mining routes discovered! Production efficiency increased by 10%.',
            effect: () => {
                gameState.activeRewards.productionBonus += 0.10;
            }
        },
        {
            name: 'Rare Crystal Formation',
            message: '🎉 Explorers discovered rare crystal formations with valuable properties! Technology advancement bonus applied.',
            effect: () => {
                const bonus = Math.floor(getResearchCost('exploration') * 0.3);
                gameState.metal += bonus;
                return ` Gained ${bonus.toLocaleString()} metal towards next research!`;
            }
        }
    ],
    negative: [
        {
            name: 'Solar Storm',
            message: '⚠️ Intense solar storm damaged exploration equipment! Lost ',
            effect: () => {
                const loss = Math.floor(gameState.metal * 0.05);
                gameState.metal = Math.max(0, gameState.metal - loss);
                return `${loss.toLocaleString()} metal alloys to repairs.`;
            }
        },
        {
            name: 'Equipment Malfunction',
            message: '⚠️ Critical equipment malfunction in mining facility! Production reduced by 10% temporarily until repairs.',
            effect: () => {
                // Temporary penalty that will be "repaired" after a few days
                gameState.activeRewards.productionBonus = Math.max(-0.10, (gameState.activeRewards.productionBonus || 0) - 0.10);
                // Schedule repair
                setTimeout(() => {
                    gameState.activeRewards.productionBonus = Math.min(1.0, (gameState.activeRewards.productionBonus || 0) + 0.10);
                    addLogEntry('Repairs completed. Production systems back to normal.');
                    updateUI();
                }, 120000); // 2 minutes (2 days in game time)
            }
        },
        {
            name: 'Navigation Error',
            message: '⚠️ Navigation system error caused fleet to search unproductive sectors. Resources wasted: ',
            effect: () => {
                const loss = Math.floor(gameState.ships * 20);
                gameState.metal = Math.max(0, gameState.metal - loss);
                return `${loss.toLocaleString()} metal alloys.`;
            }
        },
        {
            name: 'Asteroid Collision',
            message: '⚠️ Minor asteroid collision damaged ship sensors. Exploration efficiency reduced by 5% until repairs.',
            effect: () => {
                gameState.activeRewards.explorationBonus = Math.max(-0.15, (gameState.activeRewards.explorationBonus || 0) - 0.05);
                // Schedule repair
                setTimeout(() => {
                    gameState.activeRewards.explorationBonus = Math.min(1.0, (gameState.activeRewards.explorationBonus || 0) + 0.05);
                    addLogEntry('Ship repairs completed. Sensors back online.');
                    updateUI();
                }, 90000); // 1.5 minutes
            }
        },
        {
            name: 'Communication Interference',
            message: '⚠️ Electromagnetic interference disrupted fleet coordination. Minor efficiency loss.',
            effect: () => {
                const loss = Math.floor(getProductionRate() * 30); // 30 seconds of production
                gameState.metal = Math.max(0, gameState.metal - loss);
                return ` Lost ${loss.toLocaleString()} metal alloys.`;
            }
        }
    ]
};

// Trigger exploration event
function triggerExplorationEvent() {
    // Only trigger if we have ships and cooldown has expired
    if (gameState.ships === 0 || gameState.eventCooldown > 0) {
        return;
    }

    // Calculate event probability based on exploration research and ship count
    const baseChance = 0.25; // 25% base chance per day
    const researchBonus = gameState.research.exploration * 0.05; // +5% per exploration level
    const shipBonus = Math.min(gameState.ships * 0.02, 0.20); // +2% per ship, max +20%
    const eventChance = baseChance + researchBonus + shipBonus;

    if (Math.random() < eventChance) {
        // Determine if positive or negative (70% positive, 30% negative with higher exploration)
        const positiveChance = 0.70 + (gameState.research.exploration * 0.03); // Better research = more positive events
        const isPositive = Math.random() < positiveChance;

        const eventList = isPositive ? explorationEvents.positive : explorationEvents.negative;
        const event = eventList[Math.floor(Math.random() * eventList.length)];

        // Apply event effect
        let fullMessage = event.message;
        if (event.effect) {
            const effectResult = event.effect();
            if (effectResult) {
                fullMessage += effectResult;
            }
        }

        addLogEntry(fullMessage);
        
        // Set cooldown (1-3 days)
        gameState.eventCooldown = Math.floor(Math.random() * 3) + 1;
        
        updateUI();
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
    const elapsedTime = Date.now() - gameState.gameStartTime;
    const newDay = Math.floor(elapsedTime / 60000) + 1;
    if (newDay > gameState.day) {
        gameState.day = newDay;
        
        // Decrease event cooldown
        if (gameState.eventCooldown > 0) {
            gameState.eventCooldown--;
        }
        
        // Trigger exploration events
        triggerExplorationEvent();
        
        // Random events (less frequent now that we have exploration events)
        if (Math.random() < 0.1 && gameState.ships > 0) {
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

// Save game silently (for auto-save)
function saveGameSilent() {
    try {
        localStorage.setItem('saturnMiningGame', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to auto-save:', e);
    }
}

// Save game (with user feedback)
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
        gameState.gameStartTime = Date.now();
        gameState.lastUpdate = Date.now();
        gameState.activeRewards = {
            explorationBonus: 0,
            productionBonus: 0,
            temporaryMetalBonus: 0
        };
        gameState.eventCooldown = 0;
        
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
    saveGameSilent();
}, 30000);

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Try to load saved game
    const saved = localStorage.getItem('saturnMiningGame');
    if (saved) {
        try {
            const loadedState = JSON.parse(saved);
            Object.assign(gameState, loadedState);
            // Ensure gameStartTime exists for old saves
            if (!gameState.gameStartTime) {
                gameState.gameStartTime = Date.now();
            }
            // Ensure activeRewards exists for old saves
            if (!gameState.activeRewards) {
                gameState.activeRewards = {
                    explorationBonus: 0,
                    productionBonus: 0,
                    temporaryMetalBonus: 0
                };
            }
            // Ensure eventCooldown exists for old saves
            if (gameState.eventCooldown === undefined) {
                gameState.eventCooldown = 0;
            }
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

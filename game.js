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
    eventCooldown: 0, // Days until next event can trigger
    pendingRepairs: [], // Track scheduled repairs: [{type: 'production'|'exploration', amount: number, completionDay: number}]
    // Personnel system
    personnel: {
        researchers: 0,
        engineers: 0,
        workers: 0,
        cartographers: 0
    },
    // Remote mining facilities system
    unstableElements: 0, // New resource from remote facilities
    remoteFacilities: 0, // Number of established remote facilities
    discoveryProgress: 0, // Progress towards discovering next facility location
    // Blueprint system
    blueprints: [], // Array of blueprint objects
    // Items system
    items: [], // Array of produced items
    itemIdCounter: 0, // Counter for generating unique item IDs
    // Monolith event system
    monolith: {
        discovered: false, // Whether the monolith has been found
        translating: false, // Whether translation is in progress
        translated: false, // Whether translation is complete
        translationProgress: 0, // Progress towards translation (0-100)
        researchersAssigned: 0 // Number of researchers working on translation
    }
};

// Game constants and costs
const costs = {
    facility: 100,
    ship: 50,
    research: {
        production: 200,
        exploration: 300,
        automation: 500
    },
    personnel: {
        researcher: { hire: 150, upkeep: 10 },
        engineer: { hire: 200, upkeep: 15 },
        worker: { hire: 100, upkeep: 8 },
        cartographer: { hire: 250, upkeep: 12 }
    },
    remoteFacility: 500 // Cost to establish a remote facility
};

// Blueprint definitions
const blueprintDefinitions = [
    {
        id: 'advanced_mining_array',
        name: 'Advanced Mining Array',
        type: 'Building Upgrade',
        description: '+25% production per facility',
        researchCost: 300,
        researchTime: 3, // days
        designCost: 400,
        designTime: 2, // days
        productionCost: 250,
        productionTime: 1, // days
        bonus: { type: 'production', value: 0.25 }
    },
    {
        id: 'quantum_sensors',
        name: 'Quantum Sensors',
        type: 'Ship System',
        description: '+30% exploration effectiveness',
        researchCost: 500,
        researchTime: 4,
        designCost: 600,
        designTime: 3,
        productionCost: 400,
        productionTime: 2,
        bonus: { type: 'exploration', value: 0.30 }
    },
    {
        id: 'auto_refinery',
        name: 'Auto-Refinery',
        type: 'Facility Equipment',
        description: '+20% production per facility',
        researchCost: 400,
        researchTime: 3,
        designCost: 500,
        designTime: 2,
        productionCost: 300,
        productionTime: 1,
        bonus: { type: 'facilityProduction', value: 0.20 }
    }
];

// Event system constants
const eventConfig = {
    baseTriggerChance: 0.25,          // 25% base chance per day
    researchTriggerBonus: 0.05,       // +5% per exploration research level
    shipTriggerBonus: 0.02,            // +2% per ship
    maxShipTriggerBonus: 0.20,         // Max +20% from ships
    basePositiveChance: 0.70,          // 70% base chance for positive events
    researchPositiveBonus: 0.03,       // +3% positive chance per exploration level
    minCooldownDays: 1,                // Minimum cooldown between events
    maxCooldownDays: 3                 // Maximum cooldown between events
};

// Production rates
const baseProductionRate = 1.0; // metal per second per facility

// Calculate current metal production rate
function getProductionRate() {
    const baseRate = gameState.facilities * baseProductionRate;
    const productionBonus = 1 + (gameState.research.production * 0.25); // +25% per level
    const automationBonus = 1 + (gameState.research.automation * 0.15); // +15% per level
    const rewardBonus = 1 + (gameState.activeRewards.productionBonus || 0); // Reward bonus from events
    const itemBonus = getItemProductionBonus(); // Bonus from assigned items
    return baseRate * productionBonus * automationBonus * rewardBonus * itemBonus;
}

// Calculate production bonus from assigned items
function getItemProductionBonus() {
    let bonus = 1;
    gameState.items.forEach(item => {
        if (item.assigned && item.blueprint.bonus) {
            // Both production and facilityProduction types affect production rate
            if (item.blueprint.bonus.type === 'production' || 
                item.blueprint.bonus.type === 'facilityProduction') {
                bonus += item.blueprint.bonus.value;
            }
        }
    });
    return bonus;
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

// Personnel management functions

// Personnel type mapping for property access
const personnelTypeMap = {
    researcher: 'researchers',
    engineer: 'engineers',
    worker: 'workers',
    cartographer: 'cartographers'
};

function hirePersonnel(type) {
    const cost = costs.personnel[type].hire;
    const propertyName = personnelTypeMap[type];
    
    if (gameState.metal >= cost) {
        gameState.metal -= cost;
        gameState.personnel[propertyName]++;
        addLogEntry(`Hired 1 ${type}. Total: ${gameState.personnel[propertyName]}`);
        updateUI();
    }
}

function firePersonnel(type) {
    const propertyName = personnelTypeMap[type];
    
    if (gameState.personnel[propertyName] > 0) {
        gameState.personnel[propertyName]--;
        addLogEntry(`Released 1 ${type}. Total: ${gameState.personnel[propertyName]}`);
        updateUI();
    }
}

function getPersonnelUpkeep() {
    let total = 0;
    total += gameState.personnel.researchers * costs.personnel.researcher.upkeep;
    total += gameState.personnel.engineers * costs.personnel.engineer.upkeep;
    total += gameState.personnel.workers * costs.personnel.worker.upkeep;
    total += gameState.personnel.cartographers * costs.personnel.cartographer.upkeep;
    return total;
}

function deductPersonnelUpkeep() {
    const upkeep = getPersonnelUpkeep();
    if (upkeep > 0) {
        gameState.metal = Math.max(0, gameState.metal - upkeep);
        addLogEntry(`Personnel upkeep deducted: ${upkeep} metal alloys`);
    }
}

// Remote Mining Facility functions
function getDiscoveryChance() {
    // Base 5% chance per cartographer per day
    const baseChance = 0.05;
    return Math.min(0.95, gameState.personnel.cartographers * baseChance);
}

function attemptDiscovery() {
    if (gameState.personnel.cartographers === 0) return;
    
    const chance = getDiscoveryChance();
    if (Math.random() < chance) {
        addLogEntry(`🎉 Cartographers discovered a suitable location in Saturn's ring for a remote mining facility!`);
        gameState.discoveryProgress++;
        return true;
    }
    return false;
}

function establishRemoteFacility() {
    const cost = costs.remoteFacility;
    if (gameState.metal >= cost && gameState.discoveryProgress > 0) {
        gameState.metal -= cost;
        gameState.remoteFacilities++;
        gameState.discoveryProgress--;
        addLogEntry(`Remote mining facility established! Now operating ${gameState.remoteFacilities} remote facilities.`);
        updateUI();
        return true;
    }
    return false;
}

function getUnstableElementsRate() {
    // Each remote facility generates 0.5 unstable elements per second
    return gameState.remoteFacilities * 0.5;
}

// Monolith translation system functions
function startMonolithTranslation() {
    if (!gameState.monolith.discovered) {
        return;
    }
    
    if (gameState.monolith.translating) {
        addLogEntry('Translation is already in progress.');
        return;
    }
    
    if (gameState.monolith.translated) {
        addLogEntry('The monolith symbols have already been translated.');
        return;
    }
    
    if (gameState.personnel.researchers < 1) {
        addLogEntry('You need at least 1 researcher to begin translation work.');
        return;
    }
    
    gameState.monolith.translating = true;
    gameState.monolith.researchersAssigned = gameState.personnel.researchers;
    addLogEntry(`${gameState.personnel.researchers} researcher${gameState.personnel.researchers > 1 ? 's are' : ' is'} now working on translating the monolith symbols...`);
    updateUI();
}

function stopMonolithTranslation() {
    if (!gameState.monolith.translating) {
        return;
    }
    
    gameState.monolith.translating = false;
    gameState.monolith.researchersAssigned = 0;
    addLogEntry('Translation work paused. Researchers returned to normal duties.');
    updateUI();
}

function updateMonolithTranslation() {
    if (!gameState.monolith.translating || gameState.monolith.translated) {
        return;
    }
    
    // Each researcher contributes to progress per day
    // More researchers = faster translation
    const progressPerDay = gameState.monolith.researchersAssigned * 5; // 5% per researcher per day
    gameState.monolith.translationProgress = Math.min(100, gameState.monolith.translationProgress + progressPerDay);
    
    if (gameState.monolith.translationProgress >= 100) {
        gameState.monolith.translated = true;
        gameState.monolith.translating = false;
        revealMonolithBackstory();
    }
    
    updateUI();
}

function revealMonolithBackstory() {
    const backstory = `
🌟 TRANSLATION COMPLETE 🌟

After days of painstaking work, your researchers have finally deciphered the symbols on the monolith. The revelation is staggering:

The monolith is not a monument—it is a message, left by an ancient civilization known as the Architects. Billions of years ago, they seeded the galaxy with these markers, warning future spacefaring species of a great cosmic cycle.

The symbols tell of "The Convergence"—a predictable but catastrophic event when dark matter currents shift throughout the galaxy, disrupting all stable orbits and rendering most solar systems uninhabitable for millions of years.

But there is hope encoded in the final glyphs: The Architects left behind fragments of their technology scattered across moons and planets, technologies that could allow a species to transcend their physical form and survive The Convergence as pure energy beings.

Saturn's rings are not natural—they are the remnants of an ancient Architect facility, destroyed in a previous cycle. The unstable elements you've been mining are not random; they are the key to unlocking this transformation.

Your mission has changed forever. You are no longer just mining metal—you are racing against time to gather the knowledge and resources needed to ensure humanity's survival through The Convergence.

The countdown has begun...
    `.trim();
    
    addLogEntry(backstory);
    
    // Grant permanent bonuses as a reward for completing this storyline
    gameState.activeRewards.productionBonus += 0.50; // +50% production
    gameState.activeRewards.explorationBonus += 0.30; // +30% exploration
    
    addLogEntry('🎁 The knowledge from the monolith has revolutionized your operations! Production +50%, Exploration +30%');
}

// Blueprint management functions
function startBlueprintResearch(blueprintDefId) {
    const def = blueprintDefinitions.find(b => b.id === blueprintDefId);
    if (!def) return;
    
    // Check if already in progress or completed
    const existing = gameState.blueprints.find(b => b.id === blueprintDefId);
    if (existing) {
        addLogEntry(`Blueprint ${def.name} is already in progress or completed.`);
        return;
    }
    
    // Check requirements
    if (gameState.personnel.researchers < 1) {
        addLogEntry(`Need at least 1 researcher to start blueprint research.`);
        return;
    }
    
    if (gameState.metal < def.researchCost) {
        addLogEntry(`Not enough metal for ${def.name} research. Need ${def.researchCost}.`);
        return;
    }
    
    gameState.metal -= def.researchCost;
    
    const blueprint = {
        id: def.id,
        name: def.name,
        type: def.type,
        description: def.description,
        researchProgress: 0,
        researchTime: def.researchTime,
        designProgress: 0,
        designTime: def.designTime,
        designCost: def.designCost,
        productionCost: def.productionCost,
        productionTime: def.productionTime,
        bonus: def.bonus,
        phase: 'research', // research, design, complete
        startDay: gameState.day
    };
    
    gameState.blueprints.push(blueprint);
    addLogEntry(`Started research on ${def.name} blueprint.`);
    updateUI();
}

function startBlueprintDesign(blueprintId) {
    const blueprint = gameState.blueprints.find(b => b.id === blueprintId);
    if (!blueprint || blueprint.phase !== 'research') return;
    
    if (gameState.personnel.engineers < 1) {
        addLogEntry(`Need at least 1 engineer to start blueprint design.`);
        return;
    }
    
    if (gameState.metal < blueprint.designCost) {
        addLogEntry(`Not enough metal for ${blueprint.name} design. Need ${blueprint.designCost}.`);
        return;
    }
    
    gameState.metal -= blueprint.designCost;
    blueprint.phase = 'design';
    blueprint.startDay = gameState.day;
    addLogEntry(`Started design phase for ${blueprint.name} blueprint.`);
    updateUI();
}

function updateBlueprintProgress() {
    gameState.blueprints.forEach(blueprint => {
        if (blueprint.phase === 'research') {
            const daysElapsed = gameState.day - blueprint.startDay;
            blueprint.researchProgress = Math.min(100, (daysElapsed / blueprint.researchTime) * 100);
            
            if (blueprint.researchProgress >= 100) {
                blueprint.phase = 'research_complete';
                addLogEntry(`✓ Research complete for ${blueprint.name}! Ready for design phase.`);
            }
        } else if (blueprint.phase === 'design') {
            const daysElapsed = gameState.day - blueprint.startDay;
            blueprint.designProgress = Math.min(100, (daysElapsed / blueprint.designTime) * 100);
            
            if (blueprint.designProgress >= 100) {
                blueprint.phase = 'complete';
                addLogEntry(`✓ Blueprint complete: ${blueprint.name}! Ready for production.`);
            }
        }
    });
}

// Item production and management
function produceItem(blueprintId) {
    const blueprint = gameState.blueprints.find(b => b.id === blueprintId);
    if (!blueprint || blueprint.phase !== 'complete') return;
    
    if (gameState.personnel.workers < 1) {
        addLogEntry(`Need at least 1 worker to produce items.`);
        return;
    }
    
    if (gameState.metal < blueprint.productionCost) {
        addLogEntry(`Not enough metal to produce ${blueprint.name}. Need ${blueprint.productionCost}.`);
        return;
    }
    
    gameState.metal -= blueprint.productionCost;
    
    // Generate unique item ID using counter
    // Counter is incremented before use, so IDs start at 1
    // This ensures uniqueness even with rapid production
    gameState.itemIdCounter++;
    const item = {
        id: `${blueprintId}_${gameState.itemIdCounter}`,
        blueprint: blueprint,
        assigned: false,
        productionProgress: 0,
        productionStartDay: gameState.day
    };
    
    gameState.items.push(item);
    addLogEntry(`Started production of ${blueprint.name}.`);
    updateUI();
}

function updateItemProduction() {
    gameState.items.forEach(item => {
        if (item.productionProgress < 100) {
            const daysElapsed = gameState.day - item.productionStartDay;
            item.productionProgress = Math.min(100, (daysElapsed / item.blueprint.productionTime) * 100);
            
            if (item.productionProgress >= 100) {
                addLogEntry(`✓ Production complete: ${item.blueprint.name}! Ready for assignment.`);
            }
        }
    });
}

function assignItem(itemId) {
    const item = gameState.items.find(i => i.id === itemId);
    if (!item || item.productionProgress < 100) return;
    
    item.assigned = !item.assigned;
    
    if (item.assigned) {
        addLogEntry(`Assigned ${item.blueprint.name}. Bonus active!`);
    } else {
        addLogEntry(`Unassigned ${item.blueprint.name}. Bonus removed.`);
    }
    
    updateUI();
}

// Update UI
function updateUI() {
    // Resources
    document.getElementById('metal-count').textContent = Math.floor(gameState.metal).toLocaleString();
    document.getElementById('metal-rate').textContent = getProductionRate().toFixed(1);
    
    // Update unstable elements display
    const unstableDisplay = document.getElementById('unstable-elements-count');
    if (unstableDisplay) {
        unstableDisplay.textContent = Math.floor(gameState.unstableElements).toLocaleString();
    }
    const unstableRate = document.getElementById('unstable-elements-rate');
    if (unstableRate) {
        unstableRate.textContent = getUnstableElementsRate().toFixed(1);
    }
    
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
    
    // Remote facilities
    const remoteFacilityCount = document.getElementById('remote-facility-count');
    if (remoteFacilityCount) {
        remoteFacilityCount.textContent = gameState.remoteFacilities;
    }
    const discoveryCount = document.getElementById('discovery-count');
    if (discoveryCount) {
        discoveryCount.textContent = gameState.discoveryProgress;
    }
    const establishButton = document.getElementById('establish-remote-facility');
    if (establishButton) {
        establishButton.disabled = gameState.metal < costs.remoteFacility || gameState.discoveryProgress === 0;
    }
    const facilityCostDisplay = document.getElementById('remote-facility-cost');
    if (facilityCostDisplay) {
        facilityCostDisplay.textContent = costs.remoteFacility.toLocaleString();
    }
    
    // Research
    updateResearchUI('production', 'Production Efficiency');
    updateResearchUI('exploration', 'Exploration Range');
    updateResearchUI('automation', 'Automated Systems');
    
    // Personnel
    updatePersonnelUI();
    
    // Blueprints
    updateBlueprintsUI();
    
    // Items
    updateItemsUI();
    
    // Monolith
    updateMonolithUI();
    
    // Active rewards display
    updateActiveRewardsUI();
    
    // Show/hide remote facilities section when cartographers are hired
    const remoteFacilitiesSection = document.getElementById('remote-facilities-section');
    if (remoteFacilitiesSection) {
        if (gameState.personnel.cartographers > 0 || gameState.remoteFacilities > 0 || gameState.discoveryProgress > 0) {
            remoteFacilitiesSection.style.display = 'block';
        } else {
            remoteFacilitiesSection.style.display = 'none';
        }
    }
    
    // Show/hide unstable elements resource when remote facilities exist
    const unstableElementsRow = document.getElementById('unstable-elements-row');
    if (unstableElementsRow) {
        if (gameState.remoteFacilities > 0 || gameState.unstableElements > 0) {
            unstableElementsRow.style.display = 'block';
        } else {
            unstableElementsRow.style.display = 'none';
        }
    }
    
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
    
    // Only show cooldown if there are other active effects or if ships exist
    if (gameState.eventCooldown > 0 && (rewards.length > 0 || gameState.ships > 0)) {
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

// Update personnel UI
function updatePersonnelUI() {
    // Update counts and costs
    document.getElementById('researcher-count').textContent = gameState.personnel.researchers;
    document.getElementById('engineer-count').textContent = gameState.personnel.engineers;
    document.getElementById('worker-count').textContent = gameState.personnel.workers;
    
    const cartographerCount = document.getElementById('cartographer-count');
    if (cartographerCount) {
        cartographerCount.textContent = gameState.personnel.cartographers;
    }
    
    // Update hire button states
    document.getElementById('hire-researcher').disabled = gameState.metal < costs.personnel.researcher.hire;
    document.getElementById('hire-engineer').disabled = gameState.metal < costs.personnel.engineer.hire;
    document.getElementById('hire-worker').disabled = gameState.metal < costs.personnel.worker.hire;
    
    const hireCartographer = document.getElementById('hire-cartographer');
    if (hireCartographer) {
        hireCartographer.disabled = gameState.metal < costs.personnel.cartographer.hire;
    }
    
    // Update fire button states
    document.getElementById('fire-researcher').disabled = gameState.personnel.researchers === 0;
    document.getElementById('fire-engineer').disabled = gameState.personnel.engineers === 0;
    document.getElementById('fire-worker').disabled = gameState.personnel.workers === 0;
    
    const fireCartographer = document.getElementById('fire-cartographer');
    if (fireCartographer) {
        fireCartographer.disabled = gameState.personnel.cartographers === 0;
    }
    
    // Update upkeep display
    const upkeep = getPersonnelUpkeep();
    document.getElementById('personnel-upkeep').textContent = upkeep;
}

// Update blueprints UI
function updateBlueprintsUI() {
    const container = document.getElementById('blueprints-list');
    container.innerHTML = '';
    
    // Show available blueprints that haven't been started
    blueprintDefinitions.forEach(def => {
        const existing = gameState.blueprints.find(b => b.id === def.id);
        if (!existing) {
            const div = document.createElement('div');
            div.className = 'blueprint-item';
            div.innerHTML = `
                <div class="blueprint-header">
                    <strong>${def.name}</strong> (${def.type})
                </div>
                <div class="blueprint-desc">${def.description}</div>
                <div class="blueprint-costs">
                    Research: ${def.researchCost} metal (${def.researchTime} days) | 
                    Design: ${def.designCost} metal (${def.designTime} days)
                </div>
                <button class="action-btn" onclick="startBlueprintResearch('${def.id}')" 
                    ${gameState.metal < def.researchCost || gameState.personnel.researchers < 1 ? 'disabled' : ''}>
                    Start Research
                </button>
            `;
            container.appendChild(div);
        }
    });
    
    // Show blueprints in progress
    gameState.blueprints.forEach(blueprint => {
        const div = document.createElement('div');
        div.className = 'blueprint-item blueprint-in-progress';
        
        let status = '';
        let actionButton = '';
        
        if (blueprint.phase === 'research') {
            status = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${blueprint.researchProgress}%"></div>
                </div>
                <div class="progress-text">Research: ${blueprint.researchProgress.toFixed(0)}%</div>
            `;
        } else if (blueprint.phase === 'research_complete') {
            status = '<div class="status-complete">✓ Research Complete</div>';
            actionButton = `
                <button class="action-btn" onclick="startBlueprintDesign('${blueprint.id}')" 
                    ${gameState.metal < blueprint.designCost || gameState.personnel.engineers < 1 ? 'disabled' : ''}>
                    Start Design (${blueprint.designCost} metal)
                </button>
            `;
        } else if (blueprint.phase === 'design') {
            status = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${blueprint.designProgress}%"></div>
                </div>
                <div class="progress-text">Design: ${blueprint.designProgress.toFixed(0)}%</div>
            `;
        } else if (blueprint.phase === 'complete') {
            status = '<div class="status-complete">✓ Blueprint Complete - Ready for Production</div>';
        }
        
        div.innerHTML = `
            <div class="blueprint-header">
                <strong>${blueprint.name}</strong> (${blueprint.type})
            </div>
            <div class="blueprint-desc">${blueprint.description}</div>
            ${status}
            ${actionButton}
        `;
        container.appendChild(div);
    });
    
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #666;">No blueprints available yet.</p>';
    }
}

// Update items UI
function updateItemsUI() {
    const container = document.getElementById('items-list');
    container.innerHTML = '';
    
    // Show completed blueprints available for production
    const completedBlueprints = gameState.blueprints.filter(b => b.phase === 'complete');
    completedBlueprints.forEach(blueprint => {
        const div = document.createElement('div');
        div.className = 'item-production';
        div.innerHTML = `
            <div class="item-header">
                <strong>${blueprint.name}</strong>
            </div>
            <div class="item-cost">Cost: ${blueprint.productionCost} metal | Time: ${blueprint.productionTime} day(s)</div>
            <button class="action-btn" onclick="produceItem('${blueprint.id}')" 
                ${gameState.metal < blueprint.productionCost || gameState.personnel.workers < 1 ? 'disabled' : ''}>
                Produce Item
            </button>
        `;
        container.appendChild(div);
    });
    
    // Show items in production or completed
    gameState.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-card';
        
        let status = '';
        let actionButton = '';
        
        if (item.productionProgress < 100) {
            status = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${item.productionProgress}%"></div>
                </div>
                <div class="progress-text">Production: ${item.productionProgress.toFixed(0)}%</div>
            `;
        } else {
            const assignedClass = item.assigned ? 'item-assigned' : '';
            const assignedText = item.assigned ? '✓ Assigned' : 'Not Assigned';
            status = `<div class="item-status ${assignedClass}">${assignedText}</div>`;
            actionButton = `
                <button class="action-btn" onclick="assignItem('${item.id}')">
                    ${item.assigned ? 'Unassign' : 'Assign'}
                </button>
            `;
        }
        
        div.innerHTML = `
            <div class="item-header">
                <strong>${item.blueprint.name}</strong>
            </div>
            <div class="item-desc">${item.blueprint.description}</div>
            ${status}
            ${actionButton}
        `;
        container.appendChild(div);
    });
    
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: #666;">No items available. Complete blueprints to produce items.</p>';
    }
    
    // Update active bonuses display
    updateItemBonusesDisplay();
}

// Update active item bonuses display
function updateItemBonusesDisplay() {
    const container = document.getElementById('item-bonuses');
    const assignedItems = gameState.items.filter(i => i.assigned && i.productionProgress >= 100);
    
    if (assignedItems.length > 0) {
        let bonusText = '<strong>Active Item Bonuses:</strong><br>';
        assignedItems.forEach(item => {
            bonusText += `• ${item.blueprint.name}: ${item.blueprint.description}<br>`;
        });
        container.innerHTML = bonusText;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Update monolith UI
function updateMonolithUI() {
    const monolithSection = document.getElementById('monolith-section');
    if (!monolithSection) return;
    
    // Only show if discovered
    if (!gameState.monolith.discovered) {
        monolithSection.style.display = 'none';
        return;
    }
    
    monolithSection.style.display = 'block';
    
    const statusElement = document.getElementById('monolith-status');
    const progressElement = document.getElementById('monolith-progress');
    const actionButton = document.getElementById('monolith-action');
    const backstoryElement = document.getElementById('monolith-backstory');
    
    if (gameState.monolith.translated) {
        statusElement.textContent = 'Translation Complete';
        if (progressElement) progressElement.style.display = 'none';
        if (actionButton) actionButton.style.display = 'none';
        if (backstoryElement) backstoryElement.style.display = 'block';
    } else if (gameState.monolith.translating) {
        statusElement.textContent = `Translating... (${gameState.monolith.researchersAssigned} researcher${gameState.monolith.researchersAssigned > 1 ? 's' : ''} assigned)`;
        if (progressElement) {
            progressElement.style.display = 'block';
            progressElement.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${gameState.monolith.translationProgress}%"></div>
                </div>
                <div class="progress-text">Progress: ${gameState.monolith.translationProgress.toFixed(0)}%</div>
            `;
        }
        if (actionButton) {
            actionButton.textContent = 'Stop Translation';
            actionButton.disabled = false;
            actionButton.style.display = 'inline-block';
        }
    } else {
        statusElement.textContent = 'Ready to begin translation';
        if (progressElement) {
            progressElement.style.display = 'block';
            progressElement.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${gameState.monolith.translationProgress}%"></div>
                </div>
                <div class="progress-text">Progress: ${gameState.monolith.translationProgress.toFixed(0)}%</div>
            `;
        }
        if (actionButton) {
            actionButton.textContent = 'Start Translation';
            actionButton.disabled = gameState.personnel.researchers < 1;
            actionButton.style.display = 'inline-block';
        }
    }
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
    special: [
        {
            name: 'Mysterious Monolith',
            message: '🌙 EXTRAORDINARY DISCOVERY: Explorer ship has landed on Titan and discovered a mysterious monolith! The structure is covered in intricate, glowing symbols of unknown origin. This could change everything we know about the universe...',
            effect: () => {
                gameState.monolith.discovered = true;
                return '';
            },
            condition: () => {
                // Only trigger if not yet discovered, have ships, and high exploration level
                return !gameState.monolith.discovered && 
                       gameState.ships >= 3 && 
                       gameState.research.exploration >= 2;
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
                gameState.activeRewards.productionBonus = (gameState.activeRewards.productionBonus || 0) - 0.10;
                // Schedule repair for 2 days later
                gameState.pendingRepairs.push({
                    type: 'production',
                    amount: 0.10,
                    completionDay: gameState.day + 2
                });
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
                gameState.activeRewards.explorationBonus = (gameState.activeRewards.explorationBonus || 0) - 0.05;
                // Schedule repair for 2 days later
                gameState.pendingRepairs.push({
                    type: 'exploration',
                    amount: 0.05,
                    completionDay: gameState.day + 2
                });
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

    // Check for special events first (like monolith discovery)
    if (explorationEvents.special) {
        for (const specialEvent of explorationEvents.special) {
            if (specialEvent.condition && specialEvent.condition()) {
                // Trigger special event
                let fullMessage = specialEvent.message;
                if (specialEvent.effect) {
                    const effectResult = specialEvent.effect();
                    if (effectResult) {
                        fullMessage += effectResult;
                    }
                }
                addLogEntry(fullMessage);
                gameState.eventCooldown = Math.floor(Math.random() * (eventConfig.maxCooldownDays - eventConfig.minCooldownDays + 1)) + eventConfig.minCooldownDays;
                updateUI();
                return; // Don't trigger normal events when special event occurs
            }
        }
    }

    // Calculate event probability based on exploration research and ship count
    const baseChance = eventConfig.baseTriggerChance;
    const researchBonus = gameState.research.exploration * eventConfig.researchTriggerBonus;
    const shipBonus = Math.min(gameState.ships * eventConfig.shipTriggerBonus, eventConfig.maxShipTriggerBonus);
    const eventChance = baseChance + researchBonus + shipBonus;

    if (Math.random() < eventChance) {
        // Determine if positive or negative (70% positive base, increases with exploration research)
        const positiveChance = eventConfig.basePositiveChance + (gameState.research.exploration * eventConfig.researchPositiveBonus);
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
        gameState.eventCooldown = Math.floor(Math.random() * (eventConfig.maxCooldownDays - eventConfig.minCooldownDays + 1)) + eventConfig.minCooldownDays;
        
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
    
    // Produce unstable elements from remote facilities
    gameState.unstableElements += getUnstableElementsRate() * deltaTime;
    
    // Update day counter (every 60 seconds = 1 day)
    const elapsedTime = Date.now() - gameState.gameStartTime;
    const newDay = Math.floor(elapsedTime / 60000) + 1;
    if (newDay > gameState.day) {
        gameState.day = newDay;
        
        // Deduct personnel upkeep
        deductPersonnelUpkeep();
        
        // Update blueprint progress
        updateBlueprintProgress();
        
        // Update item production progress
        updateItemProduction();
        
        // Update monolith translation progress
        updateMonolithTranslation();
        
        // Process pending repairs
        if (gameState.pendingRepairs && gameState.pendingRepairs.length > 0) {
            const remainingRepairs = [];
            for (const repair of gameState.pendingRepairs) {
                if (gameState.day >= repair.completionDay) {
                    // Complete the repair
                    if (repair.type === 'production') {
                        gameState.activeRewards.productionBonus = (gameState.activeRewards.productionBonus || 0) + repair.amount;
                        addLogEntry('Repairs completed. Production systems back to normal.');
                    } else if (repair.type === 'exploration') {
                        gameState.activeRewards.explorationBonus = (gameState.activeRewards.explorationBonus || 0) + repair.amount;
                        addLogEntry('Ship repairs completed. Sensors back online.');
                    }
                } else {
                    // Keep the repair in the queue
                    remainingRepairs.push(repair);
                }
            }
            gameState.pendingRepairs = remainingRepairs;
        }
        
        // Decrease event cooldown
        if (gameState.eventCooldown > 0) {
            gameState.eventCooldown--;
        }
        
        // Trigger exploration events
        triggerExplorationEvent();
        
        // Attempt discovery of remote facility locations
        attemptDiscovery();
        
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
        gameState.pendingRepairs = [];
        gameState.personnel = {
            researchers: 0,
            engineers: 0,
            workers: 0,
            cartographers: 0
        };
        gameState.unstableElements = 0;
        gameState.remoteFacilities = 0;
        gameState.discoveryProgress = 0;
        gameState.blueprints = [];
        gameState.items = [];
        gameState.itemIdCounter = 0;
        gameState.monolith = {
            discovered: false,
            translating: false,
            translated: false,
            translationProgress: 0,
            researchersAssigned: 0
        };
        
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

// Personnel event listeners
document.getElementById('hire-researcher').addEventListener('click', () => hirePersonnel('researcher'));
document.getElementById('fire-researcher').addEventListener('click', () => firePersonnel('researcher'));
document.getElementById('hire-engineer').addEventListener('click', () => hirePersonnel('engineer'));
document.getElementById('fire-engineer').addEventListener('click', () => firePersonnel('engineer'));
document.getElementById('hire-worker').addEventListener('click', () => hirePersonnel('worker'));
document.getElementById('fire-worker').addEventListener('click', () => firePersonnel('worker'));

// Cartographer event listeners
const hireCartographerBtn = document.getElementById('hire-cartographer');
if (hireCartographerBtn) {
    hireCartographerBtn.addEventListener('click', () => hirePersonnel('cartographer'));
}
const fireCartographerBtn = document.getElementById('fire-cartographer');
if (fireCartographerBtn) {
    fireCartographerBtn.addEventListener('click', () => firePersonnel('cartographer'));
}

// Remote facility event listeners
const establishButton = document.getElementById('establish-remote-facility');
if (establishButton) {
    establishButton.addEventListener('click', establishRemoteFacility);
}

// Monolith event listeners
const monolithActionBtn = document.getElementById('monolith-action');
if (monolithActionBtn) {
    monolithActionBtn.addEventListener('click', () => {
        if (gameState.monolith.translating) {
            stopMonolithTranslation();
        } else {
            startMonolithTranslation();
        }
    });
}

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
            // Ensure pendingRepairs exists for old saves
            if (!gameState.pendingRepairs) {
                gameState.pendingRepairs = [];
            }
            // Ensure personnel exists for old saves
            if (!gameState.personnel) {
                gameState.personnel = {
                    researchers: 0,
                    engineers: 0,
                    workers: 0,
                    cartographers: 0
                };
            }
            // Ensure cartographers exists for old saves
            if (gameState.personnel.cartographers === undefined) {
                gameState.personnel.cartographers = 0;
            }
            // Ensure remote mining facilities exist for old saves
            if (gameState.unstableElements === undefined) {
                gameState.unstableElements = 0;
            }
            if (gameState.remoteFacilities === undefined) {
                gameState.remoteFacilities = 0;
            }
            if (gameState.discoveryProgress === undefined) {
                gameState.discoveryProgress = 0;
            }
            // Ensure blueprints exists for old saves
            if (!gameState.blueprints) {
                gameState.blueprints = [];
            }
            // Ensure items exists for old saves
            if (!gameState.items) {
                gameState.items = [];
            }
            // Ensure itemIdCounter exists for old saves
            if (gameState.itemIdCounter === undefined) {
                // Initialize counter to max existing item ID to avoid collisions
                // Counter is incremented before use in produceItem(), so this sets
                // the next ID correctly. E.g., if max existing ID is 5, counter = 5,
                // next item gets ID 6 (after increment).
                let maxId = 0;
                if (gameState.items && gameState.items.length > 0) {
                    gameState.items.forEach(item => {
                        // Safely parse item ID, expecting format: blueprintId_number
                        if (item.id && typeof item.id === 'string') {
                            const parts = item.id.split('_');
                            // Ensure we have at least 2 parts (blueprintId and number)
                            if (parts.length >= 2) {
                                const idNum = parseInt(parts[parts.length - 1]);
                                if (!isNaN(idNum) && idNum > maxId) {
                                    maxId = idNum;
                                }
                            }
                        }
                    });
                }
                gameState.itemIdCounter = maxId;
            }
            // Ensure monolith exists for old saves
            if (!gameState.monolith) {
                gameState.monolith = {
                    discovered: false,
                    translating: false,
                    translated: false,
                    translationProgress: 0,
                    researchersAssigned: 0
                };
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

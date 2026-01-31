# Blueprint System Implementation Guide

## Overview
This document describes the comprehensive Blueprint System implemented for the Starhauler space logistics game. The system adds three interconnected features: Personnel Management, Blueprint Research & Design, and Item Production & Assignment.

## Features Implemented

### 1. Personnel System

Three types of personnel can be hired and managed:

#### Researchers
- **Cost**: 150 metal to hire
- **Upkeep**: 10 metal/day
- **Purpose**: Required for blueprint research phase
- Players can hire/fire researchers through the UI

#### Engineers  
- **Cost**: 200 metal to hire
- **Upkeep**: 15 metal/day
- **Purpose**: Required for blueprint design phase
- Players can hire/fire engineers through the UI

#### Workers
- **Cost**: 100 metal to hire
- **Upkeep**: 8 metal/day
- **Purpose**: Required for item production
- Players can hire/fire workers through the UI

#### Personnel Mechanics
- Daily upkeep is automatically deducted from metal reserves
- Upkeep is deducted once per day (every 60 seconds in-game)
- Players receive log notifications when upkeep is deducted
- Personnel counts are saved/loaded with game state
- Backward compatible with old save games (defaults to 0 personnel)

### 2. Blueprint System

Three blueprint types are available:

#### Advanced Mining Array
- **Type**: Building Upgrade
- **Research Cost**: 300 metal, 3 days
- **Design Cost**: 400 metal, 2 days
- **Production Cost**: 250 metal, 1 day
- **Bonus**: +25% production per facility
- **Requires**: 1 Researcher (research), 1 Engineer (design), 1 Worker (production)

#### Quantum Sensors
- **Type**: Ship System
- **Research Cost**: 500 metal, 4 days
- **Design Cost**: 600 metal, 3 days
- **Production Cost**: 400 metal, 2 days
- **Bonus**: +30% exploration effectiveness
- **Requires**: 1 Researcher (research), 1 Engineer (design), 1 Worker (production)

#### Auto-Refinery
- **Type**: Facility Equipment
- **Research Cost**: 400 metal, 3 days
- **Design Cost**: 500 metal, 2 days
- **Production Cost**: 300 metal, 1 day
- **Bonus**: +20% production per facility
- **Requires**: 1 Researcher (research), 1 Engineer (design), 1 Worker (production)

#### Blueprint Workflow
1. **Research Phase**: 
   - Requires at least 1 researcher
   - Costs metal upfront
   - Progress tracked over in-game days
   - Visual progress bar shows completion percentage
   - Automatically completes when time elapses

2. **Design Phase**:
   - Only available after research completes
   - Requires at least 1 engineer
   - Costs metal upfront
   - Progress tracked over in-game days
   - Visual progress bar shows completion percentage
   - Automatically completes when time elapses

3. **Completion**:
   - Blueprint becomes available for item production
   - Players can produce unlimited items from completed blueprints

### 3. Item System

#### Item Production
- Once a blueprint is complete, players can produce items
- Each item requires:
  - At least 1 worker
  - Metal cost (defined in blueprint)
  - Production time (in days)
- Items show production progress with visual progress bar
- Log notifications when production completes

#### Item Assignment
- Completed items can be assigned to activate their bonuses
- Items can be unassigned to deactivate bonuses
- Multiple items can be assigned simultaneously
- Bonuses stack additively
- Assigned items show green "Assigned" status
- Unassigned items show orange "Not Assigned" status

#### Item Bonuses
- Production bonuses increase metal generation rate
- Bonuses are integrated into the existing `getProductionRate()` function
- Active bonuses are displayed in a dedicated UI section
- Bonuses persist across save/load

### 4. UI Updates

#### Personnel Panel
- Shows count of each personnel type
- Displays total daily upkeep cost
- Hire buttons (disabled if not enough metal)
- Fire buttons (disabled if count is 0)
- Visual feedback with color coding

#### Blueprint Research & Design Panel
- Lists available blueprints not yet started
- Shows blueprints in progress with progress bars
- Displays costs and requirements
- Start Research/Design buttons
- Color-coded status indicators

#### Item Production & Assignment Panel
- Shows completed blueprints available for production
- Lists items in production with progress bars
- Displays completed items with assignment controls
- Shows active item bonuses at the top
- Assign/Unassign buttons

### 5. Integration with Existing Systems

#### Game Loop Integration
- Personnel upkeep deducted daily
- Blueprint research/design progress updated daily
- Item production progress updated daily
- All integrated into existing day counter system (60 seconds = 1 day)

#### Save/Load System
- All new state (personnel, blueprints, items) saved automatically
- Backward compatible with old saves
- Missing properties initialized with safe defaults
- Auto-save every 30 seconds includes new features

#### Production Rate Calculation
- Modified `getProductionRate()` to include item bonuses
- Item bonuses multiply with existing research/automation/reward bonuses
- Seamless integration with existing mechanics

#### Reset Functionality
- Reset button clears all personnel, blueprints, and items
- Returns to initial game state
- Maintains all existing reset behavior

## Technical Implementation Details

### Code Structure
All changes follow existing patterns in game.js:
- Functions grouped by feature
- Consistent naming conventions
- Integration with existing game loop
- Uses same UI update pattern

### Files Modified
1. **game.js**: Added ~400 lines of code
   - Personnel management functions
   - Blueprint system functions
   - Item production functions
   - UI update functions
   - Game loop integration
   - Save/load compatibility

2. **index.html**: Added 4 new sections
   - Personnel Management section
   - Blueprint Research & Design section
   - Item Production & Assignment section
   - All integrated into existing grid layout

3. **style.css**: Added ~150 lines of CSS
   - Personnel panel styles
   - Blueprint panel styles
   - Item panel styles
   - Progress bar animations
   - Status indicators
   - Scrollable containers

### Performance Considerations
- UI updates only on game loop tick (100ms)
- Progress calculations use simple day-based math
- No expensive operations in hot paths
- Existing performance characteristics maintained

## User Experience Flow

1. **Early Game**: 
   - Build up metal production
   - Hire first researcher/engineer/worker
   - Start researching first blueprint

2. **Mid Game**:
   - Complete blueprint research and design
   - Produce items
   - Assign items for bonuses
   - Expand personnel as needed

3. **Late Game**:
   - Multiple active items
   - Stacking bonuses
   - Strategic personnel management
   - Multiple blueprints in progress

## Future Enhancement Opportunities
- More blueprint types
- Blueprint upgrade paths
- Personnel specializations
- Item durability/maintenance
- Blueprint discoveries through exploration
- Personnel training/leveling

## Testing
A test page (`test_blueprint_system.html`) is included to verify:
- State properties exist
- Blueprint definitions loaded
- Functions defined correctly
- Basic functionality works
- Integration with existing code

## Backward Compatibility
- Old save games load correctly
- Missing properties initialized safely
- No breaking changes to existing features
- All existing functionality preserved

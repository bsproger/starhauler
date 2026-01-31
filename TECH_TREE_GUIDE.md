# Interplanetary Tech Tree Guide

## Overview
The Interplanetary Tech Tree is a progression system that allows players to research advanced technologies using unstable elements, culminating in the construction of an Interplanetary Spaceship capable of travel between planets.

## How to Unlock
1. Build **Remote Mining Facilities** to generate unstable elements
2. Hire **Cartographers** to discover suitable locations for remote facilities
3. Once you have unstable elements, the tech tree becomes accessible

## Tech Tree Progression

### Tier 1: Basic Research
**Unstable Element Analysis** (50 unstable elements, 2 days)
- Study the properties of unstable elements found in Saturn's rings
- This is the foundation for all interplanetary technology
- Unlocks both Tier 2 technologies

### Tier 2: Advanced Technologies
**Advanced Propulsion Theory** (150 unstable elements, 3 days)
- Develop theoretical framework for unstable element-based propulsion
- Requires: Unstable Element Analysis
- Unlocks: Ion Drive Prototype

**Containment Field Technology** (150 unstable elements, 3 days)
- Create stable containment fields for volatile unstable elements
- Requires: Unstable Element Analysis
- Unlocks: Fuel Stabilization System

### Tier 3: Prototype Systems
**Ion Drive Prototype** (300 unstable elements, 4 days)
- Build a working prototype of an unstable element-powered ion drive
- Requires: Advanced Propulsion Theory
- Unlocks: Interplanetary Navigation

**Fuel Stabilization System** (300 unstable elements, 4 days)
- Develop systems to safely store and utilize unstable elements as fuel
- Requires: Containment Field Technology
- Unlocks: Interplanetary Navigation

### Tier 4: Navigation Systems
**Interplanetary Navigation** (500 unstable elements, 5 days)
- Advanced navigation systems for long-distance space travel
- Requires: Both Ion Drive Prototype AND Fuel Stabilization System
- Unlocks: Interplanetary Spaceship

### Tier 5: Final Goal
**Interplanetary Spaceship** (1000 unstable elements, 7 days)
- Construct a fully functional spaceship capable of travel between planets
- Requires: Interplanetary Navigation
- Completing this research is a major victory milestone! 🚀

## Total Costs
To complete the entire tech tree:
- **Total Unstable Elements**: 2,400
- **Total Time**: 24 days (in-game)

## Strategy Tips
1. **Prioritize Remote Facilities**: Build multiple remote facilities to increase unstable element production (0.5 per facility per second)
2. **Hire Cartographers**: More cartographers = faster discovery of remote facility locations
3. **Plan Ahead**: Research can't be rushed, so start early
4. **Sequential Research**: Only one technology can be researched at a time
5. **Save Progress**: Your tech tree progress is automatically saved with the game

## Visual Indicators
- 🔒 **Locked**: Prerequisites not met yet
- 🔓 **Available**: Ready to research (if you have enough unstable elements)
- 🔬 **In Progress**: Currently researching (shows progress percentage)
- ✅ **Complete**: Research finished

## Game Impact
The tech tree adds a long-term progression goal beyond the existing research systems. It encourages:
- Building up unstable element production infrastructure
- Strategic resource management
- Patience and planning for long-term goals
- Engagement with the remote mining facilities mechanic

## Technical Details
- Research progress updates daily (every 60 seconds in real-time)
- Only one technology can be researched at a time
- Research cannot be cancelled once started
- Progress is saved in localStorage with the game state
- Fully compatible with existing save files

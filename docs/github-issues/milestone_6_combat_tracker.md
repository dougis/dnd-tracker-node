# Milestone 6: Combat Tracker Core (Week 3)

**Due Date**: End of Week 3  
**Goal**: Complete core combat tracking functionality with initiative, HP management, and conditions

## Overview

This milestone implements the core combat tracking features that form the heart of the D&D Encounter Tracker. It includes initiative tracking, HP/damage management, condition tracking, turn management, and combat state persistence.

## Issues for Milestone 6

### Issue #81: Implement Combat State Management
**Labels**: `P1`, `M6-Combat`, `MVP`, `api`, `ai-ready`, `blocking`  
**Depends on**: #70 (Encounter CRUD)  
**Description**: Create combat state management system with initiative tracking and turn order

**Acceptance Criteria**:
```
- [ ] Create packages/server/src/services/combat.service.ts:
  - [ ] startCombat(encounterId: string):
    - [ ] Roll initiative for all participants
    - [ ] Sort participants by initiative (descending)
    - [ ] Set combatState.isActive = true
    - [ ] Initialize round = 1, turn = 0
    - [ ] Log combat start event
  - [ ] advanceTurn(encounterId: string):
    - [ ] Move to next participant in initiative order
    - [ ] Handle round transitions
    - [ ] Skip inactive participants
    - [ ] Update combat state
    - [ ] Log turn change
  - [ ] endCombat(encounterId: string):
    - [ ] Set combatState.isActive = false
    - [ ] Log combat end event
    - [ ] Calculate combat duration
    - [ ] Archive combat log (premium)
  - [ ] rollInitiative(encounterId: string, participantId: string):
    - [ ] Roll d20 + dexterity modifier
    - [ ] Update participant initiative
    - [ ] Recalculate turn order
    - [ ] Log initiative change
- [ ] Create combat.controller.ts:
  - [ ] POST /encounters/:id/combat/start
  - [ ] PUT /encounters/:id/combat/turn
  - [ ] POST /encounters/:id/combat/end
  - [ ] PUT /encounters/:id/participants/:participantId/initiative
- [ ] Add validation:
  - [ ] Only encounter owner can manage combat
  - [ ] Encounter must be in 'planning' status to start
  - [ ] Combat must be active to advance turns
- [ ] Create tests:
  - [ ] Initiative calculation with modifiers
  - [ ] Turn order sorting (tie-breaking by dex mod)
  - [ ] Round advancement logic
  - [ ] Edge cases (no participants, all inactive)
```

---

### Issue #82: Create HP and Damage Management
**Labels**: `P1`, `M6-Combat`, `MVP`, `api`, `ai-ready`  
**Depends on**: #81  
**Description**: Implement HP tracking, damage/healing application, and temporary HP

**Acceptance Criteria**:
```
- [ ] Create HP management service methods:
  - [ ] applyDamage(encounterId: string, participantId: string, damage: number):
    - [ ] Reduce temporary HP first
    - [ ] Apply remaining damage to current HP
    - [ ] Prevent HP from going below 0
    - [ ] Handle unconsciousness at 0 HP
    - [ ] Log damage event with details
  - [ ] applyHealing(encounterId: string, participantId: string, healing: number):
    - [ ] Restore current HP
    - [ ] Cannot exceed maximum HP
    - [ ] Remove unconscious condition if healed from 0
    - [ ] Log healing event
  - [ ] setTemporaryHP(encounterId: string, participantId: string, tempHP: number):
    - [ ] Set temporary HP value
    - [ ] Temporary HP doesn't stack
    - [ ] Log temporary HP change
  - [ ] adjustMaxHP(encounterId: string, participantId: string, newMaxHP: number):
    - [ ] Update maximum HP
    - [ ] Adjust current HP if it exceeds new max
    - [ ] Log max HP change
- [ ] Create API endpoints:
  - [ ] PUT /encounters/:id/participants/:participantId/damage
  - [ ] PUT /encounters/:id/participants/:participantId/healing
  - [ ] PUT /encounters/:id/participants/:participantId/temp-hp
  - [ ] PUT /encounters/:id/participants/:participantId/max-hp
- [ ] Add request validation:
  - [ ] Damage/healing amounts must be positive integers
  - [ ] Max HP must be at least 1
  - [ ] Temporary HP must be non-negative
- [ ] Create HP calculation utilities:
  - [ ] calculateEffectiveHP(currentHP, tempHP)
  - [ ] getHPStatus(currentHP, maxHP) -> healthy/injured/critical/unconscious
  - [ ] formatHPDisplay(current, max, temp)
- [ ] Add tests:
  - [ ] Damage application with temp HP
  - [ ] Healing calculations
  - [ ] Edge cases (massive damage, overhealing)
  - [ ] HP status calculations
```

---

### Issue #83: Implement Condition Management
**Labels**: `P1`, `M6-Combat`, `MVP`, `api`, `ai-ready`  
**Depends on**: #81  
**Description**: Create condition tracking system with durations and automatic expiry

**Acceptance Criteria**:
```
- [ ] Create condition management service:
  - [ ] addCondition(encounterId: string, participantId: string, condition: Condition):
    - [ ] Add condition to participant
    - [ ] Set duration if specified
    - [ ] Log condition applied
    - [ ] Check for conflicting conditions
  - [ ] removeCondition(encounterId: string, participantId: string, conditionName: string):
    - [ ] Remove specific condition
    - [ ] Log condition removed
    - [ ] Apply any end-of-condition effects
  - [ ] updateConditionDurations(encounterId: string):
    - [ ] Decrease duration by 1 for all timed conditions
    - [ ] Remove expired conditions
    - [ ] Log expiring conditions
    - [ ] Called automatically on turn advancement
  - [ ] getActiveConditions(participantId: string):
    - [ ] Return all active conditions for display
    - [ ] Include remaining duration
    - [ ] Sort by severity/alphabetically
- [ ] Create condition definitions:
  - [ ] Common D&D 5e conditions:
    - [ ] Blinded, Charmed, Deafened, Frightened
    - [ ] Grappled, Incapacitated, Invisible, Paralyzed
    - [ ] Petrified, Poisoned, Prone, Restrained
    - [ ] Stunned, Unconscious
  - [ ] Each condition has:
    - [ ] name: string
    - [ ] description: string
    - [ ] mechanical effects
    - [ ] default duration (if any)
- [ ] Create API endpoints:
  - [ ] POST /encounters/:id/participants/:participantId/conditions
  - [ ] DELETE /encounters/:id/participants/:participantId/conditions/:conditionName
  - [ ] GET /encounters/:id/participants/:participantId/conditions
- [ ] Add validation:
  - [ ] Condition name must be valid
  - [ ] Duration must be positive integer or null (indefinite)
  - [ ] Check for mutually exclusive conditions
- [ ] Create tests:
  - [ ] Adding/removing conditions
  - [ ] Duration tracking and expiry
  - [ ] Conflicting condition handling
  - [ ] Automatic cleanup on turn advancement
```

---

### Issue #84: Build Combat Tracker UI Components
**Labels**: `P1`, `M6-Combat`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #82, #83  
**Description**: Create React components for combat tracking interface

**Acceptance Criteria**:
```
- [ ] Create CombatTracker component:
  - [ ] Layout: initiative order on left, participant details on right
  - [ ] Current turn highlighting
  - [ ] Round counter display
  - [ ] Combat state controls (start/end)
  - [ ] Turn advancement buttons
- [ ] Create InitiativeList component:
  - [ ] Ordered list of all participants
  - [ ] Initiative values display
  - [ ] Current turn indicator
  - [ ] Participant status indicators (hp, conditions)
  - [ ] Quick actions (damage, healing)
- [ ] Create ParticipantCard component:
  - [ ] Name and portrait/icon
  - [ ] HP bar with current/max/temporary display
  - [ ] Condition badges with tooltips
  - [ ] AC and other key stats
  - [ ] Notes section
- [ ] Create HPManagement component:
  - [ ] Damage input with quick buttons (1, 5, 10)
  - [ ] Healing input
  - [ ] Temporary HP input
  - [ ] Max HP adjustment
  - [ ] Confirmation dialogs for major changes
- [ ] Create ConditionManager component:
  - [ ] Searchable condition list
  - [ ] Duration input
  - [ ] Active conditions display
  - [ ] Quick add/remove buttons
  - [ ] Condition descriptions on hover
- [ ] Create CombatControls component:
  - [ ] Start/End combat buttons
  - [ ] Next turn button
  - [ ] Previous turn button (undo)
  - [ ] Round advancement
  - [ ] Initiative reroll options
- [ ] Add responsive design:
  - [ ] Mobile-friendly layout
  - [ ] Touch-optimized controls
  - [ ] Swipe gestures for turn advancement
- [ ] Create tests:
  - [ ] Component rendering
  - [ ] User interactions
  - [ ] State updates
  - [ ] Props validation
```

---

### Issue #85: Implement Combat Log System
**Labels**: `P2`, `M6-Combat`, `MVP`, `api`, `ai-ready`  
**Depends on**: #81  
**Description**: Create detailed combat logging for premium users

**Acceptance Criteria**:
```
- [ ] Create combat logging service:
  - [ ] logEvent(encounterId: string, event: CombatEvent):
    - [ ] Store event with timestamp
    - [ ] Include round and turn information
    - [ ] Store actor and target information
    - [ ] Include detailed event data
    - [ ] Only for premium subscribers
  - [ ] getCombatLog(encounterId: string, filters?: LogFilters):
    - [ ] Return paginated log events
    - [ ] Filter by event type, participant, round
    - [ ] Sort by timestamp (newest first)
    - [ ] Include formatted descriptions
  - [ ] exportCombatLog(encounterId: string, format: 'json' | 'csv'):
    - [ ] Export complete log
    - [ ] Include all event details
    - [ ] Format for external analysis
- [ ] Define combat event types:
  - [ ] COMBAT_START, COMBAT_END
  - [ ] TURN_START, TURN_END, ROUND_ADVANCE
  - [ ] DAMAGE_DEALT, HEALING_RECEIVED
  - [ ] CONDITION_ADDED, CONDITION_REMOVED
  - [ ] INITIATIVE_ROLLED, HP_ADJUSTED
- [ ] Create log entry interface:
  - [ ] timestamp: Date
  - [ ] round: number
  - [ ] turn: number
  - [ ] eventType: CombatEventType
  - [ ] actor: string (participant name)
  - [ ] target?: string (target participant)
  - [ ] details: any (event-specific data)
  - [ ] description: string (human-readable)
- [ ] Create API endpoints:
  - [ ] GET /encounters/:id/combat/log
  - [ ] GET /encounters/:id/combat/log/export
- [ ] Add premium feature gating:
  - [ ] Check subscription tier
  - [ ] Show upgrade prompt for free users
  - [ ] Limited log retention for free tier
- [ ] Create tests:
  - [ ] Event logging
  - [ ] Log retrieval and filtering
  - [ ] Export functionality
  - [ ] Premium tier enforcement
```

---

### Issue #86: Add Death Saves and Concentration Tracking
**Labels**: `P2`, `M6-Combat`, `MVP`, `api`, `ai-ready`  
**Depends on**: #83  
**Description**: Implement death saving throws and concentration checks for spellcasters

**Acceptance Criteria**:
```
- [ ] Create death saves system:
  - [ ] Track success/failure counts for unconscious characters
  - [ ] rollDeathSave(encounterId: string, participantId: string):
    - [ ] Roll d20
    - [ ] 1 = 2 failures, 20 = 1 success + regain 1 HP
    - [ ] 10+ = success, <10 = failure
    - [ ] Check for stabilization (3 successes) or death (3 failures)
  - [ ] resetDeathSaves(participantId: string):
    - [ ] Clear saves when healed or stabilized
  - [ ] Auto-prompt for death saves on turn start if at 0 HP
- [ ] Create concentration tracking:
  - [ ] addConcentration(participantId: string, spell: string):
    - [ ] Track what spell/effect is being concentrated on
    - [ ] Remove previous concentration if exists
  - [ ] rollConcentrationSave(participantId: string, damage: number):
    - [ ] DC = max(10, damage/2)
    - [ ] Roll d20 + Constitution modifier
    - [ ] Break concentration on failure
  - [ ] breakConcentration(participantId: string):
    - [ ] End concentration effect
    - [ ] Log concentration broken
    - [ ] Remove related conditions/effects
- [ ] Add UI components:
  - [ ] DeathSaveTracker with success/failure indicators
  - [ ] ConcentrationIndicator showing active spell
  - [ ] Concentration save dialog on damage
  - [ ] Death save roll dialog on turn start
- [ ] Create API endpoints:
  - [ ] POST /encounters/:id/participants/:participantId/death-save
  - [ ] PUT /encounters/:id/participants/:participantId/concentration
  - [ ] POST /encounters/:id/participants/:participantId/concentration-check
- [ ] Add automation:
  - [ ] Auto-prompt for concentration saves on damage
  - [ ] Auto-prompt for death saves on unconscious turn
  - [ ] Auto-break concentration on unconscious
- [ ] Create tests:
  - [ ] Death save mechanics
  - [ ] Concentration save calculations
  - [ ] Automatic prompting logic
  - [ ] Edge cases (multiple damage sources)
```

---

### Issue #87: Implement Combat Round Management
**Labels**: `P1`, `M6-Combat`, `MVP`, `api`, `ai-ready`  
**Depends on**: #81  
**Description**: Add round tracking with automatic condition duration handling

**Acceptance Criteria**:
```
- [ ] Create round management system:
  - [ ] advanceRound(encounterId: string):
    - [ ] Increment round counter
    - [ ] Reset to first participant in initiative order
    - [ ] Update all timed condition durations
    - [ ] Process end-of-round effects
    - [ ] Log round advancement
  - [ ] processEndOfRound(encounterId: string):
    - [ ] Handle ongoing damage/healing
    - [ ] Process condition expirations
    - [ ] Trigger environmental effects
    - [ ] Update lair action availability
  - [ ] getRoundInfo(encounterId: string):
    - [ ] Current round number
    - [ ] Time elapsed (estimated)
    - [ ] Round summary statistics
- [ ] Add round-based effects:
  - [ ] Automatic condition duration reduction
  - [ ] Ongoing damage application (poison, fire, etc.)
  - [ ] Regeneration effects
  - [ ] Spell duration tracking
- [ ] Create UI components:
  - [ ] RoundCounter component showing current round
  - [ ] RoundSummary with round statistics
  - [ ] EndOfRoundEffects checklist
  - [ ] Time tracker (optional)
- [ ] Add API endpoints:
  - [ ] PUT /encounters/:id/combat/round
  - [ ] GET /encounters/:id/combat/round-info
- [ ] Create automation features:
  - [ ] Auto-advance when all participants have acted
  - [ ] Configurable round timer alerts
  - [ ] Automatic effect processing
- [ ] Create tests:
  - [ ] Round advancement logic
  - [ ] Condition duration updates
  - [ ] End-of-round effect processing
  - [ ] Round statistics calculation
```

---

### Issue #88: Add Lair Actions Support
**Labels**: `P3`, `M6-Combat`, `Post-MVP`, `ai-ready`  
**Depends on**: #87  
**Description**: Implement lair actions that occur at initiative 20

**Acceptance Criteria**:
```
- [ ] Create lair action system:
  - [ ] configureLairActions(encounterId: string, actions: LairAction[]):
    - [ ] Set up lair actions for encounter
    - [ ] Add lair initiative at 20
    - [ ] Configure action rotation/selection
  - [ ] triggerLairAction(encounterId: string, actionIndex: number):
    - [ ] Execute specified lair action
    - [ ] Apply effects to encounter
    - [ ] Log lair action usage
    - [ ] Handle recharge mechanics
  - [ ] getLairActionOptions(encounterId: string):
    - [ ] Return available lair actions
    - [ ] Check recharge status
    - [ ] Consider used actions
- [ ] Define lair action interface:
  - [ ] name: string
  - [ ] description: string
  - [ ] recharge: string (e.g., "5-6", "once per round")
  - [ ] area: string (description of affected area)
  - [ ] effects: ActionEffect[]
- [ ] Create UI components:
  - [ ] LairActionPanel for DM use
  - [ ] LairActionList showing available actions
  - [ ] LairActionDescription with full details
  - [ ] Recharge indicators
- [ ] Add integration with initiative:
  - [ ] Insert lair turn at initiative 20
  - [ ] Skip if no lair actions configured
  - [ ] Handle turn indicator properly
- [ ] Create API endpoints:
  - [ ] PUT /encounters/:id/lair-actions
  - [ ] POST /encounters/:id/lair-actions/:index/trigger
  - [ ] GET /encounters/:id/lair-actions/available
- [ ] Add premium feature gating:
  - [ ] Available for Seasoned tier and above
  - [ ] Show upgrade prompt for free users
- [ ] Create tests:
  - [ ] Lair action configuration
  - [ ] Initiative integration
  - [ ] Recharge mechanics
  - [ ] Effect application
```

---

## Integration Points

### WebSocket Events (for Milestone 7)
```typescript
// Combat events to broadcast
interface CombatEvents {
  'combat:started': { encounterId: string; participants: Participant[] };
  'combat:ended': { encounterId: string; duration: number };
  'turn:advanced': { encounterId: string; currentTurn: number; round: number };
  'participant:damaged': { encounterId: string; participantId: string; damage: number };
  'participant:healed': { encounterId: string; participantId: string; healing: number };
  'condition:added': { encounterId: string; participantId: string; condition: Condition };
  'condition:removed': { encounterId: string; participantId: string; conditionName: string };
}
```

### Subscription Tier Requirements
```typescript
// Feature gating for combat features
const COMBAT_FEATURE_GATES = {
  basic_combat: 'free',        // Basic HP/initiative tracking
  condition_tracking: 'free',  // Basic conditions
  combat_log: 'seasoned',     // Detailed logging
  lair_actions: 'seasoned',   // Lair action support
  advanced_automation: 'expert', // Auto-calculations
  custom_conditions: 'master', // User-defined conditions
};
```

## Success Criteria

By the end of Week 3, the combat tracker should have:

1. **Core Combat Functionality**:
   - Initiative tracking and turn order
   - HP/damage management with temporary HP
   - Condition tracking with automatic duration
   - Death saves and concentration mechanics

2. **User Interface**:
   - Intuitive combat tracker layout
   - Quick action buttons for common tasks
   - Visual indicators for status effects
   - Mobile-responsive design

3. **Data Persistence**:
   - Combat state saved automatically
   - Combat log for premium users
   - Encounter state transitions

4. **Testing Coverage**:
   - Unit tests for all combat mechanics
   - Integration tests for API endpoints
   - UI component tests
   - Edge case handling

**Key Performance Targets**:
- Combat state updates: <100ms response time
- Initiative order calculation: instantaneous
- UI updates: <50ms after user action
- Zero data loss during combat

**Next Steps**: With core combat complete, Milestone 7 will add real-time synchronization for multi-user combat sessions.

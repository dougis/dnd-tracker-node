# Milestone 5: Encounter System (Week 3)

**Due Date**: Mid Week 3  
**Goal**: Build encounter and creature management system

## Overview

This milestone implements the encounter building system, allowing DMs to create combat encounters by selecting parties and adding creatures. It includes a comprehensive creature database with SRD content, search/filter capabilities, and encounter difficulty calculations based on D&D 5e guidelines.

## Issues for Milestone 5

### Issue #61: Create Creature Template System
**Labels**: `P1`, `M5-Encounter`, `MVP`, `api`, `database`, `ai-ready`  
**Depends on**: #31  
**Description**: Implement creature templates and management system

**Acceptance Criteria**:
```
- [ ] Create creature service:
  - [ ] getSystemTemplates(): Return SRD creatures
  - [ ] getUserCreatures(userId): User's custom
  - [ ] createCreature(userId, data): Add custom
  - [ ] updateCreature(userId, id, data): Edit
  - [ ] deleteCreature(userId, id): Remove
  - [ ] cloneTemplate(id): Copy as custom
- [ ] Implement search:
  - [ ] Text search on name/tags
  - [ ] Filter by CR
  - [ ] Filter by type
  - [ ] Filter by size
  - [ ] Sort options
- [ ] Add CR calculations:
  - [ ] Offensive CR
  - [ ] Defensive CR
  - [ ] Average CR
- [ ] Seed SRD creatures:
  - [ ] 50+ basic creatures
  - [ ] Various CR levels
  - [ ] Different types
  - [ ] Proper stat blocks
- [ ] Create validation:
  - [ ] Required stats
  - [ ] Valid CR format
  - [ ] Ability score ranges
```

**Creature Database Structure**:
```typescript
interface CreatureTemplate {
  id: string;
  name: string;
  size: CreatureSize;
  type: string;
  subtype?: string;
  alignment: string;
  
  // Combat Stats
  ac: number;
  hp: number;
  hitDice: string;
  speed: {
    walk: number;
    swim?: number;
    fly?: number;
    climb?: number;
    burrow?: number;
  };
  
  // Ability Scores
  abilities: AbilityScores;
  
  // D&D Specific
  challengeRating: string;
  proficiencyBonus: number;
  
  // Features
  traits: CreatureAction[];
  actions: CreatureAction[];
  legendaryActions?: {
    count: number;
    actions: CreatureAction[];
  };
  lairActions?: CreatureAction[];
  
  // Metadata
  isTemplate: boolean;
  userId?: string; // null for system templates
  source: string;
  tags: string[];
}
```

**SRD Creature Examples**:
```typescript
const SRD_CREATURES = [
  {
    name: "Goblin",
    size: "small",
    type: "humanoid",
    subtype: "goblinoid",
    alignment: "neutral evil",
    ac: 15,
    hp: 7,
    hitDice: "2d6",
    speed: { walk: 30 },
    abilities: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
    challengeRating: "1/4",
    proficiencyBonus: 2,
    actions: [
      {
        name: "Scimitar",
        description: "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.",
        attackBonus: 4,
        damage: "1d6+2"
      }
    ]
  },
  {
    name: "Adult Red Dragon",
    size: "huge",
    type: "dragon",
    alignment: "chaotic evil",
    ac: 19,
    hp: 256,
    hitDice: "19d12 + 133",
    speed: { walk: 40, climb: 40, fly: 80 },
    abilities: { strength: 27, dexterity: 10, constitution: 25, intelligence: 16, wisdom: 13, charisma: 21 },
    challengeRating: "17",
    proficiencyBonus: 6,
    legendaryActions: {
      count: 3,
      actions: [
        {
          name: "Detect",
          description: "The dragon makes a Wisdom (Perception) check.",
          cost: 1
        }
      ]
    },
    lairActions: [
      {
        name: "Magma Eruption",
        description: "Magma erupts from a point on the ground within 120 feet of the dragon..."
      }
    ]
  }
];
```

---

### Issue #62: Build Creature CRUD Endpoints
**Labels**: `P1`, `M5-Encounter`, `MVP`, `api`, `ai-ready`  
**Depends on**: #61  
**Description**: Create creature management REST API

**Acceptance Criteria**:
```
- [ ] GET /api/v1/creatures:
  - [ ] Pagination support
  - [ ] Search query param
  - [ ] Filters: type, CR, size
  - [ ] Include user + system
- [ ] POST /api/v1/creatures:
  - [ ] Create custom creature
  - [ ] Validate stat block
  - [ ] User ownership
- [ ] GET /api/v1/creatures/:id:
  - [ ] Return full details
  - [ ] Check permissions
- [ ] PUT /api/v1/creatures/:id:
  - [ ] Update custom only
  - [ ] Validate changes
- [ ] DELETE /api/v1/creatures/:id:
  - [ ] Remove custom only
  - [ ] Verify ownership
- [ ] GET /api/v1/creatures/templates:
  - [ ] System templates only
  - [ ] Cached response
- [ ] POST /api/v1/creatures/:id/clone:
  - [ ] Copy as custom
  - [ ] Allow modifications
```

**Advanced Search API**:
```typescript
// GET /api/v1/creatures with filters
{
  "query": "dragon",
  "cr": {
    "min": 5,
    "max": 15
  },
  "type": ["dragon", "beast"],
  "size": ["large", "huge"],
  "source": "system",
  "page": 1,
  "limit": 20,
  "sort": "cr_asc"
}

// Response with search metadata
{
  "success": true,
  "data": {
    "creatures": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "filters": {
      "appliedFilters": {
        "query": "dragon",
        "cr": { "min": 5, "max": 15 }
      },
      "availableFilters": {
        "types": ["beast", "dragon", "humanoid"],
        "crRange": { "min": 0, "max": 30 },
        "sizes": ["tiny", "small", "medium", "large", "huge", "gargantuan"]
      }
    }
  }
}
```

---

### Issue #63: Create Encounter Service
**Labels**: `P1`, `M5-Encounter`, `MVP`, `api`, `ai-ready`  
**Depends on**: #61  
**Description**: Implement encounter business logic

**Acceptance Criteria**:
```
- [ ] Create encounter.service.ts:
  - [ ] createEncounter(userId, data):
    - [ ] Initialize combat state
    - [ ] Add participants
    - [ ] Set to planning status
  - [ ] getUserEncounters(userId, filters):
    - [ ] Filter by status
    - [ ] Pagination
    - [ ] Include summary
  - [ ] getEncounterById(userId, id):
    - [ ] Full details
    - [ ] Populate references
    - [ ] Verify ownership
  - [ ] updateEncounter(userId, id, data):
    - [ ] Partial updates
    - [ ] Validate state
  - [ ] deleteEncounter(userId, id):
    - [ ] Soft delete
    - [ ] Archive data
- [ ] Participant management:
  - [ ] addParticipant(encounterId, data)
  - [ ] updateParticipant(encounterId, participantId, data)
  - [ ] removeParticipant(encounterId, participantId)
  - [ ] Support character/creature types
- [ ] Combat state methods:
  - [ ] initializeCombat()
  - [ ] rollInitiatives()
  - [ ] sortByInitiative()
  - [ ] validateCombatState()
```

**Encounter Difficulty Calculation**:
```typescript
class EncounterService {
  calculateDifficulty(party: Character[], creatures: Creature[]): EncounterDifficulty {
    const partyLevel = this.getAveragePartyLevel(party);
    const partySize = party.length;
    
    // Calculate total XP
    const creatureXP = creatures.reduce((total, creature) => {
      return total + this.getCreatureXP(creature.challengeRating);
    }, 0);
    
    // Apply multiplier for multiple enemies
    const multiplier = this.getEncounterMultiplier(creatures.length);
    const adjustedXP = creatureXP * multiplier;
    
    // Get thresholds for party
    const thresholds = this.getEncounterThresholds(partyLevel, partySize);
    
    return {
      totalXP: creatureXP,
      adjustedXP,
      difficulty: this.getDifficultyRating(adjustedXP, thresholds),
      xpPerCharacter: Math.floor(creatureXP / partySize),
      thresholds
    };
  }
  
  private getDifficultyRating(xp: number, thresholds: EncounterThresholds): DifficultyRating {
    if (xp < thresholds.easy) return 'trivial';
    if (xp < thresholds.medium) return 'easy';
    if (xp < thresholds.hard) return 'medium';
    if (xp < thresholds.deadly) return 'hard';
    return 'deadly';
  }
}
```

---

### Issue #64: Implement Encounter Endpoints
**Labels**: `P1`, `M5-Encounter`, `MVP`, `api`, `ai-ready`  
**Depends on**: #63, #33  
**Description**: Create encounter REST API

**Acceptance Criteria**:
```
- [ ] GET /api/v1/encounters:
  - [ ] User's encounters only
  - [ ] Filter by status
  - [ ] Pagination
  - [ ] Sort by updated
- [ ] POST /api/v1/encounters:
  - [ ] Create with name
  - [ ] Optional description
  - [ ] Initialize empty
- [ ] GET /api/v1/encounters/:id:
  - [ ] Full encounter data
  - [ ] Populated participants
  - [ ] Combat state
- [ ] PUT /api/v1/encounters/:id:
  - [ ] Update metadata
  - [ ] Change status
  - [ ] Validate transitions
- [ ] DELETE /api/v1/encounters/:id:
  - [ ] Soft delete
  - [ ] Keep for history
- [ ] POST /api/v1/encounters/:id/start:
  - [ ] Start combat
  - [ ] Roll initiatives
  - [ ] Set round 1
- [ ] POST /api/v1/encounters/:id/end:
  - [ ] End combat
  - [ ] Save final state
  - [ ] Generate summary
```

**Encounter State Management**:
```typescript
interface EncounterState {
  status: 'planning' | 'active' | 'paused' | 'completed';
  combatState: {
    round: number;
    turn: number;
    isActive: boolean;
    initiativeOrder: number[]; // participant indices
  };
  participants: CombatParticipant[];
}

// State transition validation
const VALID_TRANSITIONS = {
  planning: ['active', 'completed'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: [] // terminal state
};
```

---

### Issue #65: Build Encounter List Page
**Labels**: `P1`, `M5-Encounter`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #64  
**Description**: Create encounter management UI

**Acceptance Criteria**:
```
- [ ] Create EncounterListPage:
  - [ ] Encounter cards showing:
    - [ ] Name and description
    - [ ] Status badge
    - [ ] Participant count
    - [ ] Last modified
  - [ ] Status filter tabs:
    - [ ] All
    - [ ] Planning
    - [ ] Active
    - [ ] Completed
  - [ ] Search by name
  - [ ] Sort options
- [ ] Quick actions:
  - [ ] Start combat
  - [ ] Edit encounter
  - [ ] Clone encounter
  - [ ] Delete
- [ ] Create button:
  - [ ] Prominent placement
  - [ ] Quick create option
- [ ] Empty states:
  - [ ] No encounters
  - [ ] No results
- [ ] Loading states:
  - [ ] Skeleton loading
  - [ ] Pagination
```

**UI Component Structure**:
```typescript
const EncounterListPage = () => {
  const [statusFilter, setStatusFilter] = useState<EncounterStatus>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  
  const { data: encounters, isLoading } = useEncounters({
    status: statusFilter,
    search,
    sortBy,
    page: 1,
    limit: 20
  });
  
  return (
    <div className="encounter-list-page">
      <PageHeader title="Encounters" />
      <EncounterFilters 
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <EncounterGrid encounters={encounters} />
      <CreateEncounterButton />
    </div>
  );
};

const EncounterCard = ({ encounter }: { encounter: Encounter }) => (
  <div className="encounter-card">
    <div className="encounter-header">
      <h3>{encounter.name}</h3>
      <StatusBadge status={encounter.status} />
    </div>
    <div className="encounter-meta">
      <ParticipantCount count={encounter.participants.length} />
      <LastModified date={encounter.updatedAt} />
    </div>
    <div className="encounter-actions">
      <Button onClick={() => startCombat(encounter.id)}>
        {encounter.status === 'planning' ? 'Start Combat' : 'Continue'}
      </Button>
      <DropdownMenu>
        <MenuItem onClick={() => editEncounter(encounter.id)}>Edit</MenuItem>
        <MenuItem onClick={() => cloneEncounter(encounter.id)}>Clone</MenuItem>
        <MenuItem onClick={() => deleteEncounter(encounter.id)}>Delete</MenuItem>
      </DropdownMenu>
    </div>
  </div>
);
```

---

### Issue #66: Create Encounter Builder
**Labels**: `P1`, `M5-Encounter`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #65  
**Description**: Build encounter creation interface

**Acceptance Criteria**:
```
- [ ] Create EncounterBuilder:
  - [ ] Step 1: Basic info
    - [ ] Name (required)
    - [ ] Description
    - [ ] Environment type
  - [ ] Step 2: Add party
    - [ ] Select from user's parties
    - [ ] Show party composition
    - [ ] Add individual characters
  - [ ] Step 3: Add creatures
    - [ ] Search creatures
    - [ ] Filter by CR
    - [ ] Add multiple
    - [ ] Set quantity
  - [ ] Initiative preview:
    - [ ] Show all participants
    - [ ] Drag to reorder
    - [ ] Set initiatives
- [ ] Difficulty calculation:
  - [ ] Show encounter XP
  - [ ] Difficulty rating
  - [ ] XP per character
  - [ ] Threshold indicators
- [ ] Save options:
  - [ ] Save and continue
  - [ ] Save and start combat
  - [ ] Save as template
```

**Encounter Builder Flow**:
```typescript
const EncounterBuilder = () => {
  const [step, setStep] = useState(1);
  const [encounter, setEncounter] = useState<PartialEncounter>({
    name: '',
    description: '',
    participants: []
  });
  
  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Add Party', component: PartySelectionStep },
    { id: 3, title: 'Add Creatures', component: CreatureSelectionStep },
    { id: 4, title: 'Review', component: ReviewStep }
  ];
  
  return (
    <div className="encounter-builder">
      <ProgressIndicator steps={steps} currentStep={step} />
      <StepContent 
        step={step}
        encounter={encounter}
        onEncounterChange={setEncounter}
        onNext={() => setStep(step + 1)}
        onPrev={() => setStep(step - 1)}
      />
      <DifficultyCalculator participants={encounter.participants} />
    </div>
  );
};

const DifficultyCalculator = ({ participants }: Props) => {
  const difficulty = useMemo(() => {
    const party = participants.filter(p => p.type === 'character');
    const creatures = participants.filter(p => p.type === 'creature');
    return calculateEncounterDifficulty(party, creatures);
  }, [participants]);
  
  return (
    <div className="difficulty-calculator">
      <h3>Encounter Difficulty</h3>
      <div className="difficulty-rating">
        <DifficultyBadge level={difficulty.rating} />
        <span>{difficulty.rating}</span>
      </div>
      <div className="xp-breakdown">
        <div>Total XP: {difficulty.totalXP}</div>
        <div>Adjusted XP: {difficulty.adjustedXP}</div>
        <div>XP per Character: {difficulty.xpPerCharacter}</div>
      </div>
      <DifficultyThresholds thresholds={difficulty.thresholds} current={difficulty.adjustedXP} />
    </div>
  );
};
```

---

### Issue #67: Build Creature Search Component
**Labels**: `P1`, `M5-Encounter`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #62  
**Description**: Create creature search and filter UI

**Acceptance Criteria**:
```
- [ ] Create CreatureSearch:
  - [ ] Search input with debounce
  - [ ] Filter panel:
    - [ ] CR range slider
    - [ ] Type checkboxes
    - [ ] Size options
    - [ ] Source (system/custom)
  - [ ] Results display:
    - [ ] Creature cards
    - [ ] Key stats shown
    - [ ] Expand for details
  - [ ] Infinite scroll
  - [ ] Loading states
- [ ] Creature card shows:
  - [ ] Name and type
  - [ ] CR and XP
  - [ ] HP and AC
  - [ ] Preview actions
  - [ ] Add button
- [ ] Quick add features:
  - [ ] Add with quantity
  - [ ] Add and continue
  - [ ] Keyboard shortcuts
- [ ] Mobile optimization:
  - [ ] Collapsible filters
  - [ ] Touch-friendly
```

**Search Component Implementation**:
```typescript
const CreatureSearch = ({ onSelect }: { onSelect: (creature: Creature) => void }) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CreatureFilters>({
    cr: { min: 0, max: 30 },
    types: [],
    sizes: [],
    source: 'all'
  });
  
  const debouncedSearch = useDebounce(search, 300);
  
  const { data, isLoading, fetchNextPage } = useInfiniteCreatures({
    search: debouncedSearch,
    filters
  });
  
  return (
    <div className="creature-search">
      <SearchInput 
        value={search}
        onChange={setSearch}
        placeholder="Search creatures..."
      />
      <FilterPanel filters={filters} onFiltersChange={setFilters} />
      <CreatureResults 
        creatures={data?.pages.flatMap(page => page.creatures) || []}
        onSelect={onSelect}
        onLoadMore={fetchNextPage}
        isLoading={isLoading}
      />
    </div>
  );
};

const CreatureCard = ({ creature, onSelect }: Props) => (
  <div className="creature-card">
    <div className="creature-header">
      <h4>{creature.name}</h4>
      <div className="creature-meta">
        <span className="cr">CR {creature.challengeRating}</span>
        <span className="type">{creature.type}</span>
      </div>
    </div>
    <div className="creature-stats">
      <StatBlock label="AC" value={creature.ac} />
      <StatBlock label="HP" value={creature.hp} />
      <StatBlock label="Speed" value={creature.speed.walk} />
    </div>
    <div className="creature-actions">
      <Button onClick={() => onSelect(creature, 1)}>Add 1</Button>
      <Button onClick={() => onSelect(creature, 2)}>Add 2</Button>
      <QuantitySelector onSelect={(qty) => onSelect(creature, qty)} />
    </div>
  </div>
);
```

---

### Issue #68: Implement Encounter Templates
**Labels**: `P2`, `M5-Encounter`, `MVP`, `api`, `frontend`, `ai-ready`  
**Depends on**: #63  
**Description**: Add encounter template functionality

**Acceptance Criteria**:
```
- [ ] Create template data:
  - [ ] "Goblin Ambush" (low level)
  - [ ] "Undead Crypt" (medium)
  - [ ] "Dragon's Lair" (high)
  - [ ] "Bar Fight" (social)
- [ ] Template features:
  - [ ] Suggested party level
  - [ ] Environment notes
  - [ ] Tactical tips
  - [ ] Treasure suggestions
- [ ] API endpoints:
  - [ ] GET /api/v1/encounters/templates
  - [ ] POST /api/v1/encounters/from-template
- [ ] UI integration:
  - [ ] Template browser
  - [ ] Preview before use
  - [ ] Customize after creation
```

**Encounter Templates**:
```typescript
const ENCOUNTER_TEMPLATES = {
  goblinAmbush: {
    name: "Goblin Ambush",
    description: "A classic low-level encounter for new adventurers",
    suggestedLevel: 1,
    environment: "Forest road",
    creatures: [
      { templateId: "goblin", quantity: 4 },
      { templateId: "goblin-boss", quantity: 1 }
    ],
    tactics: "Goblins hide behind trees and attack with ranged weapons first",
    treasure: "2d6 copper pieces, leather armor",
    difficulty: "medium"
  },
  dragonLair: {
    name: "Dragon's Lair",
    description: "An epic high-level encounter with environmental hazards",
    suggestedLevel: 15,
    environment: "Volcanic cavern",
    creatures: [
      { templateId: "adult-red-dragon", quantity: 1 }
    ],
    lairActions: [
      "Magma erupts from the ground",
      "Rocks fall from the ceiling",
      "Toxic gases fill the chamber"
    ],
    tactics: "Dragon uses breath weapon, then flies and uses lair actions",
    treasure: "Dragon hoard (see DMG page 133)"
  }
};
```

## Data Management & Performance

### Search Optimization
- **Text Search**: MongoDB text indexes on creature names and tags
- **Filter Performance**: Compound indexes for common filter combinations
- **Caching**: Redis cache for system templates and search results
- **Pagination**: Cursor-based pagination for large result sets

### Encounter Building UX
- **Progressive Enhancement**: Start simple, add complexity
- **Real-time Feedback**: Immediate difficulty calculations
- **Quick Actions**: One-click creature additions
- **Undo/Redo**: State management for encounter building

## Success Criteria

By Mid Week 3, the encounter system should have:

1. **Complete Creature Database**:
   - 50+ SRD creatures with full stat blocks
   - Advanced search and filtering capabilities
   - Custom creature creation and management

2. **Encounter Builder**:
   - Step-by-step encounter creation
   - Party integration from previous milestone
   - Real-time difficulty calculations
   - Template system for quick setup

3. **Management Interface**:
   - Encounter list with status tracking
   - Quick actions for starting combat
   - Search and filtering capabilities

4. **API Foundation**:
   - RESTful endpoints for all operations
   - Proper state management and validation
   - Ready for combat tracker integration

**Next Step**: Move to Milestone 6 (Combat Tracker Core) to implement the actual combat management system.
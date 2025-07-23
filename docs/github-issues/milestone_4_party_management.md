# Milestone 4: Party Management (Week 2-3)

**Due Date**: Mid Week 3  
**Goal**: Complete party and character management functionality

## Overview

This milestone implements the core party and character management system, allowing users to create parties, add characters with full D&D 5e stats, and manage their adventuring groups. This includes character creation forms, D&D Beyond import, and party templates for quick setup.

## Issues for Milestone 4

### Issue #46: Create Party Service Layer
**Labels**: `P1`, `M4-Party`, `MVP`, `api`, `ai-ready`  
**Depends on**: #31  
**Description**: Implement party business logic service

**Acceptance Criteria**:
```
- [ ] Create services/party.service.ts:
  - [ ] createParty(userId, data):
    - [ ] Validate party limit by tier
    - [ ] Create with default values
    - [ ] Return created party
  - [ ] getUserParties(userId, options):
    - [ ] Support pagination
    - [ ] Filter archived/active
    - [ ] Sort by updated date
  - [ ] getPartyById(userId, partyId):
    - [ ] Verify ownership
    - [ ] Include characters
    - [ ] Handle not found
  - [ ] updateParty(userId, partyId, data):
    - [ ] Partial updates
    - [ ] Update timestamp
    - [ ] Validate ownership
  - [ ] deleteParty(userId, partyId):
    - [ ] Soft delete only
    - [ ] Set isArchived flag
    - [ ] Keep for recovery
- [ ] Implement business rules:
  - [ ] Free tier: 2 parties max
  - [ ] Seasoned: 5 parties
  - [ ] Expert: 10 parties
  - [ ] Master: 25 parties
  - [ ] Guild: unlimited
- [ ] Add character management:
  - [ ] addCharacter method
  - [ ] updateCharacter method
  - [ ] removeCharacter method
  - [ ] Max 10 characters per party
- [ ] Create comprehensive tests
```

**Technical Implementation**:
```typescript
// Party service example
class PartyService {
  async createParty(userId: string, data: CreatePartyDTO): Promise<Party> {
    // Check tier limits
    const user = await User.findById(userId);
    const partyCount = await Party.countDocuments({ userId, isArchived: false });
    const limit = SUBSCRIPTION_LIMITS[user.subscription.tier].parties;
    
    if (partyCount >= limit) {
      throw new Error('Party limit reached for subscription tier');
    }
    
    const party = new Party({
      userId,
      name: data.name,
      description: data.description,
      characters: [],
      isArchived: false
    });
    
    return await party.save();
  }
}
```

---

### Issue #47: Implement Party CRUD Endpoints
**Labels**: `P1`, `M4-Party`, `MVP`, `api`, `ai-ready`  
**Depends on**: #46, #33  
**Description**: Create all party REST endpoints

**Acceptance Criteria**:
```
- [ ] GET /api/v1/parties:
  - [ ] Pagination: page, limit
  - [ ] Filter: archived status
  - [ ] Sort: name, updated
  - [ ] Return user's parties only
- [ ] POST /api/v1/parties:
  - [ ] Validate input with Joi
  - [ ] Check party limits
  - [ ] Create and return party
- [ ] GET /api/v1/parties/:id:
  - [ ] Include characters
  - [ ] Verify ownership
  - [ ] 404 if not found
- [ ] PUT /api/v1/parties/:id:
  - [ ] Partial updates
  - [ ] Validate changes
  - [ ] Update modified timestamp
- [ ] DELETE /api/v1/parties/:id:
  - [ ] Soft delete only
  - [ ] Return success
- [ ] POST /api/v1/parties/:id/archive:
  - [ ] Toggle archive status
  - [ ] Return updated party
- [ ] Add Swagger documentation
- [ ] Create integration tests
```

**API Response Format**:
```typescript
// GET /api/v1/parties response
{
  "success": true,
  "data": {
    "parties": [
      {
        "id": "party123",
        "name": "Adventuring Party",
        "description": "A group of brave heroes",
        "characterCount": 4,
        "isArchived": false,
        "createdAt": "2025-01-20T10:00:00Z",
        "updatedAt": "2025-01-22T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### Issue #48: Create Character Management Endpoints
**Labels**: `P1`, `M4-Party`, `MVP`, `api`, `ai-ready`  
**Depends on**: #47  
**Description**: Implement character sub-resource endpoints

**Acceptance Criteria**:
```
- [ ] POST /api/v1/parties/:partyId/characters:
  - [ ] Validate character data
  - [ ] Check character limit (10)
  - [ ] Calculate derived stats
  - [ ] Add to party
- [ ] PUT /api/v1/parties/:partyId/characters/:characterId:
  - [ ] Update character data
  - [ ] Recalculate stats
  - [ ] Validate changes
- [ ] DELETE /api/v1/parties/:partyId/characters/:characterId:
  - [ ] Remove from party
  - [ ] Update party modified
- [ ] PATCH /api/v1/parties/:partyId/characters/reorder:
  - [ ] Update character order
  - [ ] Validate new positions
- [ ] Add validation schemas:
  - [ ] Character creation
  - [ ] Character update
  - [ ] Stat calculations
```

**Character Validation Schema**:
```typescript
const characterSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  playerName: Joi.string().max(50).optional(),
  race: Joi.string().required(),
  classes: Joi.array().items(
    Joi.object({
      className: Joi.string().required(),
      level: Joi.number().min(1).max(20).required()
    })
  ).min(1).required(),
  abilities: Joi.object({
    strength: Joi.number().min(1).max(30).required(),
    dexterity: Joi.number().min(1).max(30).required(),
    constitution: Joi.number().min(1).max(30).required(),
    intelligence: Joi.number().min(1).max(30).required(),
    wisdom: Joi.number().min(1).max(30).required(),
    charisma: Joi.number().min(1).max(30).required()
  }).required(),
  maxHp: Joi.number().min(1).required(),
  currentHp: Joi.number().min(0).required(),
  ac: Joi.number().min(0).max(30).required()
});
```

---

### Issue #49: Build Party List Page
**Labels**: `P1`, `M4-Party`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #40  
**Description**: Create React page for party listing

**Acceptance Criteria**:
```
- [ ] Create PartyListPage component:
  - [ ] Grid/list view toggle
  - [ ] Party cards with:
    - [ ] Name and description
    - [ ] Character count
    - [ ] Last modified
    - [ ] Quick actions
- [ ] Add filtering:
  - [ ] Active/archived toggle
  - [ ] Search by name
  - [ ] Sort options
- [ ] Implement pagination:
  - [ ] Load more button
  - [ ] Show total count
- [ ] Add actions:
  - [ ] Create party button
  - [ ] Edit/view party
  - [ ] Archive/restore
  - [ ] Delete (with confirmation)
- [ ] Handle empty states:
  - [ ] No parties message
  - [ ] Create first party CTA
- [ ] Add loading states:
  - [ ] Skeleton cards
  - [ ] Loading spinner
- [ ] Make responsive:
  - [ ] Mobile card layout
  - [ ] Touch-friendly actions
```

**Component Structure**:
```typescript
const PartyListPage = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  
  const { data: parties, isLoading } = useParties({
    filter,
    search,
    page: 1,
    limit: 20
  });
  
  return (
    <div className="party-list-page">
      <PageHeader title="Parties" />
      <PartyFilters 
        view={view} 
        onViewChange={setView}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      />
      <PartyGrid parties={parties} view={view} />
      <CreatePartyButton />
    </div>
  );
};
```

---

### Issue #50: Create Party Detail Page
**Labels**: `P1`, `M4-Party`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #49  
**Description**: Build party detail view with character management

**Acceptance Criteria**:
```
- [ ] Create PartyDetailPage component:
  - [ ] Party header with name/description
  - [ ] Edit mode toggle
  - [ ] Character list/grid
  - [ ] Stats summary
- [ ] Character display:
  - [ ] Character cards with:
    - [ ] Name, race, class
    - [ ] Level and HP
    - [ ] AC and key stats
    - [ ] Quick edit button
  - [ ] Drag to reorder
  - [ ] Expand for details
- [ ] Add character button:
  - [ ] Modal or slide-out
  - [ ] Link to character form
- [ ] Edit capabilities:
  - [ ] Inline name/description edit
  - [ ] Save/cancel buttons
  - [ ] Validation feedback
- [ ] Actions menu:
  - [ ] Archive party
  - [ ] Export party
  - [ ] Delete party
- [ ] Breadcrumb navigation
```

---

### Issue #51: Build Character Form Components
**Labels**: `P1`, `M4-Party`, `MVP`, `frontend`, `ai-ready`  
**Depends on**: #50  
**Description**: Create character creation and edit forms

**Acceptance Criteria**:
```
- [ ] Create CharacterForm component:
  - [ ] Basic info section:
    - [ ] Name (required)
    - [ ] Player name
    - [ ] Race dropdown
    - [ ] Class multi-select with levels
  - [ ] Ability scores:
    - [ ] STR, DEX, CON, INT, WIS, CHA
    - [ ] Point buy calculator
    - [ ] Modifier display
  - [ ] Combat stats:
    - [ ] HP (current/max)
    - [ ] AC calculation
    - [ ] Initiative bonus
    - [ ] Speed
  - [ ] Additional fields:
    - [ ] Hit dice
    - [ ] Proficiency bonus
    - [ ] Features text area
    - [ ] Equipment text area
- [ ] Add validation:
  - [ ] Required fields
  - [ ] Stat ranges (1-30)
  - [ ] Level limits (1-20)
- [ ] Implement calculations:
  - [ ] Ability modifiers
  - [ ] Proficiency by level
  - [ ] Initiative from DEX
- [ ] Create character preview:
  - [ ] Show as character card
  - [ ] Update in real-time
- [ ] Form modes:
  - [ ] Create new
  - [ ] Edit existing
  - [ ] Quick edit (subset)
```

**D&D 5e Calculations**:
```typescript
// Ability modifier calculation
const getModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

// Proficiency bonus by total level
const getProficiencyBonus = (level: number): number => {
  return Math.ceil(level / 4) + 1;
};

// Initiative bonus
const getInitiativeBonus = (dexterity: number): number => {
  return getModifier(dexterity);
};

// Auto-calculate derived stats
const calculateDerivedStats = (character: Character) => {
  const totalLevel = character.classes.reduce((sum, cls) => sum + cls.level, 0);
  
  return {
    ...character,
    level: totalLevel,
    proficiencyBonus: getProficiencyBonus(totalLevel),
    initiativeBonus: getInitiativeBonus(character.abilities.dexterity),
    abilities: {
      ...character.abilities,
      strengthModifier: getModifier(character.abilities.strength),
      dexterityModifier: getModifier(character.abilities.dexterity),
      // ... other modifiers
    }
  };
};
```

---

### Issue #52: Implement D&D Beyond Import
**Labels**: `P2`, `M4-Party`, `MVP`, `api`, `frontend`, `ai-ready`  
**Depends on**: #48, #51  
**Description**: Add character import functionality from D&D Beyond

**Acceptance Criteria**:
```
- [ ] Create import parser:
  - [ ] Parse D&D Beyond JSON format
  - [ ] Map to our character schema
  - [ ] Handle missing fields
  - [ ] Calculate derived stats
- [ ] Create import endpoint:
  - [ ] POST /api/v1/import/character
  - [ ] Accept JSON data
  - [ ] Validate and transform
  - [ ] Return character object
- [ ] Build import UI:
  - [ ] Import button on character form
  - [ ] Instructions modal
  - [ ] Paste JSON textarea
  - [ ] Preview imported data
  - [ ] Confirm/cancel import
- [ ] Handle edge cases:
  - [ ] Invalid JSON
  - [ ] Missing required fields
  - [ ] Unsupported content
  - [ ] Multiclass characters
- [ ] Add import documentation:
  - [ ] How to export from D&D Beyond
  - [ ] Supported fields
  - [ ] Known limitations
```

**Import Parser Example**:
```typescript
class DNDBeyondImporter {
  parseCharacter(dndbData: any): Character {
    return {
      name: dndbData.name,
      race: dndbData.race?.fullName || 'Unknown',
      classes: dndbData.classes?.map(cls => ({
        className: cls.definition?.name,
        level: cls.level
      })) || [],
      abilities: {
        strength: this.getAbilityScore(dndbData, 'strength'),
        dexterity: this.getAbilityScore(dndbData, 'dexterity'),
        constitution: this.getAbilityScore(dndbData, 'constitution'),
        intelligence: this.getAbilityScore(dndbData, 'intelligence'),
        wisdom: this.getAbilityScore(dndbData, 'wisdom'),
        charisma: this.getAbilityScore(dndbData, 'charisma')
      },
      maxHp: dndbData.baseHitPoints + dndbData.bonusHitPoints,
      currentHp: dndbData.removedHitPoints ? 
        dndbData.baseHitPoints + dndbData.bonusHitPoints - dndbData.removedHitPoints :
        dndbData.baseHitPoints + dndbData.bonusHitPoints,
      ac: dndbData.armorClass || 10
    };
  }
}
```

---

### Issue #53: Create Party Templates
**Labels**: `P3`, `M4-Party`, `MVP`, `frontend`, `api`, `ai-ready`  
**Depends on**: #47  
**Description**: Add party template functionality for quick setup

**Acceptance Criteria**:
```
- [ ] Create template data:
  - [ ] "Classic Adventure Party" (Fighter, Cleric, Wizard, Rogue)
  - [ ] "Dungeon Delvers" (heavy combat focus)
  - [ ] "Social Encounters" (face characters)
  - [ ] "New Players" (simple builds)
- [ ] Add template endpoint:
  - [ ] GET /api/v1/parties/templates
  - [ ] Return available templates
- [ ] Create template UI:
  - [ ] Template selection modal
  - [ ] Preview party composition
  - [ ] Customize before creating
  - [ ] One-click party creation
- [ ] Allow customization:
  - [ ] Change character names
  - [ ] Adjust levels
  - [ ] Modify stats
```

**Template Examples**:
```typescript
const PARTY_TEMPLATES = {
  classicAdventure: {
    name: "Classic Adventure Party",
    description: "A balanced party for general adventures",
    characters: [
      {
        name: "Fighter",
        race: "Human",
        classes: [{ className: "Fighter", level: 3 }],
        abilities: { strength: 16, dexterity: 13, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 }
      },
      {
        name: "Cleric", 
        race: "Dwarf",
        classes: [{ className: "Cleric", level: 3 }],
        abilities: { strength: 13, dexterity: 8, constitution: 14, intelligence: 10, wisdom: 16, charisma: 12 }
      }
      // ... more characters
    ]
  }
};
```

## Data Management Strategy

### Party Limits by Tier
```typescript
const PARTY_LIMITS = {
  free: 2,
  seasoned: 5,
  expert: 10,
  master: 25,
  guild: -1 // unlimited
};
```

### Character Management
- **Maximum Characters per Party**: 10
- **Character Data Validation**: Full D&D 5e stat validation
- **Soft Delete**: Archived parties maintained for recovery
- **Import Support**: D&D Beyond JSON format

## Success Criteria

By Mid Week 3, the party management system should have:

1. **Complete CRUD Operations**:
   - Create, read, update, delete parties
   - Character management within parties
   - Proper ownership validation

2. **User Interface**:
   - Party list with filtering/search
   - Party detail view with character cards
   - Character creation/edit forms
   - D&D Beyond import functionality

3. **Business Logic**:
   - Subscription tier limits enforced
   - D&D 5e calculations implemented
   - Data validation and error handling

4. **Templates and Import**:
   - Pre-built party templates
   - Character import from D&D Beyond
   - Easy party setup for new users

**Next Step**: Move to Milestone 5 (Encounter System) to build the encounter and creature management system.
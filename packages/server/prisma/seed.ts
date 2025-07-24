import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create system creature templates (userId = null)
  const creatures = [
    {
      name: 'Goblin',
      size: 'SMALL' as const,
      type: 'humanoid',
      subtype: 'goblinoid',
      alignment: 'Neutral Evil',
      ac: 15,
      hp: 7,
      hitDice: '2d6',
      speed: { walk: 30 },
      abilities: {
        str: 8,
        dex: 14,
        con: 10,
        int: 10,
        wis: 8,
        cha: 8
      },
      challengeRating: '1/4',
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Nimble Escape',
          description: 'The goblin can take the Disengage or Hide action as a bonus action on each of its turns.'
        }
      ],
      actions: [
        {
          name: 'Scimitar',
          description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.'
        },
        {
          name: 'Shortbow',
          description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.'
        }
      ],
      reactions: [],
      lairActions: [],
      source: 'Monster Manual',
      tags: ['basic', 'low-level', 'humanoid']
    },
    {
      name: 'Orc',
      size: 'MEDIUM' as const,
      type: 'humanoid',
      subtype: 'orc',
      alignment: 'Chaotic Evil',
      ac: 13,
      hp: 15,
      hitDice: '2d8+2',
      speed: { walk: 30 },
      abilities: {
        str: 16,
        dex: 12,
        con: 13,
        int: 7,
        wis: 11,
        cha: 10
      },
      challengeRating: '1/2',
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Aggressive',
          description: 'As a bonus action, the orc can move up to its speed toward a hostile creature that it can see.'
        }
      ],
      actions: [
        {
          name: 'Greataxe',
          description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 9 (1d12 + 3) slashing damage.'
        },
        {
          name: 'Javelin',
          description: 'Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 30/120 ft., one target. Hit: 6 (1d6 + 3) piercing damage.'
        }
      ],
      reactions: [],
      lairActions: [],
      source: 'Monster Manual',
      tags: ['basic', 'medium-level', 'humanoid']
    },
    {
      name: 'Brown Bear',
      size: 'LARGE' as const,
      type: 'beast',
      alignment: 'Unaligned',
      ac: 11,
      hp: 34,
      hitDice: '4d10+8',
      speed: { walk: 40, climb: 30 },
      abilities: {
        str: 19,
        dex: 10,
        con: 14,
        int: 2,
        wis: 13,
        cha: 7
      },
      challengeRating: '1',
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Keen Smell',
          description: 'The bear has advantage on Wisdom (Perception) checks that rely on smell.'
        }
      ],
      actions: [
        {
          name: 'Multiattack',
          description: 'The bear makes two attacks: one with its bite and one with its claws.'
        },
        {
          name: 'Bite',
          description: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.'
        },
        {
          name: 'Claws',
          description: 'Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 11 (2d6 + 4) slashing damage.'
        }
      ],
      reactions: [],
      lairActions: [],
      source: 'Monster Manual',
      tags: ['beast', 'animal', 'wilderness']
    },
    {
      name: 'Skeleton',
      size: 'MEDIUM' as const,
      type: 'undead',
      alignment: 'Lawful Evil',
      ac: 13,
      hp: 13,
      hitDice: '2d8+2',
      speed: { walk: 30 },
      abilities: {
        str: 10,
        dex: 14,
        con: 12,
        int: 6,
        wis: 8,
        cha: 5
      },
      challengeRating: '1/4',
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Damage Vulnerabilities',
          description: 'Bludgeoning'
        },
        {
          name: 'Damage Immunities',
          description: 'Poison'
        },
        {
          name: 'Condition Immunities',
          description: 'Exhaustion, poisoned'
        }
      ],
      actions: [
        {
          name: 'Shortsword',
          description: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.'
        },
        {
          name: 'Shortbow',
          description: 'Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.'
        }
      ],
      reactions: [],
      lairActions: [],
      source: 'Monster Manual',
      tags: ['undead', 'basic', 'minion']
    },
    {
      name: 'Dire Wolf',
      size: 'LARGE' as const,
      type: 'beast',
      alignment: 'Unaligned',
      ac: 14,
      hp: 37,
      hitDice: '5d10+10',
      speed: { walk: 50 },
      abilities: {
        str: 17,
        dex: 15,
        con: 15,
        int: 3,
        wis: 12,
        cha: 7
      },
      challengeRating: '1',
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Keen Hearing and Smell',
          description: 'The wolf has advantage on Wisdom (Perception) checks that rely on hearing or smell.'
        },
        {
          name: 'Pack Tactics',
          description: 'The wolf has advantage on attack rolls against a creature if at least one of the wolf\'s allies is within 5 feet of the creature and the ally isn\'t incapacitated.'
        }
      ],
      actions: [
        {
          name: 'Bite',
          description: 'Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 10 (2d6 + 3) piercing damage. If the target is a creature, it must succeed on a DC 13 Strength saving throw or be knocked prone.'
        }
      ],
      reactions: [],
      lairActions: [],
      source: 'Monster Manual',
      tags: ['beast', 'pack-hunter', 'wilderness']
    },
    {
      name: 'Owlbear',
      size: 'LARGE' as const,
      type: 'monstrosity',
      alignment: 'Unaligned',
      ac: 13,
      hp: 59,
      hitDice: '7d10+21',
      speed: { walk: 40 },
      abilities: {
        str: 20,
        dex: 12,
        con: 17,
        int: 3,
        wis: 12,
        cha: 7
      },
      challengeRating: '3',
      proficiencyBonus: 2,
      traits: [
        {
          name: 'Keen Sight and Smell',
          description: 'The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell.'
        }
      ],
      actions: [
        {
          name: 'Multiattack',
          description: 'The owlbear makes two attacks: one with its beak and one with its claws.'
        },
        {
          name: 'Beak',
          description: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage.'
        },
        {
          name: 'Claws',
          description: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 14 (2d8 + 5) slashing damage.'
        }
      ],
      reactions: [],
      lairActions: [],
      source: 'Monster Manual',
      tags: ['monstrosity', 'forest', 'dangerous']
    },
    {
      name: 'Young Red Dragon',
      size: 'LARGE' as const,
      type: 'dragon',
      alignment: 'Chaotic Evil',
      ac: 18,
      hp: 178,
      hitDice: '17d12+68',
      speed: { walk: 40, climb: 40, fly: 80 },
      abilities: {
        str: 23,
        dex: 10,
        con: 19,
        int: 14,
        wis: 11,
        cha: 19
      },
      challengeRating: '10',
      proficiencyBonus: 4,
      traits: [
        {
          name: 'Damage Immunities',
          description: 'Fire'
        },
        {
          name: 'Legendary Resistance (3/Day)',
          description: 'If the dragon fails a saving throw, it can choose to succeed instead.'
        }
      ],
      actions: [
        {
          name: 'Multiattack',
          description: 'The dragon makes three attacks: one with its bite and two with its claws.'
        },
        {
          name: 'Bite',
          description: 'Melee Weapon Attack: +10 to hit, reach 10 ft., one target. Hit: 17 (2d10 + 6) piercing damage plus 3 (1d6) fire damage.'
        },
        {
          name: 'Claw',
          description: 'Melee Weapon Attack: +10 to hit, reach 5 ft., one target. Hit: 13 (2d6 + 6) slashing damage.'
        },
        {
          name: 'Fire Breath (Recharge 5-6)',
          description: 'The dragon exhales fire in a 30-foot cone. Each creature in that area must make a DC 17 Dexterity saving throw, taking 56 (16d6) fire damage on a failed save, or half as much damage on a successful one.'
        }
      ],
      reactions: [],
      legendaryActions: {
        count: 3,
        actions: [
          {
            name: 'Detect',
            description: 'The dragon makes a Wisdom (Perception) check.'
          },
          {
            name: 'Tail Attack',
            description: 'The dragon makes a tail attack.'
          },
          {
            name: 'Wing Attack (Costs 2 Actions)',
            description: 'The dragon beats its wings. Each creature within 10 feet of the dragon must succeed on a DC 18 Dexterity saving throw or take 13 (2d6 + 6) bludgeoning damage and be knocked prone.'
          }
        ]
      },
      lairActions: [
        {
          name: 'Magma Eruption',
          description: 'Magma erupts from a point on the ground the dragon can see within 120 feet of it, creating a 20-foot-high, 5-foot-radius geyser.'
        }
      ],
      source: 'Monster Manual',
      tags: ['dragon', 'boss', 'fire', 'legendary']
    }
  ];

  console.log('Creating system creature templates...');
  
  for (const creatureData of creatures) {
    try {
      const creature = await prisma.creature.create({
        data: {
          userId: null, // System template
          ...creatureData
        }
      });
      console.log(`✅ Created creature: ${creature.name}`);
    } catch (error) {
      console.error(`❌ Failed to create creature ${creatureData.name}:`, error);
    }
  }

  const totalCreatures = await prisma.creature.count({
    where: { userId: null }
  });

  console.log(`🎉 Seeding completed! Created ${totalCreatures} system creature templates.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
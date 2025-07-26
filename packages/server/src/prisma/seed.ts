import { PrismaClient, SubscriptionTier, CharacterType, EncounterDifficulty, CombatStatus } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@dndtracker.com',
      username: 'demouser',
      passwordHash: await hash('DemoPassword123!'),
      displayName: 'Demo User',
      isEmailVerified: true,
      subscriptionTier: SubscriptionTier.PREMIUM,
      stats: {
        create: {
          charactersCreated: 0,
          partiesCreated: 0,
          encountersCreated: 0,
          combatsRun: 0,
        }
      }
    },
  });

  const dmUser = await prisma.user.create({
    data: {
      email: 'dm@dndtracker.com',
      username: 'dungeonmaster',
      passwordHash: await hash('DMPassword123!'),
      displayName: 'Dungeon Master',
      isEmailVerified: true,
      subscriptionTier: SubscriptionTier.UNLIMITED,
      stats: {
        create: {
          charactersCreated: 0,
          partiesCreated: 0,
          encountersCreated: 0,
          combatsRun: 0,
        }
      }
    },
  });

  console.log('✅ Created sample users');

  // Create sample player characters
  const fighter = await prisma.character.create({
    data: {
      name: 'Sir Roland',
      creatorId: demoUser.id,
      type: CharacterType.PC,
      level: 5,
      race: 'Human',
      background: 'Noble',
      hitPoints: 45,
      maxHitPoints: 45,
      armorClass: 18,
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 13,
      wisdom: 12,
      charisma: 15,
      proficiencyBonus: 3,
      passivePerception: 11,
      initiative: 1,
      equipment: {
        armor: 'Plate Armor',
        weapons: ['Longsword', 'Shield'],
        items: ['Adventuring Gear', 'Noble\'s Pack']
      },
      features: {
        fighterFeatures: ['Fighting Style: Defense', 'Second Wind', 'Action Surge', 'Extra Attack'],
        background: ['Position of Privilege']
      },
      classes: {
        create: [
          {
            className: 'Fighter',
            level: 5,
            subclass: 'Champion'
          }
        ]
      }
    },
  });

  const wizard = await prisma.character.create({
    data: {
      name: 'Elara Moonwhisper',
      creatorId: demoUser.id,
      type: CharacterType.PC,
      level: 5,
      race: 'Elf',
      background: 'Sage',
      hitPoints: 32,
      maxHitPoints: 32,
      armorClass: 12,
      strength: 8,
      dexterity: 14,
      constitution: 13,
      intelligence: 16,
      wisdom: 12,
      charisma: 11,
      proficiencyBonus: 3,
      passivePerception: 11,
      initiative: 2,
      spellSaveDC: 14,
      spellAttackBonus: 6,
      equipment: {
        armor: 'Robes',
        weapons: ['Quarterstaff', 'Dagger'],
        items: ['Spellbook', 'Component Pouch', 'Scholar\'s Pack']
      },
      features: {
        wizardFeatures: ['Spellcasting', 'Arcane Recovery'],
        racialFeatures: ['Darkvision', 'Fey Ancestry', 'Trance'],
        background: ['Researcher']
      },
      classes: {
        create: [
          {
            className: 'Wizard',
            level: 5,
            subclass: 'School of Evocation'
          }
        ]
      },
      spellSlots: {
        create: [
          { level: 1, total: 4, used: 0 },
          { level: 2, total: 3, used: 0 },
          { level: 3, total: 2, used: 0 }
        ]
      }
    },
  });

  const rogue = await prisma.character.create({
    data: {
      name: 'Shadows McKnifey',
      creatorId: demoUser.id,
      type: CharacterType.PC,
      level: 4,
      race: 'Halfling',
      background: 'Criminal',
      hitPoints: 28,
      maxHitPoints: 28,
      armorClass: 14,
      strength: 10,
      dexterity: 17,
      constitution: 12,
      intelligence: 14,
      wisdom: 13,
      charisma: 12,
      proficiencyBonus: 2,
      passivePerception: 13,
      initiative: 3,
      equipment: {
        armor: 'Leather Armor',
        weapons: ['Shortsword', 'Shortbow', 'Thieves\' Tools'],
        items: ['Burglar\'s Pack']
      },
      features: {
        rogueFeatures: ['Expertise', 'Sneak Attack', 'Thieves\' Cant', 'Cunning Action'],
        racialFeatures: ['Lucky', 'Brave', 'Halfling Nimbleness'],
        background: ['Criminal Contact']
      },
      classes: {
        create: [
          {
            className: 'Rogue',
            level: 4,
            subclass: 'Thief'
          }
        ]
      }
    },
  });

  console.log('✅ Created sample player characters');

  // Create sample monsters
  const goblin = await prisma.character.create({
    data: {
      name: 'Goblin',
      creatorId: dmUser.id,
      type: CharacterType.MONSTER,
      level: 1,
      race: 'Goblin',
      hitPoints: 7,
      maxHitPoints: 7,
      armorClass: 15,
      strength: 8,
      dexterity: 14,
      constitution: 10,
      intelligence: 10,
      wisdom: 8,
      charisma: 8,
      proficiencyBonus: 2,
      passivePerception: 9,
      initiative: 2,
      isTemplate: true,
      isPublic: true,
      equipment: {
        armor: 'Leather Armor, Shield',
        weapons: ['Scimitar', 'Shortbow']
      },
      features: {
        traits: ['Nimble Escape'],
        actions: ['Scimitar Attack', 'Shortbow Attack']
      }
    },
  });

  const orc = await prisma.character.create({
    data: {
      name: 'Orc',
      creatorId: dmUser.id,
      type: CharacterType.MONSTER,
      level: 1,
      race: 'Orc',
      hitPoints: 15,
      maxHitPoints: 15,
      armorClass: 13,
      strength: 16,
      dexterity: 12,
      constitution: 16,
      intelligence: 7,
      wisdom: 11,
      charisma: 10,
      proficiencyBonus: 2,
      passivePerception: 10,
      initiative: 1,
      isTemplate: true,
      isPublic: true,
      equipment: {
        armor: 'Hide Armor',
        weapons: ['Greataxe', 'Javelin']
      },
      features: {
        traits: ['Aggressive'],
        actions: ['Greataxe Attack', 'Javelin Attack']
      }
    },
  });

  const youngRedDragon = await prisma.character.create({
    data: {
      name: 'Young Red Dragon',
      creatorId: dmUser.id,
      type: CharacterType.MONSTER,
      level: 10,
      race: 'Dragon',
      hitPoints: 178,
      maxHitPoints: 178,
      armorClass: 18,
      strength: 23,
      dexterity: 10,
      constitution: 21,
      intelligence: 14,
      wisdom: 11,
      charisma: 19,
      proficiencyBonus: 4,
      passivePerception: 18,
      initiative: 0,
      isTemplate: true,
      isPublic: true,
      equipment: {
        naturalWeapons: ['Bite', 'Claws']
      },
      features: {
        traits: ['Legendary Resistance', 'Fire Immunity'],
        actions: ['Multiattack', 'Bite', 'Claw', 'Fire Breath'],
        legendaryActions: ['Detect', 'Tail Attack', 'Wing Attack']
      }
    },
  });

  console.log('✅ Created sample monster templates');
  console.log(`   • Goblin template: ${goblin.id}`);
  console.log(`   • Orc template: ${orc.id}`);
  console.log(`   • Young Red Dragon template: ${youngRedDragon.id}`);

  // Create a sample party
  const adventurers = await prisma.party.create({
    data: {
      name: 'The Brave Adventurers',
      description: 'A group of heroes ready to save the world',
      creatorId: demoUser.id,
      isPublic: false,
      inviteCode: 'HEROES2024',
      members: {
        create: [
          {
            characterId: fighter.id,
            role: 'OWNER'
          },
          {
            characterId: wizard.id,
            role: 'MEMBER'
          },
          {
            characterId: rogue.id,
            role: 'MEMBER'
          }
        ]
      }
    },
  });

  console.log('✅ Created sample party');

  // Create sample encounters
  const goblinAmbush = await prisma.encounter.create({
    data: {
      name: 'Goblin Ambush',
      description: 'A group of goblins attacks the party on the forest road',
      creatorId: dmUser.id,
      partyId: adventurers.id,
      difficulty: EncounterDifficulty.EASY,
      environment: 'Forest Road',
      hasLairActions: false,
      isTemplate: true,
      isPublic: true,
      participants: {
        create: [
          { characterId: goblin.id, creatorId: dmUser.id, position: 0 },
          { characterId: goblin.id, creatorId: dmUser.id, position: 1, customName: 'Goblin Scout' },
          { characterId: goblin.id, creatorId: dmUser.id, position: 2, customName: 'Goblin Leader' }
        ]
      }
    },
  });

  const dragonLair = await prisma.encounter.create({
    data: {
      name: 'Dragon\'s Lair',
      description: 'The heroes face a young red dragon in its volcanic lair',
      creatorId: dmUser.id,
      difficulty: EncounterDifficulty.DEADLY,
      environment: 'Volcanic Cave',
      hasLairActions: true,
      lairInitiative: 20,
      isTemplate: true,
      isPublic: true,
      lairActions: {
        create: [
          {
            name: 'Volcanic Fissure',
            description: 'A fissure opens in the ground, dealing fire damage to creatures in the area',
            initiative: 20
          },
          {
            name: 'Lava Geyser',
            description: 'A geyser of lava erupts from the ground',
            initiative: 10
          }
        ]
      },
      participants: {
        create: [
          { characterId: youngRedDragon.id, creatorId: dmUser.id, position: 0 }
        ]
      }
    },
  });

  console.log('✅ Created sample encounters');
  console.log(`   • Goblin Ambush: ${goblinAmbush.id}`);
  console.log(`   • Dragon Lair: ${dragonLair.id}`);

  // Create a sample combat session
  const combat = await prisma.combat.create({
    data: {
      encounterId: goblinAmbush.id,
      creatorId: dmUser.id,
      name: 'Forest Road Ambush - Session 1',
      status: CombatStatus.COMPLETED,
      currentRound: 3,
      currentTurn: 0,
      initiativeRolled: true,
      startedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      endedAt: new Date(),
      totalRounds: 3,
      duration: 25,
      participants: {
        create: [
          {
            participantId: goblinAmbush.participants[0].id,
            initiative: 15,
            dexterityScore: 14,
            turnOrder: 0,
            currentHp: 0,
            maxHp: 7,
            armorClass: 15,
            isConscious: false,
            isDead: true,
            hasActed: true
          },
          {
            participantId: goblinAmbush.participants[1].id,
            initiative: 12,
            dexterityScore: 14,
            turnOrder: 1,
            currentHp: 0,
            maxHp: 7,
            armorClass: 15,
            isConscious: false,
            isDead: true,
            hasActed: true
          },
          {
            participantId: goblinAmbush.participants[2].id,
            initiative: 8,
            dexterityScore: 14,
            turnOrder: 2,
            currentHp: 0,
            maxHp: 7,
            armorClass: 15,
            isConscious: false,
            isDead: true,
            hasActed: true
          }
        ]
      },
      logs: {
        create: [
          {
            round: 1,
            turn: 0,
            action: 'INITIATIVE_ROLLED',
            details: { message: 'Initiative rolled for all participants' }
          },
          {
            round: 1,
            turn: 0,
            action: 'ATTACK',
            actor: 'Sir Roland',
            target: 'Goblin',
            damage: 8,
            damageType: 'slashing',
            details: { attack: 'longsword', hit: true, damage: 8 }
          },
          {
            round: 1,
            turn: 1,
            action: 'DAMAGE_TAKEN',
            actor: 'Goblin',
            damage: 8,
            details: { newHp: 0, died: true }
          }
        ]
      }
    },
  });

  console.log('✅ Created sample combat session');
  console.log(`   • Combat session: ${combat.id}`);

  // Update user stats
  await prisma.userStats.update({
    where: { userId: demoUser.id },
    data: {
      charactersCreated: 3,
      partiesCreated: 1,
      encountersCreated: 0,
      combatsRun: 0
    }
  });

  await prisma.userStats.update({
    where: { userId: dmUser.id },
    data: {
      charactersCreated: 4,
      partiesCreated: 0,
      encountersCreated: 2,
      combatsRun: 1
    }
  });

  console.log('✅ Updated user statistics');

  console.log('🎉 Database seed completed successfully!');
  console.log('📊 Summary:');
  console.log(`   • Users: ${await prisma.user.count()}`);
  console.log(`   • Characters: ${await prisma.character.count()}`);
  console.log(`   • Parties: ${await prisma.party.count()}`);
  console.log(`   • Encounters: ${await prisma.encounter.count()}`);
  console.log(`   • Combats: ${await prisma.combat.count()}`);
  console.log('\n💡 Demo credentials:');
  console.log('   • Email: demo@dndtracker.com | Password: DemoPassword123!');
  console.log('   • Email: dm@dndtracker.com | Password: DMPassword123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
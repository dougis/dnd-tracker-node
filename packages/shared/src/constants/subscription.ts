import { SubscriptionTier } from '../types/user.js';

export const TIER_LIMITS = {
  [SubscriptionTier.FREE]: {
    encounters: 3,
    characters: 10,
    participantsPerEncounter: 6
  },
  [SubscriptionTier.BASIC]: {
    encounters: 10,
    characters: 25,
    participantsPerEncounter: 8
  },
  [SubscriptionTier.PRO]: {
    encounters: 50,
    characters: 100,
    participantsPerEncounter: 12
  },
  [SubscriptionTier.PREMIUM]: {
    encounters: 200,
    characters: 500,
    participantsPerEncounter: 20
  },
  [SubscriptionTier.ENTERPRISE]: {
    encounters: -1, // unlimited
    characters: -1, // unlimited 
    participantsPerEncounter: 50
  }
};

export const TIER_FEATURES = {
  [SubscriptionTier.FREE]: ['basic_tracking', 'initiative_management'],
  [SubscriptionTier.BASIC]: ['basic_tracking', 'initiative_management', 'character_import'],
  [SubscriptionTier.PRO]: ['basic_tracking', 'initiative_management', 'character_import', 'lair_actions', 'advanced_conditions'],
  [SubscriptionTier.PREMIUM]: ['basic_tracking', 'initiative_management', 'character_import', 'lair_actions', 'advanced_conditions', 'encounter_templates', 'statistics'],
  [SubscriptionTier.ENTERPRISE]: ['basic_tracking', 'initiative_management', 'character_import', 'lair_actions', 'advanced_conditions', 'encounter_templates', 'statistics', 'api_access', 'priority_support']
};
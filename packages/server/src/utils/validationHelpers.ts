import { body } from 'express-validator';

/**
 * Common validation rules for character fields
 */
export const characterValidationRules = {
  partyId: body('partyId')
    .notEmpty()
    .withMessage('Party ID is required')
    .isString()
    .withMessage('Party ID must be a string'),

  name: body('name')
    .notEmpty()
    .withMessage('Character name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Character name must be between 1 and 100 characters'),

  nameOptional: body('name')
    .optional()
    .notEmpty()
    .withMessage('Character name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Character name must be between 1 and 100 characters'),

  playerName: body('playerName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Player name must not exceed 100 characters'),

  race: body('race')
    .notEmpty()
    .withMessage('Character race is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Race must be between 1 and 50 characters'),

  raceOptional: body('race')
    .optional()
    .notEmpty()
    .withMessage('Character race cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Race must be between 1 and 50 characters'),

  classes: body('classes')
    .isArray({ min: 1 })
    .withMessage('Character must have at least one class'),

  classesOptional: body('classes')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Character must have at least one class'),

  className: body('classes.*.className')
    .notEmpty()
    .withMessage('Class name is required'),

  classLevel: body('classes.*.level')
    .isInt({ min: 1, max: 20 })
    .withMessage('Class level must be between 1 and 20'),

  level: body('level')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Character level must be between 1 and 20'),

  ac: body('ac')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('AC must be between 1 and 30'),

  maxHp: body('maxHp')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max HP must be between 1 and 1000'),

  currentHp: body('currentHp')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Current HP must be between 0 and 1000'),

  tempHp: body('tempHp')
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage('Temporary HP must be between 0 and 500'),

  speed: body('speed')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('Speed must be between 0 and 120'),

  abilities: body('abilities')
    .optional()
    .isObject()
    .withMessage('Abilities must be an object'),

  proficiencyBonus: body('proficiencyBonus')
    .optional()
    .isInt({ min: 2, max: 6 })
    .withMessage('Proficiency bonus must be between 2 and 6'),

  features: body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),

  equipment: body('equipment')
    .optional()
    .isArray()
    .withMessage('Equipment must be an array'),

  notes: body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
};

/**
 * Ability score validation rules
 */
export const abilityValidationRules = {
  str: body('abilities.str')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Strength must be between 1 and 30'),

  dex: body('abilities.dex')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Dexterity must be between 1 and 30'),

  con: body('abilities.con')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Constitution must be between 1 and 30'),

  int: body('abilities.int')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Intelligence must be between 1 and 30'),

  wis: body('abilities.wis')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Wisdom must be between 1 and 30'),

  cha: body('abilities.cha')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Charisma must be between 1 and 30')
};

/**
 * Common validation rules for party fields
 */
export const partyValidationRules = {
  name: body('name')
    .notEmpty()
    .withMessage('Party name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Party name must be between 1 and 100 characters'),

  nameOptional: body('name')
    .optional()
    .notEmpty()
    .withMessage('Party name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Party name must be between 1 and 100 characters'),

  description: body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),

  isArchived: body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean')
};

/**
 * Validation rule sets for common operations
 */
export const validationSets = {
  createCharacter: [
    characterValidationRules.partyId,
    characterValidationRules.name,
    characterValidationRules.playerName,
    characterValidationRules.race,
    characterValidationRules.classes,
    characterValidationRules.className,
    characterValidationRules.classLevel,
    characterValidationRules.level,
    characterValidationRules.ac,
    characterValidationRules.maxHp,
    characterValidationRules.currentHp,
    characterValidationRules.tempHp,
    characterValidationRules.speed,
    characterValidationRules.abilities,
    ...Object.values(abilityValidationRules),
    characterValidationRules.proficiencyBonus,
    characterValidationRules.features,
    characterValidationRules.equipment,
    characterValidationRules.notes
  ],

  updateCharacter: [
    characterValidationRules.nameOptional,
    characterValidationRules.playerName,
    characterValidationRules.raceOptional,
    characterValidationRules.classesOptional,
    characterValidationRules.className,
    characterValidationRules.classLevel,
    characterValidationRules.level,
    characterValidationRules.ac,
    characterValidationRules.maxHp,
    characterValidationRules.currentHp,
    characterValidationRules.tempHp,
    characterValidationRules.speed,
    characterValidationRules.abilities,
    characterValidationRules.proficiencyBonus,
    characterValidationRules.features,
    characterValidationRules.equipment,
    characterValidationRules.notes
  ],

  createParty: [
    partyValidationRules.name,
    partyValidationRules.description
  ],

  updateParty: [
    partyValidationRules.nameOptional,
    partyValidationRules.description,
    partyValidationRules.isArchived
  ]
};
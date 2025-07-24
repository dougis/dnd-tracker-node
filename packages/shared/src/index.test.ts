import { describe, it, expect } from 'vitest';
import { UserSchema, CharacterSchema, BaseEntitySchema } from './index';

describe('Shared schemas', () => {
  it('should validate BaseEntity schema', () => {
    const validEntity = {
      id: 'test-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = BaseEntitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should validate User schema', () => {
    const validUser = {
      id: 'user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashedpassword',
    };

    const result = UserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should validate Character schema', () => {
    const validCharacter = {
      id: 'char-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'Test Character',
      level: 5,
      armorClass: 16,
      maxHitPoints: 50,
      currentHitPoints: 45,
      initiative: 12,
      userId: 'user-id',
    };

    const result = CharacterSchema.safeParse(validCharacter);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email in User schema', () => {
    const invalidUser = {
      id: 'user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
      email: 'invalid-email',
      username: 'testuser',
      passwordHash: 'hashedpassword',
    };

    const result = UserSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});
import { Party } from '@prisma/client';
import { BaseService } from './BaseService';

export interface CreatePartyData {
  name: string;
  description?: string;
}

export interface UpdatePartyData {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

export class PartyService extends BaseService {

  /**
   * Create a new party for a user
   */
  async create(userId: string, data: CreatePartyData): Promise<Party> {
    this.validateRequiredStringField(data.name, 'Party name is required');

    return this.executeOperation(async () => {
      return await this.prisma.party.create({
        data: {
          userId,
          name: data.name.trim(),
          description: this.processStringField(data.description),
        },
      });
    }, 'create party');
  }

  /**
   * Find all parties for a user
   */
  async findByUserId(userId: string, includeArchived: boolean = false): Promise<Party[]> {
    return this.executeOperation(async () => {
      return await this.prisma.party.findMany({
        where: {
          userId,
          ...(includeArchived ? {} : { isArchived: false }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }, 'fetch parties');
  }

  /**
   * Find a specific party by ID and user ID
   */
  async findById(partyId: string, userId: string): Promise<Party | null> {
    return this.executeOperation(async () => {
      return await this.prisma.party.findFirst({
        where: {
          id: partyId,
          userId,
        },
      });
    }, 'fetch party');
  }

  /**
   * Update a party
   */
  async update(partyId: string, userId: string, data: UpdatePartyData): Promise<Party | null> {
    this.validateUpdateData(data);

    return this.executeOperation(async () => {
      const existingParty = await this.findById(partyId, userId);
      if (!existingParty) {
        return null;
      }

      const updateData = this.buildUpdateData(data);
      return await this.prisma.party.update({
        where: { id: partyId },
        data: updateData,
      });
    }, 'update party');
  }

  /**
   * Validate update data for party
   */
  private validateUpdateData(data: UpdatePartyData): void {
    this.validateStringField(data.name, 'Party name cannot be empty');
  }

  /**
   * Build update data object from partial update data
   */
  private buildUpdateData(data: UpdatePartyData): any {
    return {
      ...this.getPartyStringFields(data),
      ...this.getPartyDirectFields(data),
    };
  }

  /**
   * Get processed string fields for party update
   */
  private getPartyStringFields(data: UpdatePartyData): any {
    const fields: any = {};
    if (data.name !== undefined) fields.name = data.name.trim();
    if (data.description !== undefined) fields.description = this.processStringField(data.description);
    return fields;
  }

  /**
   * Get direct fields for party update
   */
  private getPartyDirectFields(data: UpdatePartyData): any {
    const fields: any = {};
    this.copyDefinedFields(data, fields, ['isArchived']);
    return fields;
  }

  /**
   * Delete a party (soft delete by archiving)
   */
  async delete(partyId: string, userId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const existingParty = await this.findById(partyId, userId);
      if (!existingParty) {
        return false;
      }

      await this.prisma.party.update({
        where: { id: partyId },
        data: { isArchived: true },
      });

      return true;
    }, 'delete party');
  }

  /**
   * Hard delete a party and all associated characters
   */
  async hardDelete(partyId: string, userId: string): Promise<boolean> {
    return this.executeOperation(async () => {
      const existingParty = await this.findById(partyId, userId);
      if (!existingParty) {
        return false;
      }

      await this.prisma.party.delete({
        where: { id: partyId },
      });

      return true;
    }, 'permanently delete party');
  }
}
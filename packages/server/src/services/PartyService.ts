import { PrismaClient, Party } from '@prisma/client';

export interface CreatePartyData {
  name: string;
  description?: string;
}

export interface UpdatePartyData {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

export class PartyService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new party for a user
   */
  async create(userId: string, data: CreatePartyData): Promise<Party> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Party name is required');
    }

    try {
      const party = await this.prisma.party.create({
        data: {
          userId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
        },
      });

      return party;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create party: ${error.message}`);
      }
      throw new Error('Failed to create party');
    }
  }

  /**
   * Find all parties for a user
   */
  async findByUserId(userId: string, includeArchived: boolean = false): Promise<Party[]> {
    try {
      const parties = await this.prisma.party.findMany({
        where: {
          userId,
          ...(includeArchived ? {} : { isArchived: false }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return parties;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch parties: ${error.message}`);
      }
      throw new Error('Failed to fetch parties');
    }
  }

  /**
   * Find a specific party by ID and user ID
   */
  async findById(partyId: string, userId: string): Promise<Party | null> {
    try {
      const party = await this.prisma.party.findFirst({
        where: {
          id: partyId,
          userId,
        },
      });

      return party;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch party: ${error.message}`);
      }
      throw new Error('Failed to fetch party');
    }
  }

  /**
   * Update a party
   */
  async update(partyId: string, userId: string, data: UpdatePartyData): Promise<Party | null> {
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new Error('Party name cannot be empty');
    }

    try {
      // First check if party exists and belongs to user
      const existingParty = await this.findById(partyId, userId);
      if (!existingParty) {
        return null;
      }

      const updateData: any = {};
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }
      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }
      if (data.isArchived !== undefined) {
        updateData.isArchived = data.isArchived;
      }

      const party = await this.prisma.party.update({
        where: {
          id: partyId,
        },
        data: updateData,
      });

      return party;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update party: ${error.message}`);
      }
      throw new Error('Failed to update party');
    }
  }

  /**
   * Delete a party (soft delete by archiving)
   */
  async delete(partyId: string, userId: string): Promise<boolean> {
    try {
      // First check if party exists and belongs to user
      const existingParty = await this.findById(partyId, userId);
      if (!existingParty) {
        return false;
      }

      await this.prisma.party.update({
        where: {
          id: partyId,
        },
        data: {
          isArchived: true,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete party: ${error.message}`);
      }
      throw new Error('Failed to delete party');
    }
  }

  /**
   * Hard delete a party and all associated characters
   */
  async hardDelete(partyId: string, userId: string): Promise<boolean> {
    try {
      // First check if party exists and belongs to user
      const existingParty = await this.findById(partyId, userId);
      if (!existingParty) {
        return false;
      }

      // Delete party and all characters will be cascade deleted
      await this.prisma.party.delete({
        where: {
          id: partyId,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to permanently delete party: ${error.message}`);
      }
      throw new Error('Failed to permanently delete party');
    }
  }
}
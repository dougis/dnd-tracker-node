import { PrismaClient, Encounter, Participant, EncounterStatus } from '@prisma/client';

// Type for encounter with includes
export type EncounterWithDetails = Encounter & {
  participants: (Participant & {
    character?: any;
    creature?: any;
  })[];
  lairActions?: any;
};

// Type for participant creation
export interface ParticipantCreateData {
  type: 'CHARACTER' | 'CREATURE';
  characterId?: string;
  creatureId?: string;
  name: string;
  initiative: number;
  initiativeRoll?: number;
  currentHp: number;
  maxHp: number;
  tempHp?: number;
  ac: number;
  conditions?: any[];
  notes?: string;
}

export class EncounterService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new encounter
   */
  async createEncounter(
    userId: string,
    name: string,
    description?: string
  ): Promise<EncounterWithDetails> {
    // Validation
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Encounter name is required');
    }

    if (name.length > 100) {
      throw new Error('Encounter name must be 100 characters or less');
    }

    return this.prisma.encounter.create({
      data: {
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        status: 'PLANNING',
        round: 1,
        turn: 0,
        isActive: false,
      },
      include: this.getEncounterInclude(),
    });
  }

  /**
   * Get encounter by ID
   */
  async getEncounterById(encounterId: string): Promise<EncounterWithDetails | null> {
    return this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: this.getEncounterInclude(),
    });
  }

  /**
   * Get all encounters for a user
   */
  async getUserEncounters(userId: string): Promise<EncounterWithDetails[]> {
    return this.prisma.encounter.findMany({
      where: { userId },
      include: this.getEncounterInclude(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Validate encounter update data
   */
  private validateEncounterUpdateData(data: { name?: string; description?: string; status?: EncounterStatus }): void {
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Encounter name is required');
      }
      if (data.name.length > 100) {
        throw new Error('Encounter name must be 100 characters or less');
      }
    }
  }

  /**
   * Verify encounter ownership
   */
  private async verifyEncounterOwnership(encounterId: string, userId: string): Promise<void> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      select: { userId: true },
    });

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    if (encounter.userId !== userId) {
      throw new Error('Not authorized to modify this encounter');
    }
  }

  /**
   * Build update data object from provided fields
   */
  private buildUpdateData(data: { name?: string; description?: string; status?: EncounterStatus }): any {
    const updateData: any = {};
    
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    
    return updateData;
  }

  /**
   * Update encounter basic information
   */
  async updateEncounter(
    encounterId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      status?: EncounterStatus;
    }
  ): Promise<EncounterWithDetails> {
    this.validateEncounterUpdateData(data);
    await this.verifyEncounterOwnership(encounterId, userId);
    const updateData = this.buildUpdateData(data);

    return this.prisma.encounter.update({
      where: { id: encounterId },
      data: updateData,
      include: this.getEncounterInclude(),
    });
  }

  /**
   * Delete encounter
   */
  async deleteEncounter(encounterId: string, userId: string): Promise<void> {
    await this.verifyEncounterOwnership(encounterId, userId);

    await this.prisma.encounter.delete({
      where: { id: encounterId },
    });
  }

  /**
   * Add participant to encounter
   */
  async addParticipant(
    encounterId: string,
    userId: string,
    participantData: ParticipantCreateData
  ): Promise<EncounterWithDetails> {
    await this.verifyEncounterOwnership(encounterId, userId);

    await this.prisma.participant.create({
      data: {
        encounterId,
        type: participantData.type,
        characterId: participantData.characterId || null,
        creatureId: participantData.creatureId || null,
        name: participantData.name,
        initiative: participantData.initiative,
        initiativeRoll: participantData.initiativeRoll || null,
        currentHp: participantData.currentHp,
        maxHp: participantData.maxHp,
        tempHp: participantData.tempHp || 0,
        ac: participantData.ac,
        conditions: participantData.conditions || [],
        notes: participantData.notes || null,
      },
    });

    return this.getEncounterById(encounterId) as Promise<EncounterWithDetails>;
  }

  /**
   * Calculate initiative order with dexterity tie-breaking
   */
  calculateInitiativeOrder(participants: Participant[]): Participant[] {
    return participants
      .filter(p => p.isActive)
      .sort((a, b) => {
        // Primary: Initiative total (higher first)
        if (a.initiative !== b.initiative) {
          return b.initiative - a.initiative;
        }

        // Tie-breaker: Initiative roll (higher first)
        if (a.initiativeRoll && b.initiativeRoll && a.initiativeRoll !== b.initiativeRoll) {
          return b.initiativeRoll - a.initiativeRoll;
        }

        // If still tied, maintain original order (stable sort)
        return 0;
      });
  }

  /**
   * Validate combat start requirements
   */
  private validateCombatStart(encounter: EncounterWithDetails): void {
    if (encounter.participants.length === 0) {
      throw new Error('Cannot start combat with no participants');
    }
  }

  /**
   * Get standard encounter include pattern
   */
  private getEncounterInclude() {
    return {
      participants: {
        include: {
          character: true,
          creature: true,
        },
      },
      lairActions: true,
    };
  }

  /**
   * Start combat for encounter
   */
  async startCombat(encounterId: string, userId: string): Promise<EncounterWithDetails> {
    const encounter = await this.getEncounterById(encounterId);

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    if (encounter.userId !== userId) {
      throw new Error('Not authorized to modify this encounter');
    }

    this.validateCombatStart(encounter);

    return this.prisma.encounter.update({
      where: { id: encounterId },
      data: {
        status: 'ACTIVE',
        isActive: true,
        round: 1,
        turn: 0,
      },
      include: this.getEncounterInclude(),
    });
  }

  /**
   * End combat for encounter
   */
  async endCombat(encounterId: string, userId: string): Promise<EncounterWithDetails> {
    await this.verifyEncounterOwnership(encounterId, userId);

    return this.prisma.encounter.update({
      where: { id: encounterId },
      data: {
        status: 'COMPLETED',
        isActive: false,
      },
      include: this.getEncounterInclude(),
    });
  }

  /**
   * Validate participant belongs to encounter
   */
  private async validateParticipantBelongsToEncounter(participantId: string, encounterId: string): Promise<any> {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new Error('Participant not found');
    }

    if (participant.encounterId !== encounterId) {
      throw new Error('Participant does not belong to this encounter');
    }

    return participant;
  }

  /**
   * Calculate new HP based on damage/healing data
   */
  private calculateNewHp(currentHp: number, maxHp: number, hpData: {
    currentHp?: number;
    damage?: number;
    healing?: number;
  }): number {
    let newCurrentHp = currentHp;

    // Apply damage or healing
    if (hpData.damage !== undefined) {
      newCurrentHp = Math.max(0, newCurrentHp - hpData.damage);
    }

    if (hpData.healing !== undefined) {
      newCurrentHp = Math.min(maxHp, newCurrentHp + hpData.healing);
    }

    // Direct HP set overrides calculations
    if (hpData.currentHp !== undefined) {
      newCurrentHp = Math.max(0, Math.min(maxHp, hpData.currentHp));
    }

    return newCurrentHp;
  }

  /**
   * Update participant HP
   */
  async updateParticipantHp(
    participantId: string,
    encounterId: string,
    userId: string,
    hpData: {
      currentHp?: number;
      tempHp?: number;
      damage?: number;
      healing?: number;
    }
  ): Promise<EncounterWithDetails> {
    await this.verifyEncounterOwnership(encounterId, userId);
    const participant = await this.validateParticipantBelongsToEncounter(participantId, encounterId);

    const newCurrentHp = this.calculateNewHp(participant.currentHp, participant.maxHp, hpData);

    // Update participant
    await this.prisma.participant.update({
      where: { id: participantId },
      data: {
        currentHp: newCurrentHp,
        tempHp: hpData.tempHp !== undefined ? Math.max(0, hpData.tempHp) : participant.tempHp,
      },
    });

    // Return updated encounter
    return this.getEncounterById(encounterId) as Promise<EncounterWithDetails>;
  }
}
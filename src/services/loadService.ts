import { LoadDTO } from '../models/dtos/LoadDTO';
import { Load } from '../models/entities/Load';
import dbService from '../utils/fileStorage';
import { logger } from '../utils/logger';

/**
 * Load Service
 * Handles load-related business logic and data access
 */
export class LoadService {
  /**
   * Get all loads
   */
  async getAllLoads(): Promise<LoadDTO[]> {
    try {
      const db = await dbService.getDb();
      await db.read();
      return db.data.loads;
    } catch (error: any) {
      logger.error('Error getting all loads:', error);
      throw error;
    }
  }

  /**
   * Get available loads (status = 'available' or no status)
   */
  async getAvailableLoads(): Promise<LoadDTO[]> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      return db.data.loads.filter(load => {
        const loadEntity = new Load(load);
        return loadEntity.isAvailable();
      });
    } catch (error: any) {
      logger.error('Error getting available loads:', error);
      throw error;
    }
  }

  /**
   * Find load by ID
   */
  async findById(loadId: number): Promise<LoadDTO | null> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      const load = db.data.loads.find(l => l.load_id === loadId);
      return load || null;
    } catch (error: any) {
      logger.error(`Error finding load by ID ${loadId}:`, error);
      throw error;
    }
  }

  /**
   * Add a new load
   */
  async addLoad(load: LoadDTO): Promise<LoadDTO> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      // Generate ID if not provided
      if (!load.load_id) {
        const maxId = db.data.loads.reduce((max, l) => Math.max(max, l.load_id), 0);
        load.load_id = maxId + 1;
      }
      
      // Set default status if not provided
      if (!load.status) {
        load.status = 'available';
      }
      
      // Set created_at if not provided
      if (!load.created_at) {
        load.created_at = new Date();
      }
      
      db.data.loads.push(load);
      await db.write();
      
      logger.info(`Added new load with ID ${load.load_id}`);
      return load;
    } catch (error: any) {
      logger.error('Error adding load:', error);
      throw error;
    }
  }

  /**
   * Update load status
   */
  async updateLoadStatus(loadId: number, status: string): Promise<LoadDTO | null> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      const index = db.data.loads.findIndex(l => l.load_id === loadId);
      
      if (index === -1) {
        logger.warn(`Load with ID ${loadId} not found for update`);
        return null;
      }
      
      db.data.loads[index].status = status;
      await db.write();
      
      logger.info(`Updated load ${loadId} status to ${status}`);
      return db.data.loads[index];
    } catch (error: any) {
      logger.error(`Error updating load ${loadId} status:`, error);
      throw error;
    }
  }

  /**
   * Check if load has an active assignment
   */
  async hasActiveAssignment(loadId: number): Promise<boolean> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      return db.data.assignments.some(
        assignment => assignment.load_id === loadId && 
        (assignment.status === 'pending' || assignment.status === 'confirmed')
      );
    } catch (error: any) {
      logger.error(`Error checking assignment for load ${loadId}:`, error);
      throw error;
    }
  }

  /**
   * Create assignment record and update load status
   */
  async createAssignment(
    loadId: number,
    carrierMC: string,
    matchScore: number
  ): Promise<void> {
    try {
      const db = await dbService.getDb();
      await db.read();
      
      // Check if load already has an active assignment
      const hasActiveAssignment = db.data.assignments.some(
        assignment => assignment.load_id === loadId && 
        (assignment.status === 'pending' || assignment.status === 'confirmed')
      );
      
      if (hasActiveAssignment) {
        throw new Error(`Load ${loadId} already has an active assignment`);
      }
      
      const assignmentId = db.data.assignments.length + 1;
      
      const assignment = {
        assignment_id: assignmentId,
        load_id: loadId,
        carrier_mc: carrierMC,
        assigned_at: new Date().toISOString(),
        match_score: matchScore,
        status: 'pending'
      };
      
      db.data.assignments.push(assignment);
      
      // Update load status to 'assigned'
      const loadIndex = db.data.loads.findIndex(l => l.load_id === loadId);
      if (loadIndex !== -1) {
        db.data.loads[loadIndex].status = 'assigned';
      }
      
      await db.write();
      
      logger.info(`Created assignment ${assignmentId} for load ${loadId} to carrier ${carrierMC} and updated load status to 'assigned'`);
    } catch (error: any) {
      logger.error('Error creating assignment:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const loadService = new LoadService();
export default loadService;


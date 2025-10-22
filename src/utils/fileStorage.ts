import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { LoadDTO } from '../models/dtos/LoadDTO';
import { CarrierDTO } from '../models/dtos/CarrierDTO';

/**
 * Database schema interface
 * Contains all collections stored in db.json
 */
interface Database {
  loads: LoadDTO[];
  carriers: CarrierDTO[];
  assignments: Array<{
    assignment_id: number;
    load_id: number;
    carrier_mc: string;
    assigned_at: string;
    match_score: number;
    status: string;
  }>;
}

/**
 * DatabaseService - Singleton service for managing lowdb instance
 * Provides centralized access to the file-based database
 */
class DatabaseService {
  private db: Low<Database> | null = null;
  private dataDir: string;

  constructor() {
    this.dataDir = process.env.DATA_DIR || './data';
  }

  /**
   * Get or initialize the database instance
   * Uses singleton pattern to prevent multiple file handles
   */
  async getDb(): Promise<Low<Database>> {
    if (!this.db) {
      const file = path.join(this.dataDir, 'db.json');
      const adapter = new JSONFile<Database>(file);
      const defaultData: Database = { 
        loads: [], 
        carriers: [], 
        assignments: [] 
      };
      
      this.db = new Low<Database>(adapter, defaultData);
      await this.db.read();
      
      // Initialize with default data if empty
      if (!this.db.data) {
        this.db.data = defaultData;
        await this.db.write();
      }
    }
    return this.db;
  }

  /**
   * Force reload data from file
   */
  async reload(): Promise<void> {
    const db = await this.getDb();
    await db.read();
  }

  /**
   * Force save data to file
   */
  async save(): Promise<void> {
    const db = await this.getDb();
    await db.write();
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
export default dbService;


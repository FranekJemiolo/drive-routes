import pg from 'pg';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

export type DatabaseMode = 'postgres' | 'sqlite';

let db: pg.Pool | any = null;
let mode: DatabaseMode = 'postgres';

export function getDatabaseMode(): DatabaseMode {
  return mode;
}

export async function initDatabase(demoMode?: boolean): Promise<pg.Pool | any> {
  const isDemo = demoMode ?? process.env.DEMO_MODE === 'true';
  
  if (isDemo) {
    mode = 'sqlite';
    const SQL = await initSqlJs();
    
    // Try to load existing demo database file
    const dbPath = path.join(__dirname, '../../demo.db');
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      const sqlite = new SQL.Database(fileBuffer);
      console.log('✓ Loaded existing SQLite demo database');
      return sqlite;
    } else {
      console.log('⚠ Demo database file not found, creating empty database');
      const sqlite = new SQL.Database();
      return sqlite;
    }
  } else {
    mode = 'postgres';
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://drive_routes:drive_routes_dev@localhost:5432/drive_routes';
    const pool = new Pool({ connectionString: databaseUrl });
    console.log('✓ Initialized PostgreSQL database in production mode');
    return pool;
  }
}

export async function getDatabase(demoMode?: boolean): Promise<pg.Pool | any> {
  if (!db) {
    db = await initDatabase(demoMode);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    if (mode === 'postgres') {
      (db as pg.Pool).end();
    } else {
      (db as any).close();
    }
    db = null;
  }
}

// Query helper that works with both PostgreSQL and SQLite
export async function query(sql: string, params: any[] = []): Promise<any> {
  const database = await getDatabase();
  
  if (mode === 'postgres') {
    const pool = database as pg.Pool;
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    const sqlite = database as any;
    // Convert PostgreSQL-style parameters ($1, $2) to SQLite-style (?, ?)
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const result = sqlite.exec(sqliteSql, params);
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;
    return values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }
}

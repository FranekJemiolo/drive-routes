#!/usr/bin/env ts-node

import { execSync, spawn } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function run(cmd: string, cwd?: string): void {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { 
      stdio: "inherit", 
      cwd,
      env: { ...process.env }
    });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    throw error;
  }
}

function runSilent(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
}

function checkCommand(cmd: string): boolean {
  return runSilent(`which ${cmd}`).length > 0;
}

function checkPort(port: number): boolean {
  return runSilent(`lsof -ti:${port}`).length > 0;
}

function createEnvFile(path: string, content: string): void {
  if (!existsSync(path)) {
    writeFileSync(path, content);
    console.log(`Created ${path}`);
  }
}

async function setupEnvironment(): Promise<void> {
  console.log("=== DriveRoutes Local Development Setup ===\n");

  // Check prerequisites
  console.log("1. Checking prerequisites...");
  
  const requiredCommands = ["node", "npm", "docker", "docker-compose"];
  const missing = requiredCommands.filter(cmd => !checkCommand(cmd));
  
  if (missing.length > 0) {
    console.error(`Missing required commands: ${missing.join(", ")}`);
    console.log("Please install them before continuing:");
    console.log("- Node.js: https://nodejs.org/");
    console.log("- Docker: https://docs.docker.com/get-docker/");
    process.exit(1);
  }
  
  console.log("All prerequisites found!\n");

  // Check if ports are available
  console.log("2. Checking port availability...");
  
  const ports = [3000, 3001, 5432];
  const occupiedPorts = ports.filter(port => checkPort(port));
  
  if (occupiedPorts.length > 0) {
    console.log(`Warning: Ports ${occupiedPorts.join(", ")} are in use`);
    const continueAnyway = await question("Continue anyway? (y/N): ");
    if (continueAnyway.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
  
  console.log("Ports are available!\n");

  // Install dependencies
  console.log("3. Installing dependencies...");
  run("npm install");
  run("npm run install:all");
  console.log("Dependencies installed!\n");

  // Set up environment files
  console.log("4. Setting up environment files...");
  
  // Backend env
  const backendEnv = `# Database (Docker Compose)
DATABASE_URL=postgresql://drive_routes:drive_routes_dev@localhost:5432/drive_routes

# Supabase (replace with your values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key`;
  
  createEnvFile(".env", backendEnv);
  
  // Frontend env
  const frontendEnv = `# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase (replace with your values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`;
  
  createEnvFile("apps/web/.env.local", frontendEnv);
  
  console.log("Environment files created!\n");

  // Start Docker services
  console.log("5. Starting PostgreSQL with Docker...");
  
  try {
    run("docker-compose up -d postgres");
    console.log("PostgreSQL started!\n");
    
    // Wait for database to be ready
    console.log("6. Waiting for database to be ready...");
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const result = runSilent("docker-compose exec -T postgres pg_isready -U drive_routes -d drive_routes");
      if (result.includes("accepting connections")) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.error("Database failed to start");
      process.exit(1);
    }
    
    console.log("Database is ready!\n");
    
  } catch (error) {
    console.error("Failed to start PostgreSQL:", error);
    process.exit(1);
  }

  // Run database setup (if not already done by Docker)
  console.log("7. Setting up database schema...");
  
  // Check if tables exist
  const tablesExist = runSilent("docker-compose exec -T postgres psql -U drive_routes -d drive_routes -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roads'\"").includes("1");
  
  if (!tablesExist) {
    run("docker-compose exec -T postgres psql -U drive_routes -d drive_routes -f /docker-entrypoint-initdb.d/01-schema.sql");
    run("docker-compose exec -T postgres psql -U drive_routes -d drive_routes -f /docker-entrypoint-initdb.d/02-seed.sql");
    console.log("Database schema and seed data created!\n");
  } else {
    console.log("Database already set up!\n");
  }

  console.log("=== Setup Complete! ===\n");
  console.log("To start the development servers:");
  console.log("  npm run dev      # Start both frontend and backend");
  console.log("  npm run dev:api  # Backend only (port 3001)");
  console.log("  npm run dev:web  # Frontend only (port 3000)");
  console.log("\nTo stop services:");
  console.log("  docker-compose down  # Stop PostgreSQL");
  console.log("\nApplication URLs:");
  console.log("  Frontend: http://localhost:3000");
  console.log("  Backend API: http://localhost:3001");
  console.log("  Database: localhost:5432");
}

async function startDevelopment(): Promise<void> {
  console.log("=== Starting Development Servers ===\n");
  
  // Check if database is running
  const dbRunning = runSilent("docker-compose exec -T postgres pg_isready -U drive_routes -d drive_routes").includes("accepting connections");
  
  if (!dbRunning) {
    console.log("Starting database first...");
    run("docker-compose up -d postgres");
    
    // Wait for database
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const result = runSilent("docker-compose exec -T postgres pg_isready -U drive_routes -d drive_routes");
      if (result.includes("accepting connections")) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
  }
  
  console.log("Starting development servers...\n");
  
  // Start backend
  console.log("Starting backend API on port 3001...");
  const backend = spawn("npm", ["run", "dev:api"], {
    stdio: "inherit",
    cwd: process.cwd()
  });
  
  // Wait a moment for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start frontend
  console.log("Starting frontend on port 3000...");
  const frontend = spawn("npm", ["run", "dev:web"], {
    stdio: "inherit",
    cwd: process.cwd()
  });
  
  console.log("\n=== Development Servers Running ===");
  console.log("Frontend: http://localhost:3000");
  console.log("Backend:  http://localhost:3001");
  console.log("\nPress Ctrl+C to stop all servers");
  
  // Handle shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down servers...");
    backend.kill();
    frontend.kill();
    rl.close();
    process.exit(0);
  });
}

// Main execution
async function main(): Promise<void> {
  const command = process.argv[2];
  
  if (command === "setup") {
    await setupEnvironment();
  } else if (command === "start" || command === "dev") {
    await startDevelopment();
  } else {
    console.log("Usage:");
    console.log("  npm run dev-setup setup  # Initial setup");
    console.log("  npm run dev-setup start  # Start development servers");
    console.log("  npm run dev-setup dev    # Start development servers");
  }
}

main().catch(error => {
  console.error("Setup failed:", error);
  process.exit(1);
});

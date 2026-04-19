import { execSync } from "child_process";

function run(cmd: string) {
  console.log(`\nExecuting: ${cmd}\n`);
  execSync(cmd, { stdio: "inherit" });
}

async function deploy() {
  try {
    console.log("Starting DriveRoutes deployment pipeline...\n");

    // 1. Install dependencies
    console.log("Installing dependencies...");
    run("npm run install:all");

    // 2. Typecheck and lint
    console.log("Type checking...");
    run("cd apps/api && npm run type-check");
    run("cd apps/web && npm run type-check");

    // 3. Build backend
    console.log("Building backend...");
    run("npm run build:api");

    // 4. Build frontend
    console.log("Building frontend...");
    run("npm run build:web");

    // 5. Deploy backend (Fly.io)
    console.log("Deploying backend to Fly.io...");
    run("cd apps/api && fly deploy");

    // 6. Deploy frontend (GitHub Pages)
    console.log("Deploying frontend to GitHub Pages...");
    run("cd apps/web && npx gh-pages -d out");

    console.log("\nDeployment completed successfully!");
  } catch (err) {
    console.error("Deployment failed:", err);
    process.exit(1);
  }
}

deploy();

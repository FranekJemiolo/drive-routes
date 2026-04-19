# Local Development Setup

This guide will help you set up the DriveRoutes application for local development.

## Quick Start

```bash
# One-time setup
npm run setup

# Start development servers
npm run dev
```

That's it! The setup script handles everything including Docker, dependencies, and database initialization.

## What the Setup Script Does

### Prerequisites Check
- Verifies Node.js, npm, Docker, and Docker Compose are installed
- Checks if required ports (3000, 3001, 5432) are available

### Environment Setup
- Installs all npm dependencies
- Creates `.env` and `apps/web/.env.local` files
- Sets up database connection strings

### Database Setup
- Starts PostgreSQL with PostGIS using Docker Compose
- Waits for database to be ready
- Applies schema and seed data automatically

### Development Servers
- Starts backend API on port 3001
- Starts frontend on port 3000
- Handles graceful shutdown

## Manual Setup (Optional)

If you prefer to set up manually:

### 1. Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://drive_routes:drive_routes_dev@localhost:5432/drive_routes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Frontend (apps/web/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Wait for it to be ready, then apply schema
docker-compose exec postgres psql -U drive_routes -d drive_routes -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose exec postgres psql -U drive_routes -d drive_routes -f /docker-entrypoint-initdb.d/02-seed.sql
```

### 3. Dependencies
```bash
npm run install:all
```

### 4. Start Servers
```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend
npm run dev:web
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | One-time complete setup |
| `npm run dev` | Start both frontend and backend |
| `npm run dev:api` | Backend only (port 3001) |
| `npm run dev:web` | Frontend only (port 3000) |
| `npm run docker:up` | Start PostgreSQL only |
| `npm run docker:down` | Stop PostgreSQL |
| `npm run docker:logs` | View PostgreSQL logs |

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

## Testing the Application

1. Open http://localhost:3000 in your browser
2. You should see the DriveRoutes map interface
3. Click on roads to see details
4. Try the navigation buttons to export to Google/Apple Maps

## Database Access

You can connect to the database directly:
```bash
docker-compose exec postgres psql -U drive_routes -d drive_routes
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -ti:3000
lsof -ti:3001
lsof -ti:5432

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# View logs
npm run docker:logs
```

### Permission Issues
```bash
# Fix Docker permissions (macOS/Linux)
sudo chown -R $USER:$USER .docker

# Or use sudo for Docker commands
sudo docker-compose up -d postgres
```

### Clean Reset
```bash
# Stop everything
npm run docker:down

# Remove containers and volumes
docker-compose down -v

# Remove node modules
npm run clean

# Start fresh
npm run setup
```

## Development Tips

### Hot Reloading
- Frontend: Auto-reloads on file changes
- Backend: Auto-restarts on file changes (tsx watch mode)

### Database Changes
- Schema changes: Edit `scripts/schema.sql`
- To reapply: `docker-compose down -v && npm run docker:up`

### Adding Dependencies
```bash
# For backend
cd apps/api && npm install <package>

# For frontend  
cd apps/web && npm install <package>

# Or from root (adds to both)
npm install <package> -w
```

### Environment Variables
- Backend: Use `.env` file
- Frontend: Use `apps/web/.env.local` (must start with NEXT_PUBLIC_)
- Never commit actual secrets to git

## Next Steps

Once everything is running:
1. Set up a Supabase project for authentication
2. Update the Supabase URLs and keys in your env files
3. Test the authentication flow
4. Try importing a GPX file
5. Create your own roads and reviews

Happy coding!

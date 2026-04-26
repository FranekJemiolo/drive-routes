# Getting Started with DriveRoutes

## Quick Start (Demo Mode - Recommended for Testing)

```bash
# 1. Clone the repository
git clone https://github.com/FranekJemiolo/drive-routes.git
cd drive-routes

# 2. Install dependencies
npm run install:all

# 3. Start the frontend (demo mode)
npm run dev:web
```

That's it! The application will be available at http://localhost:3000 in demo mode.

**Demo Mode Features:**
- All data stored in browser localStorage
- Pre-populated with 8 sample roads (0 reviews each)
- Local authentication (any email/password works)
- No database required
- Perfect for testing UI and user experience

## Quick Start (Production Mode - Full Backend)

```bash
# 1. Clone the repository
git clone https://github.com/FranekJemiolo/drive-routes.git
cd drive-routes

# 2. Install dependencies
npm run install:all

# 3. Set up environment variables
# apps/api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/drive_routes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DEMO_MODE=false

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 4. Set up database
psql $DATABASE_URL -f scripts/schema.sql
npm run seed

# 5. Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Sample Data

**Demo Mode:**
- 8 famous driving routes pre-loaded (Pacific Coast Highway, Tail of the Dragon, Stelvio Pass, etc.)
- All roads start with 0 reviews and 0 rating
- Ratings are calculated from actual user reviews only

**Production Mode:**
- 3 sample roads (Alpine Pass Loop, Coastal Highway 1, Black Forest Twist)
- All roads start with 0 reviews and 0 rating
- Ratings are calculated from actual user reviews only

## Manual Testing

### Test the Backend API (Production Mode Only)
```bash
# Test if API is running
curl http://localhost:3001

# Get all roads
curl http://localhost:3001/roads

# Get road by ID (use one from the previous command)
curl http://localhost:3001/roads/<road-id>

# Get reviews for a road
curl http://localhost:3001/roads/<road-id>/reviews
```

### Test the Frontend
1. Open http://localhost:3000
2. You should see a map with roads
3. Click on any road to see details
4. Sign in with any email/password (demo mode) or your Supabase account (production mode)
5. Add a review to see the rating update
6. Try the navigation buttons

## Environment Variables

**Demo Mode (apps/web/.env.local):**
```bash
NEXT_PUBLIC_API_URL=
```

**Production Mode (apps/api/.env):**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/drive_routes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DEMO_MODE=false
```

**Production Mode (apps/web/.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Development Workflow

### Making Changes
- Frontend: Edit files in `apps/web/src/`
- Backend: Edit files in `apps/api/src/`
- Database: Edit `scripts/schema.sql`

### Hot Reloading
- Frontend: Auto-reloads on save
- Backend: Auto-restarts on save

### Database Changes (Production Mode)
```bash
# Reset database (loses all data)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $DATABASE_URL -f scripts/schema.sql
npm run seed
```

## Common Commands

| Command | What it does |
|---------|--------------|
| `npm run install:all` | Install all dependencies |
| `npm run dev` | Start both servers (production mode) |
| `npm run dev:api` | Backend only |
| `npm run dev:web` | Frontend only (demo mode) |
| `npm test` | Run tests |
| `npm run seed` | Seed database with sample data |

## Troubleshooting

### "Port already in use"
```bash
# Find what's using the port
lsof -ti:3000
lsof -ti:3001

# Kill the process
kill -9 <PID>
```

### Database connection issues
```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL
brew services restart postgresql
```

### Frontend build errors
```bash
# Clean and reinstall
cd apps/web
rm -rf node_modules package-lock.json
npm install
```

### Backend build errors
```bash
# Clean and reinstall
cd apps/api
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

Once everything is running:

1. **Try the demo mode** first to understand the UI
2. **Set up Supabase** for production authentication
3. **Create your own roads** using the map tools
4. **Add reviews** to see the rating system in action
5. **Import a GPX file** through the UI (production mode)
6. **Explore the API** with curl or Postman

## Architecture Overview

```
Demo Mode:
Frontend (Next.js)     Browser Storage
      :3000                  localStorage
         |                       |
         |                       |
    React/Leaflet         Local data
    Maps UI              + Local auth

Production Mode:
Frontend (Next.js)     Backend (Fastify)     Database (PostgreSQL+PostGIS)
      :3000                  :3001                    :5432
         |                       |                        |
         |                       |                        |
    React/Leaflet         REST API              Spatial queries
    Maps UI              + Auth                + GeoJSON storage
```

## Live Demo

The application is deployed to GitHub Pages in demo mode:
https://franekjemiolo.github.io/drive-routes/

Happy coding!

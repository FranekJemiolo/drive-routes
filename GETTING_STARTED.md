# Getting Started with DriveRoutes

## Quick Start (Recommended)

```bash
# 1. One-time setup
npm run quick-start

# 2. Install dependencies (run in each folder)
npm install
cd apps/web && npm install
cd ../api && npm install

# 3. Start development servers
npm run dev
```

That's it! The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## What's Included

The setup automatically:
- Starts PostgreSQL with PostGIS using Docker
- Creates the database schema
- Loads sample data (3 roads, 2 users, reviews)
- Sets up environment files
- Configures everything for local development

## Manual Testing

### Test the Backend API
```bash
# Test if API is running
curl http://localhost:3001

# Get all roads
curl http://localhost:3001/roads

# Get road by ID (use one from the previous command)
curl http://localhost:3001/roads/<road-id>

# Get reviews
curl http://localhost:3001/reviews
```

### Test the Frontend
1. Open http://localhost:3000
2. You should see a map with roads
3. Click on any road to see details
4. Try the navigation buttons

## Sample Data

The setup includes sample roads:
- **Alpine Pass Loop** (Austria) - Mountain twisty road
- **Coastal Highway 1** (California) - Scenic coastal drive  
- **Black Forest Twist** (Germany) - Forest technical road

Each has reviews and ratings already loaded.

## Environment Variables

The setup creates these files:
- `.env` - Backend configuration
- `apps/web/.env.local` - Frontend configuration

You'll need to update the Supabase values if you want authentication:
```bash
# In both files, replace:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Development Workflow

### Making Changes
- Frontend: Edit files in `apps/web/src/`
- Backend: Edit files in `apps/api/src/`
- Database: Edit `scripts/schema.sql`

### Hot Reloading
- Frontend: Auto-reloads on save
- Backend: Auto-restarts on save

### Database Changes
```bash
# Reset database (loses all data)
docker-compose down -v
docker-compose up -d postgres

# Or just re-run setup
npm run quick-start
```

## Common Commands

| Command | What it does |
|---------|--------------|
| `npm run quick-start` | Database + env setup |
| `npm run dev` | Start both servers |
| `npm run dev:api` | Backend only |
| `npm run dev:web` | Frontend only |
| `npm run docker:down` | Stop database |
| `npm run docker:logs` | View database logs |

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
# Restart database
docker-compose restart postgres

# Check logs
npm run docker:logs

# Reset everything
docker-compose down -v && npm run quick-start
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

1. **Set up Supabase** for authentication (optional for testing)
2. **Try importing a GPX file** through the UI
3. **Create your own roads** using the map tools
4. **Add reviews** to the sample roads
5. **Explore the API** with curl or Postman

## Architecture Overview

```
Frontend (Next.js)     Backend (Fastify)     Database (PostgreSQL+PostGIS)
      :3000                  :3001                    :5432
         |                       |                        |
         |                       |                        |
    React/Leaflet         REST API              Spatial queries
    Maps UI              + Auth                + GeoJSON storage
```

Happy coding!

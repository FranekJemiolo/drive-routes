# DriveRoutes

A social platform for discovering, rating, and sharing the best driving roads for cars and motorcycles.

## Features

- **Interactive Map**: Leaflet-based map with OpenStreetMap tiles
- **Road Discovery**: Browse and filter roads by type, rating, and location
- **GPX Import**: Upload your own driving routes and automatically segment them
- **Rating System**: Single score rating (1-10) for roads
- **Reviews**: Submit and read reviews for roads with sorting options
- **Navigation Integration**: One-click export to Google Maps and Apple Maps
- **Social Features**: Save roads, create collections, share with groups
- **Responsive Design**: Works on desktop and mobile browsers
- **Demo Mode**: Browser-only mode with sample data for testing without backend

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Leaflet maps, Tailwind CSS
- **Backend**: Fastify with TypeScript, PostgreSQL + PostGIS
- **Authentication**: Supabase Auth
- **Deployment**: Fly.io (backend), GitHub Pages (frontend)
- **CI/CD**: GitHub Actions with preview deployments

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS extension
- Supabase project (for auth and database)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd drive-routes
```

2. Install dependencies
```bash
npm run install:all
```

3. Set up environment variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up database
```bash
# Apply schema
psql $DATABASE_URL -f scripts/schema.sql

# Seed sample data
npm run seed
```

5. Start development servers
```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend  
npm run dev:web
```

Visit http://localhost:3000 to see the application.

## Demo Mode

The application can run in demo mode (browser-only) without a backend API. This is useful for testing the UI and features without setting up a database.

### Demo Mode Authentication

In demo mode (localhost or GitHub Pages), you can sign in with any email and password. The system creates a local session stored in localStorage.

### Test Account (Backend Mode)

When running with the backend API, you can use this test account:

- **Email**: orange@test.me
- **Password**: juice
- **Username**: test_user

This account is included in the database seed data (`scripts/seed.sql`).

## Project Structure

```
drive-routes/
 apps/
   web/          # Next.js frontend
   api/          # Fastify backend
 scripts/        # Deployment and seeding
 .github/        # CI/CD workflows
```

## API Endpoints

- `GET /roads` - List roads (supports bbox filtering)
- `GET /roads/:id` - Get road details
- `POST /roads` - Create new road (requires auth)
- `POST /roads/import-gpx` - Import GPX file (requires auth)
- `GET /roads/:id/reviews` - List reviews for a road (supports sorting)
- `POST /roads/:id/reviews` - Create review for a road (requires auth)
- `PUT /reviews/:id` - Update review (requires auth, owner only)
- `DELETE /reviews/:id` - Delete review (requires auth, owner only)

## Deployment

### Automatic Deployment
Push to `main` branch triggers production deployment via GitHub Actions.

### Manual Deployment
```bash
npm run deploy
```

### Preview Deployments
Pull requests and feature branches get preview deployments automatically.

## Database Schema

Key tables:
- `roads` - Road data with PostGIS geometry
- `users` - User profiles and preferences
- `reviews` - Single score road ratings (1-10)
- `user_routes` - Custom route collections
- `events` - Analytics and onboarding tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request

## License

MIT

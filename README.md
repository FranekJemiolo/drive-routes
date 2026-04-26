# DriveRoutes

A social platform for discovering, rating, and sharing the best driving roads for cars and motorcycles.

## Features

- **Interactive Map**: Leaflet-based map with OpenStreetMap tiles for road discovery
- **Road Discovery**: Browse and filter roads by type, rating, and location
- **Route Creation**: Draw routes directly on the map with automatic length calculation
- **GPX Import**: Upload your own driving routes and automatically segment them
- **Rating System**: Single score rating (1-10) calculated from actual user reviews
- **Reviews**: Submit and read reviews for roads with sorting options (score, recency)
- **Navigation Integration**: One-click export to Google Maps and Apple Maps
- **Social Features**: Save roads, create collections, share with groups
- **Responsive Design**: Works on desktop and mobile browsers with mobile menu
- **Demo Mode**: Browser-only mode with sample data for testing without backend
- **Production Mode**: Full-featured mode with PostgreSQL database and API

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Leaflet maps, Tailwind CSS
- **Backend**: Fastify with TypeScript, PostgreSQL + PostGIS (production) or SQLite (demo)
- **Authentication**: Supabase Auth (production) or local session (demo)
- **Deployment**: GitHub Pages (static export)
- **CI/CD**: GitHub Actions with automated testing and deployment

## Modes of Operation

### Demo Mode (Browser Storage)

The application runs in demo mode when:
- Deployed to GitHub Pages (static export)
- No API backend is available
- `NEXT_PUBLIC_API_URL` is not set or unreachable

**Demo Mode Features:**
- All data stored in browser localStorage
- Pre-populated with sample roads (8 famous driving routes)
- Local authentication (any email/password works)
- No database required
- Reviews and ratings calculated locally
- Perfect for testing UI and user experience

**Demo Mode Limitations:**
- Data is local to your browser only
- No data persistence across devices
- No real user accounts
- Limited to browser storage capacity

### Production Mode (API + Database)

The application runs in production mode when:
- API backend is available and accessible
- `NEXT_PUBLIC_API_URL` points to a running API server
- PostgreSQL database is configured

**Production Mode Features:**
- Full PostgreSQL database with PostGIS for spatial queries
- Supabase authentication for real user accounts
- Data persistence across devices and users
- Spatial filtering and advanced queries
- Real-time rating calculations via database triggers
- GPX import with automatic segmentation

## Rating System

The rating system is designed to be completely transparent and based on actual user reviews:

### How Ratings Work

1. **Initial State**: All roads start with `rating_avg: 0` and `rating_count: 0`
2. **Review Submission**: When a user submits a review (score 1-10), the system:
   - Stores the review in the database
   - Recalculates the average rating from all reviews for that road
   - Updates `rating_avg` and `rating_count` on the road
3. **No Pre-populated Data**: No fake reviews or ratings are included in the seed data

### Rating Calculation

**Demo Mode (Browser Storage):**
- Calculated in JavaScript when reviews are added
- Formula: `avg = sum(all scores) / count(reviews)`
- Updated immediately when a review is submitted

**Production Mode (PostgreSQL):**
- Automatic database trigger updates ratings
- Trigger fires on INSERT, UPDATE, DELETE of reviews
- Formula: `AVG(score) FROM reviews WHERE road_id = ?`

### Display

- Roads with 0 reviews show "No reviews yet"
- Roads with reviews show the average rating (1-10) and review count
- Reviews can be sorted by score (ascending/descending) or recency

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with PostGIS extension (for production mode)
- Supabase project (for production auth and database)

### Installation

1. Clone the repository
```bash
git clone https://github.com/FranekJemiolo/drive-routes.git
cd drive-routes
```

2. Install dependencies
```bash
npm run install:all
```

3. Set up environment variables

**For Demo Mode (no backend):**
```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=
```

**For Production Mode (with backend):**
```bash
# apps/api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/drive_routes
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DEMO_MODE=false

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up database (production mode only)
```bash
# Apply schema
psql $DATABASE_URL -f scripts/schema.sql

# Seed sample data (roads with 0 reviews)
npm run seed
```

5. Start development servers

**Demo Mode (frontend only):**
```bash
npm run dev:web
```

**Production Mode (frontend + backend):**
```bash
# Terminal 1: Backend
npm run dev:api

# Terminal 2: Frontend  
npm run dev:web
```

Visit http://localhost:3000 to see the application.

## Project Structure

```
drive-routes/
 apps/
   web/                    # Next.js frontend
     src/
       components/         # React components (Navbar, RouteEditor, etc.)
       lib/                # Utilities (api.ts, browser-storage.ts, auth.ts)
       app/                # Next.js app router pages
   api/                    # Fastify backend
     src/
       index.ts            # Production API (PostgreSQL)
       index-local.ts      # Demo API (SQLite)
       db/                 # Database abstraction layer
       lib/                # Authentication utilities
     scripts/
       seed-demo-db.ts     # SQLite seed script
 scripts/                  # Root-level scripts
   schema.sql              # PostgreSQL schema
   schema-sqlite.sql       # SQLite schema
   seed.ts                 # PostgreSQL seed script
 .github/
   workflows/
     ci.yml                # CI workflow (tests, build)
     deploy.yml            # Production deploy workflow
     preview.yml           # Preview deploy workflow
```

## API Endpoints

### Roads
- `GET /roads` - List roads (supports bbox filtering)
- `GET /roads/:id` - Get road details
- `POST /roads` - Create new road (requires auth)
- `POST /roads/import-gpx` - Import GPX file (requires auth)

### Reviews
- `GET /roads/:id/reviews` - List reviews for a road (supports sorting)
- `POST /roads/:id/reviews` - Create review for a road (requires auth)
- `PUT /reviews/:id` - Update review (requires auth, owner only)
- `DELETE /reviews/:id` - Delete review (requires auth, owner only)

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

## Testing

The application includes unit tests for the browser storage layer:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

Tests cover:
- Browser storage initialization
- Road CRUD operations
- Review CRUD operations
- Rating calculations
- Saved routes functionality

## Deployment

### Automatic Deployment

Push to `main` branch triggers:
1. CI workflow: Typecheck, tests, build
2. Production Deploy workflow: Build with BASE_PATH, deploy to GitHub Pages

### Manual Deployment

```bash
# Build for production
cd apps/web
NEXT_PUBLIC_BASE_PATH=/drive-routes npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Environment Variables for Deployment

**GitHub Pages (Demo Mode):**
- `NEXT_PUBLIC_BASE_PATH=/drive-routes` (set in deploy workflow)
- No API URL needed (uses browser storage)

**Production Deployment:**
- `NEXT_PUBLIC_API_URL` - API backend URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Database Schema

### Key Tables

**roads**
- `id` - UUID primary key
- `name` - Road name
- `description` - Road description
- `geometry` - PostGIS LineString geometry
- `tags` - Array of tags (scenic, mountain, etc.)
- `countries` - Array of countries
- `region` - Geographic region
- `length_km` - Route length in kilometers
- `rating_avg` - Average rating (calculated from reviews)
- `rating_count` - Number of reviews
- `save_count` - Number of users who saved this road
- `created_by` - User who created the road
- `created_at` - Creation timestamp

**reviews**
- `id` - UUID primary key
- `user_id` - User who wrote the review
- `road_id` - Road being reviewed
- `score` - Rating (1-10)
- `text` - Review text
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- Unique constraint on (user_id, road_id) - one review per user per road

**users**
- `id` - UUID primary key
- `email` - User email
- `username` - Username
- `password_hash` - Hashed password
- `reputation_score` - User reputation
- `onboarding_state` - Onboarding progress
- `preferences` - JSON preferences
- `stats` - JSON statistics
- `created_at` - Creation timestamp

### Database Triggers

**update_road_stats**: Automatically updates `rating_avg` and `rating_count` on the roads table when reviews are added, updated, or deleted.

## Live Demo

The application is deployed to GitHub Pages in demo mode:
https://franekjemiolo.github.io/drive-routes/

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

## License

MIT

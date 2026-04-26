# DriveRoutes Development Journal

## Project Overview
DriveRoutes is a social platform for discovering, rating, and sharing the best driving roads for cars and motorcycles.

## Technology Stack

### Frontend
- **Framework**: Next.js 16.2.4 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Map**: Leaflet (direct implementation, not react-leaflet)
- **State**: React hooks (useState, useEffect, useRef)

### Backend
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL with PostGIS extension (production) or SQLite (demo)
- **Authentication**: Supabase (production), local session (demo)

### Infrastructure
- **CI/CD**: GitHub Actions
- **Deployment**: GitHub Pages (static export with demo mode)

## Key Decisions

### 2026-04-20: Map Implementation
**Decision**: Replaced react-leaflet with direct Leaflet implementation
**Reason**: react-leaflet had compatibility issues with Next.js 16 and React 18's strict mode, causing "Map container is already initialized" errors
**Outcome**: Direct Leaflet implementation provides full control over map lifecycle and eliminates initialization errors

### 2026-04-20: Next.js Upgrade
**Decision**: Upgraded from Next.js 14 to Next.js 16.2.4
**Reason**: To resolve ENOWORKSPACES error and benefit from latest improvements
**Outcome**: Successfully upgraded with Turbopack enabled for faster builds

### 2026-04-20: UI Modernization
**Decision**: Implemented shadcn/ui component library with Tailwind CSS v4
**Reason**: To provide a modern, professional design system
**Outcome**: Beautiful, consistent UI with Card, Badge, Button components

### 2026-04-20: Local Development Setup
**Decision**: Created index-local.ts for local development without Supabase
**Reason**: To enable local development without Supabase dependencies
**Outcome**: Simplified local development workflow with mock authentication

### 2026-04-20: TypeScript Type Handling
**Decision**: Updated Road type to allow rating_avg and length_km as string or number
**Reason**: Database returns strings but TypeScript expected numbers, causing toFixed errors
**Outcome**: Type-safe handling of database string values with runtime conversion

### 2026-04-20: Tailwind CSS PostCSS Configuration
**Decision**: Updated to use @tailwindcss/postcss plugin
**Reason**: Tailwind CSS v4 moved PostCSS plugin to separate package
**Outcome**: Proper Tailwind CSS v4 configuration

### 2026-04-25: Demo Mode Implementation
**Decision**: Added demo mode with SQLite database for GitHub Pages deployment
**Reason**: To enable hosting on GitHub Pages without requiring PostgreSQL database
**Outcome**: 
- Added sql.js for in-memory SQLite database
- Created database abstraction layer supporting both PostgreSQL and SQLite
- Implemented DEMO_MODE environment variable to switch between modes
- Created seed script with 8 famous driving routes (Pacific Coast Highway, Tail of the Dragon, etc.)
- Simplified API endpoints to work without PostGIS in demo mode
- Configured Next.js with basePath for GitHub Pages
- Updated CI/CD to deploy to GitHub Pages with demo database
**Trade-offs**: Demo mode lacks PostGIS spatial queries and GPX length calculations

### 2026-04-26: Reviews Feature Implementation
**Decision**: Implemented comprehensive reviews system with single score rating (1-10)
**Reason**: To allow users to rate and review roads with transparent rating calculation
**Outcome**:
- Simplified reviews table to use single score instead of multi-dimensional ratings
- Implemented database trigger for automatic rating updates in PostgreSQL
- Implemented manual rating calculation in SQLite/browser storage
- Created RoadDetailModal component for displaying road details and reviews
- Added review submission form with score (1-10) and text
- Implemented review sorting (score ascending/descending, recency ascending/descending)
- Added Jest testing framework with comprehensive test coverage for browser storage
- Integrated tests into CI/CD pipeline
- Removed all pre-populated reviews from seed data
- All roads now start with 0 reviews and 0 rating
- Ratings are calculated exclusively from actual user reviews

### 2026-04-26: Route Length Calculation
**Decision**: Implemented Haversine formula for accurate route length calculation
**Reason**: Route length was not being calculated when drawing routes on the map
**Outcome**:
- Added calculateDistance function using Haversine formula
- Added calculateLength function to sum distances between all coordinates
- Integrated length calculation into RouteEditor handleSubmit
- Length is now calculated and stored when creating new roads

### 2026-04-26: Mobile Menu Fix
**Decision**: Added mobile menu state and dropdown navigation
**Reason**: Mobile menu button was not functional
**Outcome**:
- Added mobileMenuOpen state to track menu visibility
- Created mobile menu dropdown with all navigation links
- Added onClick handlers to close menu after navigation
- Mobile menu now works correctly on small screens

### 2026-04-26: Sign In Modal Z-Index Fix
**Decision**: Increased z-index of sign in modal to appear above map
**Reason**: Sign in modal was being overshadowed by Leaflet map on mobile
**Outcome**:
- Increased modal backdrop z-index from z-[100] to z-[9999]
- Increased modal content z-index to z-[10000]
- Sign in modal now appears above map on all devices

### 2026-04-26: CI/CD Workflow Fixes
**Decision**: Fixed CI workflow to use correct install command and BASE_PATH
**Reason**: CI workflow was failing with npm ci and missing static assets
**Outcome**:
- Changed npm ci to npm run install:all for monorepo structure
- Added NEXT_PUBLIC_BASE_PATH=/drive-routes during build
- Added typecheck and test steps to CI workflow
- Removed deployment steps from CI workflow (handled by deploy.yml)
- Both CI and Production Deploy workflows now pass successfully

### 2026-04-26: Rating System Transparency
**Decision**: Removed all pre-populated ratings and reviews from seed data
**Reason**: Ratings should be calculated exclusively from actual user reviews
**Outcome**:
- Updated SQLite seed script to set all roads to rating_avg: 0, rating_count: 0
- Removed sample reviews from SQLite seed
- Updated PostgreSQL seed script to set all roads to rating_avg: 0, rating_count: 0
- Removed sample reviews from PostgreSQL seed
- Regenerated demo.db with zeroed ratings
- Database trigger automatically updates ratings in production mode
- Browser storage manually calculates ratings in demo mode

## Known Issues
- xmldom package lacks TypeScript types (non-blocking)
- @apply rule in globals.css shows unknown at-rule warning (cosmetic)
- apps/api/src/index-local.ts has TypeScript errors (non-blocking, local dev only)

## Completed Features
- ✅ Interactive map with Leaflet
- ✅ Road discovery and filtering
- ✅ Route creation with map drawing
- ✅ Automatic length calculation using Haversine formula
- ✅ Single score rating system (1-10)
- ✅ Review submission and display
- ✅ Review sorting (score, recency)
- ✅ Navigation integration (Google Maps, Apple Maps)
- ✅ Responsive design with mobile menu
- ✅ Demo mode (browser storage)
- ✅ Production mode (PostgreSQL + API)
- ✅ Jest testing framework
- ✅ CI/CD pipeline with automated testing
- ✅ GitHub Pages deployment
- ✅ Comprehensive documentation

## Future Improvements
- Add @types/xmldom for TypeScript support
- Add tests for production mode (API endpoints)
- Implement user route collections
- Add GPX import functionality
- Implement proper Supabase authentication flow
- Add more sample roads to seed data

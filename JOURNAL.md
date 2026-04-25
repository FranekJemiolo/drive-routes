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
- **Database**: PostgreSQL with PostGIS extension
- **Authentication**: Supabase (production), mock auth (local dev)

### Infrastructure
- **CI/CD**: GitHub Actions
- **Deployment**: Fly.io (backend), GitHub Pages (frontend) - planned

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

## Known Issues
- xmldom package lacks TypeScript types (non-blocking)
- @apply rule in globals.css shows unknown at-rule warning (cosmetic)

## Future Improvements
- Add @types/xmldom for TypeScript support
- Implement GitHub Actions CI/CD pipeline
- Set up production deployments
- Add automated testing
- Implement proper authentication flow

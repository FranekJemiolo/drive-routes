#!/bin/bash

# Quick Start Script for DriveRoutes
# This script gets you running with minimal setup

set -e

echo "=== DriveRoutes Quick Start ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U drive_routes -d drive_routes > /dev/null 2>&1; then
        echo "Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Database failed to start"
        exit 1
    fi
    sleep 2
done

# Check if tables exist
TABLES_EXIST=$(docker-compose exec -T postgres psql -U drive_routes -d drive_routes -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roads'" 2>/dev/null | tr -d ' ')

if [ "$TABLES_EXIST" = "0" ]; then
    echo "Setting up database schema..."
    docker-compose exec postgres psql -U drive_routes -d drive_routes -f /docker-entrypoint-initdb.d/01-schema.sql
    docker-compose exec postgres psql -U drive_routes -d drive_routes -f /docker-entrypoint-initdb.d/02-seed.sql
    echo "Database setup complete!"
else
    echo "Database already set up!"
fi

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    cat > .env << EOF
# Database (Docker Compose)
DATABASE_URL=postgresql://drive_routes:drive_routes_dev@localhost:5432/drive_routes

# Supabase (replace with your values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
EOF
fi

if [ ! -f apps/web/.env.local ]; then
    echo "Creating frontend .env.local file..."
    cat > apps/web/.env.local << EOF
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase (replace with your values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EOF
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To start development:"
echo "1. Install dependencies: npm install (in root and each app folder)"
echo "2. Start backend: npm run dev:api"
echo "3. Start frontend: npm run dev:web"
echo ""
echo "Or use the automated setup: npm run setup"
echo ""
echo "Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Database: localhost:5432"
echo ""
echo "To stop database: npm run docker:down"

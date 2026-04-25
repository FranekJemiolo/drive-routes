# Reviews Feature Implementation Plan

## Overview
Implement a comprehensive reviews system for roads with:
- Single numeric score (1-10) per review (simplified from current multi-dimensional)
- Real-time calculation of average rating and review count
- View reviews sorted by score or recency
- Add reviews for signed-in users
- Full test coverage

## Current State Analysis

### PostgreSQL Schema (scripts/schema.sql)
- ✅ Reviews table exists with multi-dimensional ratings (enjoyment, scenery, surface, traffic)
- ✅ Trigger exists to update road stats
- ❌ Uses complex JSONB ratings instead of simple score
- ❌ Trigger calculation is complex

### TypeScript Types (apps/web/src/types/road.ts)
- ✅ Review type exists with multi-dimensional ratings
- ❌ Needs to be simplified to single score

### SQLite Schema
- ❌ No SQLite schema found - needs to be created

### Frontend
- ❌ No review UI components
- ❌ No review submission form
- ❌ No review sorting controls

### Tests
- ❌ No review tests

## Implementation Plan

### Phase 1: Schema Updates

#### 1.1 Simplify Review Schema
**Goal:** Change from multi-dimensional ratings to single score (1-10)

**PostgreSQL Changes:**
- Modify reviews table: change `ratings JSONB` to `score INTEGER` (1-10)
- Update trigger to calculate simple average
- Add index on score for sorting

**SQLite Changes:**
- Create reviews table with same structure
- Add indexes

**Migration Strategy:**
- Create migration script for PostgreSQL
- Create initial schema script for SQLite

#### 1.2 Update TypeScript Types
- Change Review type to use single `score: number` (1-10)
- Remove multi-dimensional ratings
- Add ReviewCreateInput type

### Phase 2: Backend API

#### 2.1 Update Database Queries
- Modify road queries to calculate real average from reviews
- Add review CRUD operations
- Add sorting support (score asc/desc, created_at asc/desc)

#### 2.2 API Endpoints
- `GET /api/roads/:id/reviews` - Get reviews for a road with sorting
- `POST /api/roads/:id/reviews` - Create a review (authenticated)
- `PUT /api/reviews/:id` - Update a review (owner only)
- `DELETE /api/reviews/:id` - Delete a review (owner only)

#### 2.3 Authentication Integration
- Ensure review creation requires authentication
- Validate user can only review once per road
- Validate ownership for update/delete

### Phase 3: Frontend Implementation

#### 3.1 Update Browser Storage Demo Data
- Add sample reviews for demo roads
- Calculate real averages from reviews
- Update road rating_avg and rating_count

#### 3.2 Review UI Components
- ReviewsList component (display reviews with sorting)
- ReviewItem component (single review display)
- ReviewForm component (add/edit review)
- ReviewSortControls component (sorting UI)

#### 3.3 Road Detail Page Updates
- Add reviews section
- Integrate review form for signed-in users
- Show average rating calculated from reviews
- Show review count

#### 3.4 API Integration
- Update api.ts to call new review endpoints
- Add browser storage methods for reviews
- Handle authentication state

### Phase 4: Testing

#### 4.1 Backend Tests
- Unit tests for review CRUD operations
- Integration tests for review API endpoints
- Test review aggregation calculations
- Test authentication/authorization

#### 4.2 Frontend Tests
- Unit tests for review components
- Integration tests for review submission
- Test sorting functionality

#### 4.3 E2E Tests
- Test complete review flow (view, sort, add)

### Phase 5: CI/CD & Deployment

#### 5.1 Update CI/CD
- Ensure tests run in pipeline
- No backend typecheck (already removed)

#### 5.2 Deployment
- Deploy to GitHub Pages
- Verify reviews work in browser-only mode
- Verify reviews work with backend

## Detailed Schema Design

### PostgreSQL Reviews Table
```sql
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    road_id UUID REFERENCES roads(id) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    text TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, road_id) -- One review per user per road
);

CREATE INDEX idx_reviews_road_id ON reviews(road_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_score ON reviews(score);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

### Trigger for Road Stats
```sql
CREATE OR REPLACE FUNCTION update_road_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE roads 
    SET 
        rating_avg = (
            SELECT AVG(score) 
            FROM reviews WHERE road_id = NEW.road_id
        ),
        rating_count = (
            SELECT COUNT(*) FROM reviews WHERE road_id = NEW.road_id
        )
    WHERE id = NEW.road_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### SQLite Reviews Table
```sql
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    road_id TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    text TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, road_id)
);

CREATE INDEX idx_reviews_road_id ON reviews(road_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_score ON reviews(score);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

## TypeScript Types

```typescript
export type Review = {
  id: string;
  user_id: string;
  road_id: string;
  score: number; // 1-10
  text?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    username: string;
  };
};

export type ReviewCreateInput = {
  road_id: string;
  score: number; // 1-10
  text?: string;
};

export type ReviewUpdateInput = {
  score?: number; // 1-10
  text?: string;
};

export type ReviewSortOption = 'score_asc' | 'score_desc' | 'recency_asc' | 'recency_desc';
```

## Implementation Order

1. **Phase 1.1:** Update PostgreSQL schema (migration)
2. **Phase 1.2:** Create SQLite schema
3. **Phase 1.3:** Update TypeScript types
4. **Phase 2.1:** Update backend database queries
5. **Phase 2.2:** Add API endpoints
6. **Phase 2.3:** Integrate authentication
7. **Phase 3.1:** Update browser storage demo data
8. **Phase 3.2:** Create review UI components
9. **Phase 3.3:** Update road detail page
10. **Phase 3.4:** Integrate API calls
11. **Phase 4.1:** Write backend tests
12. **Phase 4.2:** Write frontend tests
13. **Phase 5.1:** Run CI/CD
14. **Phase 5.2:** Deploy and verify

## Notes

- Browser-only mode will use localStorage for reviews
- Backend mode will use PostgreSQL/SQLite
- Review aggregation will be calculated on-the-fly from reviews
- One review per user per road (enforced by UNIQUE constraint)
- Score range: 1-10
- Sorting: score (asc/desc), recency (asc/desc based on created_at)

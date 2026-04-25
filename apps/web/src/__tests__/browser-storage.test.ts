import {
  initializeBrowserStorage,
  getRoads,
  getRoad,
  createRoad,
  getReviews,
  createReview,
  getSavedRoutes,
  saveRoute,
  unsaveRoute,
  isRouteSaved,
} from '../lib/browser-storage';
import { Road, Review } from '../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('Browser Storage (Demo Mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize storage with demo roads', () => {
      initializeBrowserStorage();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      initializeBrowserStorage();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Roads CRUD', () => {
    it('should get roads from storage', () => {
      const mockRoads: Road[] = [
        {
          id: '1',
          name: 'Test Road',
          description: 'Test description',
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
          length_km: 10,
          rating_avg: 0,
          rating_count: 0,
          save_count: 0,
          tags: [],
          countries: [],
          region: '',
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockRoads));
      
      const roads = getRoads();
      expect(roads).toEqual(mockRoads);
    });

    it('should get a specific road by id', () => {
      const mockRoads: Road[] = [
        {
          id: '1',
          name: 'Test Road',
          description: 'Test description',
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
          length_km: 10,
          rating_avg: 0,
          rating_count: 0,
          save_count: 0,
          tags: [],
          countries: [],
          region: '',
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockRoads));
      
      const road = getRoad('1');
      expect(road).toEqual(mockRoads[0]);
    });

    it('should return null for non-existent road', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const road = getRoad('999');
      expect(road).toBeNull();
    });

    it('should create a new road', () => {
      const mockRoads: Road[] = [];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockRoads));
      
      const newRoad = createRoad({
        name: 'New Road',
        description: 'New description',
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        length_km: 15,
        tags: ['test'],
        countries: ['USA'],
        region: 'California',
      }, 'user1');

      expect(newRoad.name).toBe('New Road');
      expect(newRoad.rating_avg).toBe(0);
      expect(newRoad.rating_count).toBe(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Reviews CRUD', () => {
    it('should get reviews for a specific road', () => {
      const mockReviews: Review[] = [
        {
          id: '1',
          road_id: '1',
          user_id: 'user1',
          score: 8,
          text: 'Great road!',
          created_at: new Date().toISOString(),
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockReviews));
      
      const reviews = getReviews('1');
      expect(reviews).toEqual(mockReviews);
    });

    it('should create a new review', () => {
      const mockReviews: Review[] = [];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockReviews));
      
      const newReview = createReview({
        road_id: '1',
        user_id: 'user1',
        score: 9,
        text: 'Amazing drive!',
      });

      expect(newReview.road_id).toBe('1');
      expect(newReview.score).toBe(9);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should update road rating when review is created', () => {
      const mockRoads: Road[] = [
        {
          id: '1',
          name: 'Test Road',
          description: 'Test description',
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
          length_km: 10,
          rating_avg: 0,
          rating_count: 0,
          save_count: 0,
          tags: [],
          countries: [],
          region: '',
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ];
      const mockReviews: Review[] = [];
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'drive_routes_roads') return JSON.stringify(mockRoads);
        if (key === 'drive_routes_reviews') return JSON.stringify(mockReviews);
        return null;
      });
      
      createReview({
        road_id: '1',
        user_id: 'user1',
        score: 8,
        text: 'Good road',
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Saved Routes', () => {
    it('should save a route for a user', () => {
      const mockSavedRoutes: Record<string, string[]> = {};
      const mockRoads: Road[] = [
        {
          id: '1',
          name: 'Test Road',
          description: 'Test description',
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
          length_km: 10,
          rating_avg: 0,
          rating_count: 0,
          save_count: 0,
          tags: [],
          countries: [],
          region: '',
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ];
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'drive_routes_saved') return JSON.stringify(mockSavedRoutes);
        if (key === 'drive_routes_roads') return JSON.stringify(mockRoads);
        return null;
      });
      
      saveRoute('user1', '1');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should unsave a route for a user', () => {
      const mockSavedRoutes: Record<string, string[]> = { user1: ['1', '2'] };
      const mockRoads: Road[] = [
        {
          id: '1',
          name: 'Test Road',
          description: 'Test description',
          geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
          length_km: 10,
          rating_avg: 0,
          rating_count: 0,
          save_count: 0,
          tags: [],
          countries: [],
          region: '',
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ];
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'drive_routes_saved') return JSON.stringify(mockSavedRoutes);
        if (key === 'drive_routes_roads') return JSON.stringify(mockRoads);
        return null;
      });
      
      unsaveRoute('user1', '1');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should check if a route is saved', () => {
      const mockSavedRoutes: Record<string, string[]> = { user1: ['1', '2'] };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSavedRoutes));
      
      const isSaved = isRouteSaved('user1', '1');
      expect(isSaved).toBe(true);
    });

    it('should return false if route is not saved', () => {
      const mockSavedRoutes: Record<string, string[]> = { user1: ['1', '2'] };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSavedRoutes));
      
      const isSaved = isRouteSaved('user1', '3');
      expect(isSaved).toBe(false);
    });

    it('should get all saved routes for a user', () => {
      const mockSavedRoutes: Record<string, string[]> = { user1: ['1', '2', '3'] };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSavedRoutes));
      
      const savedRouteIds = getSavedRoutes('user1');
      expect(savedRouteIds).toEqual(['1', '2', '3']);
    });
  });
});

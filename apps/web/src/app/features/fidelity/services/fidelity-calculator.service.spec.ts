import { TestBed } from '@angular/core/testing';
import { FidelityCalculatorService } from './fidelity-calculator.service';
import { FidelityReward } from '../models/fidelity.models';

describe('FidelityCalculatorService', () => {
  let service: FidelityCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FidelityCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('pointsFor', () => {
    it('should calculate points correctly with rate 10', () => {
      expect(service.pointsFor(100, 10)).toBe(1000);
      expect(service.pointsFor(50.5, 10)).toBe(505);
      expect(service.pointsFor(1, 10)).toBe(10);
    });

    it('should round to nearest integer', () => {
      expect(service.pointsFor(10.4, 10)).toBe(104);
      expect(service.pointsFor(10.6, 10)).toBe(106);
    });

    it('should return 0 for zero or negative amounts', () => {
      expect(service.pointsFor(0, 10)).toBe(0);
      expect(service.pointsFor(-50, 10)).toBe(0);
    });

    it('should return 0 for zero or negative rate', () => {
      expect(service.pointsFor(100, 0)).toBe(0);
      expect(service.pointsFor(100, -1)).toBe(0);
    });
  });

  describe('applyReward', () => {
    it('should apply shipping reward', () => {
      const reward: FidelityReward = {
        id: 1,
        type: 'shipping',
        pointsRequired: 100,
        value: 0,
        label: 'Livraison offerte',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.applyReward(reward, 100);
      expect(result).toEqual({ freeShipping: true });
    });

    it('should apply fixed amount reward', () => {
      const reward: FidelityReward = {
        id: 2,
        type: 'amount',
        pointsRequired: 500,
        value: 5,
        label: '5 € de réduction',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.applyReward(reward, 100);
      expect(result).toEqual({ amount: 5 });
    });

    it('should cap fixed amount to cart total', () => {
      const reward: FidelityReward = {
        id: 2,
        type: 'amount',
        pointsRequired: 500,
        value: 150,
        label: '150 € de réduction',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.applyReward(reward, 100);
      expect(result).toEqual({ amount: 100 });
    });

    it('should apply percentage reward without cap', () => {
      const reward: FidelityReward = {
        id: 3,
        type: 'percent',
        pointsRequired: 2000,
        value: 15,
        label: '-15%',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.applyReward(reward, 200);
      expect(result).toEqual({ percent: 15, cap: undefined, amount: 30 });
    });

    it('should apply percentage reward with cap', () => {
      const reward: FidelityReward = {
        id: 4,
        type: 'percent',
        pointsRequired: 2000,
        value: 20,
        percentCap: 50,
        label: '-20% (plafonné à 50 €)',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 20% de 300 = 60€, mais plafonné à 50€
      const result = service.applyReward(reward, 300);
      expect(result).toEqual({ percent: 20, cap: 50, amount: 50 });
    });

    it('should apply gift reward', () => {
      const reward: FidelityReward = {
        id: 5,
        type: 'gift',
        pointsRequired: 4000,
        value: 0,
        giftProductId: 999,
        label: 'Goodie offert',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.applyReward(reward, 100);
      expect(result).toEqual({ giftProductId: 999 });
    });

    it('should return null for inactive reward', () => {
      const reward: FidelityReward = {
        id: 6,
        type: 'amount',
        pointsRequired: 100,
        value: 10,
        label: 'Inactive',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = service.applyReward(reward, 100);
      expect(result).toBeNull();
    });

    it('should return null for zero or negative cart amount', () => {
      const reward: FidelityReward = {
        id: 7,
        type: 'amount',
        pointsRequired: 100,
        value: 10,
        label: 'Test',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(service.applyReward(reward, 0)).toBeNull();
      expect(service.applyReward(reward, -50)).toBeNull();
    });
  });

  describe('calculateFinalAmount', () => {
    it('should subtract discount amount from cart total', () => {
      const discount = { amount: 20 };
      expect(service.calculateFinalAmount(100, discount)).toBe(80);
    });

    it('should not go below zero', () => {
      const discount = { amount: 150 };
      expect(service.calculateFinalAmount(100, discount)).toBe(0);
    });

    it('should return original amount if no discount', () => {
      expect(service.calculateFinalAmount(100, null)).toBe(100);
      expect(service.calculateFinalAmount(100, {})).toBe(100);
    });
  });

  describe('findNextReward', () => {
    const rewards: FidelityReward[] = [
      {
        id: 1,
        type: 'shipping',
        pointsRequired: 100,
        value: 0,
        label: '100 pts',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'amount',
        pointsRequired: 500,
        value: 5,
        label: '500 pts',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        type: 'amount',
        pointsRequired: 1000,
        value: 10,
        label: '1000 pts',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('should find the next reward', () => {
      const next = service.findNextReward(250, rewards);
      expect(next?.id).toBe(2);
      expect(next?.pointsRequired).toBe(500);
    });

    it('should return null if all rewards unlocked', () => {
      const next = service.findNextReward(1500, rewards);
      expect(next).toBeNull();
    });

    it('should ignore inactive rewards', () => {
      const rewardsWithInactive: FidelityReward[] = [
        ...rewards,
        {
          id: 99,
          type: 'amount',
          pointsRequired: 300,
          value: 3,
          label: 'Inactive',
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const next = service.findNextReward(250, rewardsWithInactive);
      expect(next?.id).toBe(2); // Saute la récompense inactive à 300 pts
    });
  });

  describe('findAvailableRewards', () => {
    const rewards: FidelityReward[] = [
      {
        id: 1,
        type: 'shipping',
        pointsRequired: 100,
        value: 0,
        label: '100 pts',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'amount',
        pointsRequired: 500,
        value: 5,
        label: '500 pts',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        type: 'amount',
        pointsRequired: 1000,
        value: 10,
        label: '1000 pts',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('should return all rewards at or below current points', () => {
      const available = service.findAvailableRewards(750, rewards);
      expect(available.length).toBe(2);
      expect(available[0].id).toBe(2); // 500 pts (trié par desc)
      expect(available[1].id).toBe(1); // 100 pts
    });

    it('should return empty array if no rewards available', () => {
      const available = service.findAvailableRewards(50, rewards);
      expect(available.length).toBe(0);
    });

    it('should ignore inactive rewards', () => {
      const rewardsWithInactive: FidelityReward[] = [
        ...rewards,
        {
          id: 99,
          type: 'amount',
          pointsRequired: 200,
          value: 2,
          label: 'Inactive',
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const available = service.findAvailableRewards(600, rewardsWithInactive);
      expect(available.length).toBe(2); // Ne compte pas la récompense inactive
    });
  });
});

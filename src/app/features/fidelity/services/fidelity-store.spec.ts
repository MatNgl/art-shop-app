import { TestBed } from '@angular/core/testing';
import { FidelityStore } from './fidelity-store';
import { FidelityCalculatorService } from './fidelity-calculator.service';

describe('FidelityStore', () => {
  let store: FidelityStore;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [FidelityStore, FidelityCalculatorService],
    });
    store = TestBed.inject(FidelityStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('getAccount', () => {
    it('should create a new account if it does not exist', () => {
      const account = store.getAccount(1);
      expect(account).toBeDefined();
      expect(account.userId).toBe(1);
      expect(account.points).toBe(0);
      expect(account.ledger).toEqual([]);
    });

    it('should return existing account', () => {
      const account1 = store.getAccount(1);
      const account2 = store.getAccount(1);
      expect(account1).toBe(account2);
    });
  });

  describe('earnPoints', () => {
    it('should credit points for a purchase', () => {
      const userId = 1;
      const points = store.earnPoints(userId, {
        orderId: 123,
        amountTtcAfterDiscounts: 100,
        items: [],
      });

      expect(points).toBe(1000); // 100 € * 10 pts/€
      const account = store.getAccount(userId);
      expect(account.points).toBe(1000);
      expect(account.ledger.length).toBe(1);
      expect(account.ledger[0].type).toBe('earn');
      expect(account.ledger[0].orderId).toBe(123);
    });

    it('should return 0 if program is disabled', () => {
      store.updateSettings({ enabled: false });
      const points = store.earnPoints(1, {
        orderId: 456,
        amountTtcAfterDiscounts: 50,
        items: [],
      });
      expect(points).toBe(0);
    });

    it('should return 0 for zero or negative amount', () => {
      expect(store.earnPoints(1, { orderId: 789, amountTtcAfterDiscounts: 0, items: [] })).toBe(0);
      expect(store.earnPoints(1, { orderId: 790, amountTtcAfterDiscounts: -10, items: [] })).toBe(
        0
      );
    });
  });

  describe('useReward', () => {
    beforeEach(() => {
      // Create a reward
      store.createReward({
        type: 'amount',
        pointsRequired: 500,
        value: 5,
        label: 'Test Reward',
        isActive: true,
      });
    });

    it('should debit points when using a reward', () => {
      const userId = 1;
      // Give user 600 points
      store.earnPoints(userId, {
        orderId: 100,
        amountTtcAfterDiscounts: 60,
        items: [],
      });

      const reward = store.rewards()[0];
      const result = store.useReward(userId, reward.id);

      expect(result.success).toBe(true);
      expect(result.appliedDiscount).toBeDefined();
      const account = store.getAccount(userId);
      expect(account.points).toBe(100); // 600 - 500
      expect(account.ledger.length).toBe(2);
      expect(account.ledger[0].type).toBe('use');
      expect(account.ledger[0].points).toBe(-500);
    });

    it('should fail if insufficient points', () => {
      const userId = 1;
      // Give user only 100 points
      store.earnPoints(userId, {
        orderId: 101,
        amountTtcAfterDiscounts: 10,
        items: [],
      });

      const reward = store.rewards()[0];
      const result = store.useReward(userId, reward.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('insuffisant');
    });

    it('should fail if reward is inactive', () => {
      const userId = 1;
      store.earnPoints(userId, {
        orderId: 102,
        amountTtcAfterDiscounts: 100,
        items: [],
      });

      const reward = store.rewards()[0];
      store.updateReward(reward.id, { isActive: false });

      const result = store.useReward(userId, reward.id);
      expect(result.success).toBe(false);
      expect(result.error).toContain('introuvable ou inactive');
    });
  });

  describe('adjustPoints', () => {
    it('should add points with positive delta', () => {
      const userId = 1;
      store.adjustPoints(userId, 150, 'Bonus spécial');

      const account = store.getAccount(userId);
      expect(account.points).toBe(150);
      expect(account.ledger.length).toBe(1);
      expect(account.ledger[0].type).toBe('adjust');
      expect(account.ledger[0].points).toBe(150);
      expect(account.ledger[0].note).toBe('Bonus spécial');
    });

    it('should subtract points with negative delta', () => {
      const userId = 1;
      store.earnPoints(userId, {
        orderId: 200,
        amountTtcAfterDiscounts: 100,
        items: [],
      });
      store.adjustPoints(userId, -300, 'Correction');

      const account = store.getAccount(userId);
      expect(account.points).toBe(700); // 1000 - 300
      expect(account.ledger.length).toBe(2);
    });

    it('should not go below zero', () => {
      const userId = 1;
      store.earnPoints(userId, {
        orderId: 201,
        amountTtcAfterDiscounts: 10,
        items: [],
      });
      store.adjustPoints(userId, -1000, 'Big correction');

      const account = store.getAccount(userId);
      expect(account.points).toBe(0);
    });

    it('should do nothing if delta is zero', () => {
      const userId = 1;
      store.adjustPoints(userId, 0, 'No change');

      const account = store.getAccount(userId);
      expect(account.ledger.length).toBe(0);
    });
  });

  describe('revokeForOrder', () => {
    it('should revoke points earned from a specific order', () => {
      const userId = 1;
      store.earnPoints(userId, {
        orderId: 300,
        amountTtcAfterDiscounts: 50,
        items: [],
      });

      const result = store.revokeForOrder(300);

      expect(result.success).toBe(true);
      expect(result.revokedPoints).toBe(500); // 50 € * 10 pts/€
      const account = store.getAccount(userId);
      expect(account.points).toBe(0);
      expect(account.ledger.length).toBe(2);
      expect(account.ledger[0].type).toBe('revoke');
    });

    it('should fail if order has no associated earn entry', () => {
      const result = store.revokeForOrder(999);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Aucune attribution');
    });
  });

  describe('CRUD Rewards', () => {
    it('should create a reward', () => {
      const reward = store.createReward({
        type: 'shipping',
        pointsRequired: 100,
        value: 0,
        label: 'Free Shipping',
        isActive: true,
      });

      expect(reward.id).toBeDefined();
      expect(reward.label).toBe('Free Shipping');
      expect(store.rewards().length).toBe(1);
    });

    it('should update a reward', () => {
      const reward = store.createReward({
        type: 'amount',
        pointsRequired: 200,
        value: 10,
        label: 'Test',
        isActive: true,
      });

      const updated = store.updateReward(reward.id, {
        label: 'Updated Label',
        value: 15,
      });

      expect(updated).toBeDefined();
      expect(updated!.label).toBe('Updated Label');
      expect(updated!.value).toBe(15);
    });

    it('should delete a reward', () => {
      const reward = store.createReward({
        type: 'gift',
        pointsRequired: 300,
        value: 0,
        giftProductId: 123,
        label: 'Gift',
        isActive: true,
      });

      store.deleteReward(reward.id);
      expect(store.rewards().length).toBe(0);
    });
  });

  describe('Settings', () => {
    it('should update settings', () => {
      store.updateSettings({ enabled: false, ratePerEuro: 5 });

      const settings = store.settings();
      expect(settings.enabled).toBe(false);
      expect(settings.ratePerEuro).toBe(5);
    });

    it('should persist settings to localStorage', () => {
      store.updateSettings({ ratePerEuro: 20 });

      // Create a new instance to test persistence
      const newStore = TestBed.inject(FidelityStore);
      expect(newStore.settings().ratePerEuro).toBe(20);
    });
  });

  describe('Persistence', () => {
    it('should persist accounts to localStorage', () => {
      store.earnPoints(1, {
        orderId: 400,
        amountTtcAfterDiscounts: 50,
        items: [],
      });

      // Create a new instance
      const newStore = TestBed.inject(FidelityStore);
      const account = newStore.getAccount(1);
      expect(account.points).toBe(500);
    });

    it('should persist rewards to localStorage', () => {
      store.createReward({
        type: 'amount',
        pointsRequired: 500,
        value: 5,
        label: 'Test',
        isActive: true,
      });

      const newStore = TestBed.inject(FidelityStore);
      expect(newStore.rewards().length).toBe(1);
    });
  });
});

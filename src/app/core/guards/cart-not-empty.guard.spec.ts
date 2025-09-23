import { cartNotEmptyGuard } from './cart-not-empty.guard';

describe('cartNotEmptyGuard', () => {
    it('should be a function', () => {
        expect(typeof cartNotEmptyGuard).toBe('function');
    });
});

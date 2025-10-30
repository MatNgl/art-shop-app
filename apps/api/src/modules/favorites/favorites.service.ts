import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favRepo: Repository<Favorite>,
  ) {}

  /**
   * Toggle favorite: Add if not exists, remove if exists
   * @returns { added: true } if added, { added: false } if removed
   */
  async toggle(
    userId: number,
    productId: number,
  ): Promise<{ added: boolean }> {
    const existing = await this.favRepo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.favRepo.remove(existing);
      return { added: false };
    }

    const favorite = this.favRepo.create({ userId, productId });
    await this.favRepo.save(favorite);
    return { added: true };
  }

  /**
   * Get all favorite product IDs for a user
   */
  async findByUser(userId: number): Promise<number[]> {
    const favorites = await this.favRepo.find({
      where: { userId },
      select: ['productId'],
    });
    return favorites.map((f) => f.productId);
  }

  /**
   * Check if a product is in user's favorites
   */
  async isFavorite(userId: number, productId: number): Promise<boolean> {
    const count = await this.favRepo.count({ where: { userId, productId } });
    return count > 0;
  }

  /**
   * Get all favorites for a user with product details
   */
  async findByUserWithProducts(userId: number): Promise<Favorite[]> {
    return this.favRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Remove a favorite by ID
   */
  async remove(userId: number, productId: number): Promise<void> {
    const favorite = await this.favRepo.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('Favori non trouvé');
    }

    await this.favRepo.remove(favorite);
  }

  /**
   * Remove all favorites for a user
   */
  async removeAllForUser(userId: number): Promise<void> {
    await this.favRepo.delete({ userId });
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  /**
   * Store a new refresh token in the database
   */
  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepo.create({
      userId,
      token,
      expiresAt,
    });

    return this.refreshTokenRepo.save(refreshToken);
  }

  /**
   * Find a refresh token by its value
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  /**
   * Validate a refresh token (exists, not revoked, not expired)
   */
  async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.findByToken(token);

    if (!refreshToken) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Token de rafraîchissement révoqué');
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement expiré');
    }

    return refreshToken;
  }

  /**
   * Rotate a refresh token (mark old as used, create new one)
   */
  async rotateRefreshToken(
    oldToken: string,
    newToken: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const oldRefreshToken = await this.validateRefreshToken(oldToken);

    // Mark old token as used and store reference to new token
    oldRefreshToken.usedAt = new Date();
    oldRefreshToken.replacedByToken = newToken;
    await this.refreshTokenRepo.save(oldRefreshToken);

    // Create new refresh token
    return this.createRefreshToken(
      oldRefreshToken.userId,
      newToken,
      expiresAt,
    );
  }

  /**
   * Revoke a refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.findByToken(token);

    if (refreshToken && !refreshToken.isRevoked) {
      refreshToken.isRevoked = true;
      refreshToken.revokedAt = new Date();
      await this.refreshTokenRepo.save(refreshToken);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllTokensForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  /**
   * Clean up expired tokens (can be run periodically via cron)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * Get all active refresh tokens for a user
   */
  async getActiveTokensForUser(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepo.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}

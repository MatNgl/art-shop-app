import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscribeDto } from './dto/subscribe.dto';

export interface SubscriptionStats {
  totalPlans: number;
  activePlans: number;
  totalSubscribers: number;
  activeSubscribers: number;
  byPlan: {
    planId: string;
    planName: string;
    subscriberCount: number;
  }[];
  revenue: {
    monthly: number;
    annual: number;
  };
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private readonly userSubRepo: Repository<UserSubscription>,
  ) {}

  /**
   * PLANS - CRUD
   */

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    // Vérifier que le slug est unique
    const existing = await this.planRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    const plan: SubscriptionPlan = this.planRepo.create(dto);
    return this.planRepo.save(plan);
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepo.find({
      where: {
        visibility: 'public',
        isActive: true,
        deprecated: false,
      },
      order: { displayOrder: 'ASC' },
    });
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan introuvable');
    }
    return plan;
  }

  async getPlanBySlug(slug: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { slug } });
    if (!plan) {
      throw new NotFoundException('Plan introuvable');
    }
    return plan;
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.getPlanById(id);

    // Si changement de slug, vérifier unicité
    if (dto.slug && dto.slug !== plan.slug) {
      const existing = await this.planRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException('Ce slug est déjà utilisé');
      }
    }

    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.getPlanById(id);

    // Vérifier qu'aucun abonnement actif n'utilise ce plan
    const activeSubscriptions = await this.userSubRepo.count({
      where: { planId: id, status: 'active' },
    });

    if (activeSubscriptions > 0) {
      throw new ConflictException(
        `Impossible de supprimer : ${activeSubscriptions} abonnement(s) actif(s) utilisent ce plan`,
      );
    }

    await this.planRepo.remove(plan);
  }

  /**
   * USER SUBSCRIPTIONS - Lifecycle
   */

  async subscribe(userId: string, dto: SubscribeDto): Promise<UserSubscription> {
    // Vérifier que le plan existe et est actif
    const plan = await this.getPlanById(dto.planId);
    if (!plan.isActive || plan.deprecated) {
      throw new BadRequestException('Ce plan n\'est plus disponible');
    }

    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existing = await this.userSubRepo.findOne({
      where: { userId, status: 'active' },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà un abonnement actif');
    }

    // Calculer les dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (dto.term === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription: UserSubscription = this.userSubRepo.create({
      userId,
      planId: dto.planId,
      term: dto.term,
      status: 'active',
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      autoRenew: dto.autoRenew ?? true,
      appliedMultiplier: plan.loyaltyMultiplier,
    });

    return this.userSubRepo.save(subscription);
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    return this.userSubRepo.findOne({
      where: { userId, status: 'active' },
      relations: ['plan'],
    });
  }

  async getAllUserSubscriptions(): Promise<UserSubscription[]> {
    return this.userSubRepo.find({
      relations: ['plan', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const subscription = await this.userSubRepo.findOne({
      where: { userId, status: 'active' },
    });

    if (!subscription) {
      throw new NotFoundException('Aucun abonnement actif trouvé');
    }

    subscription.status = 'canceled';
    subscription.autoRenew = false;
    subscription.canceledAt = new Date();

    return this.userSubRepo.save(subscription);
  }

  async reactivateSubscription(userId: string): Promise<UserSubscription> {
    const subscription = await this.userSubRepo.findOne({
      where: { userId, status: 'canceled' },
      order: { canceledAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('Aucun abonnement annulé trouvé');
    }

    // Vérifier que la période n'est pas expirée
    if (new Date() > subscription.currentPeriodEnd) {
      throw new BadRequestException('L\'abonnement a expiré, veuillez souscrire à nouveau');
    }

    subscription.status = 'active';
    subscription.autoRenew = true;
    subscription.canceledAt = null;

    return this.userSubRepo.save(subscription);
  }

  /**
   * ADMIN - Statistics
   */

  async getStats(): Promise<SubscriptionStats> {
    const [totalPlans, activePlans, totalSubscribers, activeSubscribers] =
      await Promise.all([
        this.planRepo.count(),
        this.planRepo.count({ where: { isActive: true, deprecated: false } }),
        this.userSubRepo.count(),
        this.userSubRepo.count({ where: { status: 'active' } }),
      ]);

    // Stats par plan
    const plans = await this.planRepo.find();
    const byPlan = await Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await this.userSubRepo.count({
          where: { planId: plan.id, status: 'active' },
        });
        return {
          planId: plan.id,
          planName: plan.name,
          subscriberCount,
        };
      }),
    );

    // Calcul des revenus (estimation simplifiée)
    const activeSubscriptions = await this.userSubRepo.find({
      where: { status: 'active' },
      relations: ['plan'],
    });

    const revenue = activeSubscriptions.reduce(
      (acc, sub) => {
        if (sub.term === 'monthly') {
          acc.monthly += Number(sub.plan.monthlyPrice);
        } else {
          acc.annual += Number(sub.plan.annualPrice);
        }
        return acc;
      },
      { monthly: 0, annual: 0 },
    );

    return {
      totalPlans,
      activePlans,
      totalSubscribers,
      activeSubscribers,
      byPlan,
      revenue,
    };
  }
}

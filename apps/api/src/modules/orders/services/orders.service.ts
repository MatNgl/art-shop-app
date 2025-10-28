import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      userId,
    });
    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    // Si userId fourni, vérifier que la commande appartient à l'utilisateur
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Accès refusé à cette commande');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId?: string): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Gérer les timestamps automatiques selon le statut
    if (updateOrderDto.status) {
      if (updateOrderDto.status === OrderStatus.SHIPPED && !order.shippedAt) {
        order.shippedAt = new Date();
      }
      if (updateOrderDto.status === OrderStatus.DELIVERED && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);

    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Mettre à jour les timestamps
    if (status === OrderStatus.SHIPPED && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    return this.orderRepository.save(order);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const order = await this.findOne(id, userId);
    await this.orderRepository.remove(order);
  }

  async getStats(): Promise<any> {
    const [total, pending, confirmed, processing, shipped, delivered, cancelled] =
      await Promise.all([
        this.orderRepository.count(),
        this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
        this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } }),
        this.orderRepository.count({ where: { status: OrderStatus.PROCESSING } }),
        this.orderRepository.count({ where: { status: OrderStatus.SHIPPED } }),
        this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
        this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
      ]);

    return {
      total,
      byStatus: {
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        cancelled,
      },
    };
  }
}

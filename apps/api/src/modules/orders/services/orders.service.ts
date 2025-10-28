import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async create(userId: number | null, createOrderDto: CreateOrderDto): Promise<Order> {
    // Créer la commande avec les items
    const order = this.orderRepository.create({
      userId,
      items: createOrderDto.items.map((item) =>
        this.orderItemRepository.create(item),
      ),
      subtotal: createOrderDto.subtotal,
      taxes: createOrderDto.taxes ?? 0,
      shipping: createOrderDto.shipping ?? 0,
      total: createOrderDto.total,
      status: 'pending',
      customer: createOrderDto.customer,
      payment: createOrderDto.payment,
      notes: createOrderDto.notes ?? null,
      orderType: createOrderDto.orderType ?? 'product',
      subscriptionId: createOrderDto.subscriptionId ?? null,
    });

    // Le orderNumber est généré automatiquement par le @BeforeInsert hook
    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId?: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items'],
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

  async update(id: number, updateOrderDto: UpdateOrderDto, userId?: number): Promise<Order> {
    const order = await this.findOne(id, userId);

    // Mettre à jour les champs simples
    if (updateOrderDto.status !== undefined) {
      order.status = updateOrderDto.status;
    }
    if (updateOrderDto.notes !== undefined) {
      order.notes = updateOrderDto.notes;
    }
    if (updateOrderDto.subtotal !== undefined) {
      order.subtotal = updateOrderDto.subtotal;
    }
    if (updateOrderDto.taxes !== undefined) {
      order.taxes = updateOrderDto.taxes;
    }
    if (updateOrderDto.shipping !== undefined) {
      order.shipping = updateOrderDto.shipping;
    }
    if (updateOrderDto.total !== undefined) {
      order.total = updateOrderDto.total;
    }
    if (updateOrderDto.customer !== undefined) {
      order.customer = updateOrderDto.customer;
    }
    if (updateOrderDto.payment !== undefined) {
      order.payment = updateOrderDto.payment;
    }
    if (updateOrderDto.orderType !== undefined) {
      order.orderType = updateOrderDto.orderType;
    }
    if (updateOrderDto.subscriptionId !== undefined) {
      order.subscriptionId = updateOrderDto.subscriptionId;
    }

    // Mettre à jour les items si fournis
    if (updateOrderDto.items !== undefined) {
      // Supprimer les anciens items
      await this.orderItemRepository.delete({ orderId: order.id });
      // Créer les nouveaux items
      order.items = updateOrderDto.items.map((item) =>
        this.orderItemRepository.create({ ...item, orderId: order.id }),
      );
    }

    return this.orderRepository.save(order);
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.orderRepository.save(order);
  }

  async updateNotes(id: number, notes: string): Promise<Order> {
    const order = await this.findOne(id);
    order.notes = notes;
    return this.orderRepository.save(order);
  }

  async remove(id: number, userId?: number): Promise<void> {
    const order = await this.findOne(id, userId);
    await this.orderRepository.remove(order);
  }

  async getStats(): Promise<any> {
    const [total, pending, processing, accepted, refused, delivered] =
      await Promise.all([
        this.orderRepository.count(),
        this.orderRepository.count({ where: { status: 'pending' } }),
        this.orderRepository.count({ where: { status: 'processing' } }),
        this.orderRepository.count({ where: { status: 'accepted' } }),
        this.orderRepository.count({ where: { status: 'refused' } }),
        this.orderRepository.count({ where: { status: 'delivered' } }),
      ]);

    return {
      total,
      byStatus: {
        pending,
        processing,
        accepted,
        refused,
        delivered,
      },
    };
  }
}

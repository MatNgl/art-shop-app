import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrintFormat } from '../entities/print-format.entity';
import { CreateFormatDto } from '../dto/create-format.dto';
import { UpdateFormatDto } from '../dto/update-format.dto';

@Injectable()
export class FormatsService {
  constructor(
    @InjectRepository(PrintFormat)
    private readonly formatRepository: Repository<PrintFormat>,
  ) {}

  async create(createFormatDto: CreateFormatDto): Promise<PrintFormat> {
    const format = this.formatRepository.create(createFormatDto);
    return this.formatRepository.save(format);
  }

  async findAll(): Promise<PrintFormat[]> {
    return this.formatRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PrintFormat> {
    const format = await this.formatRepository.findOne({ where: { id } });
    if (!format) {
      throw new NotFoundException('Format introuvable');
    }
    return format;
  }

  async update(id: string, updateFormatDto: UpdateFormatDto): Promise<PrintFormat> {
    const format = await this.findOne(id);
    Object.assign(format, updateFormatDto);
    return this.formatRepository.save(format);
  }

  async remove(id: string): Promise<void> {
    const format = await this.findOne(id);
    await this.formatRepository.remove(format);
  }
}

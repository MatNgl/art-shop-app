import { PartialType } from '@nestjs/swagger';
import { CreateFormatDto } from './create-format.dto';

export class UpdateFormatDto extends PartialType(CreateFormatDto) {}

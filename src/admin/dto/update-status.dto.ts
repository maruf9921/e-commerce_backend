import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}

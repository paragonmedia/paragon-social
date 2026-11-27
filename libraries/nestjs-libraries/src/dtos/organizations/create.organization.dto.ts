import { IsString, MaxLength, MinLength } from 'class-validator';

// Paragon Social: a new space (organization) created by an admin for a client
export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;
}

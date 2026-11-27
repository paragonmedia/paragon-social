import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AddCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class CreatePublicCommentDto extends AddCommentDto {
  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  anchorStart?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  anchorEnd?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  anchorQuote?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}

export class ResolveCommentDto {
  @IsBoolean()
  resolved: boolean;
}

// Paragon Social: the client's answer from the preview link
export class PostApprovalDto {
  @IsIn(['approve', 'changes'])
  action: 'approve' | 'changes';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  recaptchaToken?: string;
}

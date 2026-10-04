import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { availableBoardArticleSorts } from '../../config';

@InputType()
export class BoardArticleInput {
	@IsNotEmpty()
	@Field(() => BoardArticleCategory)
	articleCategory: BoardArticleCategory | undefined;

	@IsNotEmpty()
	@Length(3, 50)
	@Field(() => String)
	articleTitle: string | undefined;

	@IsNotEmpty()
	@Length(3, 250)
	@Field(() => String)
	articleContent: string | undefined;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;

	memberId?: mongoose.ObjectId;
}

@InputType()
class BAISearch {
	@IsOptional()
	@Field(() => BoardArticleCategory, { nullable: true })
	articleCategory?: BoardArticleCategory;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;
}

@InputType()
export class BoardArticlesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number | undefined;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number | undefined;

	@IsOptional()
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsOptional()
	@Field(() => BAISearch)
	search: BAISearch | undefined;
}

@InputType()
class ABAISearch {
	@IsOptional()
	@Field(() => BoardArticleStatus, { nullable: true })
	articleStatus?: BoardArticleStatus;

	@IsOptional()
	@Field(() => BoardArticleCategory, { nullable: true })
	articleCategory?: BoardArticleCategory;
}

@InputType()
export class AllBoardArticlesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number | undefined;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number | undefined;

	@IsOptional()
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ABAISearch)
	search: ABAISearch | undefined;
}

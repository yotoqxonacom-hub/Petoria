import { ObjectId } from 'mongoose';
import { ProductService } from './product.service';
import { ProductsInquiry } from '../../libs/dto/product/product.input';
import {
	ProductGender,
	ProductLocation,
	ProductSpecies,
	ProductStatus,
	ProductType,
} from '../../libs/enums/product.enum';
import { T } from '../../libs/types/common';

// uuid v14 is ESM-only and cannot be loaded by the current ts-jest setup
jest.mock('uuid', () => ({ v4: () => 'uuid' }));

describe('ProductService.getProducts', () => {
	let pipeline: T[];
	let service: ProductService;

	beforeEach(() => {
		pipeline = [];
		const productModel = {
			aggregate: (stages: T[]) => {
				pipeline = stages;
				return { exec: () => Promise.resolve([{ list: [], metaCounter: [] }]) };
			},
		};
		service = new ProductService(productModel as any, {} as any, {} as any, {} as any);
		jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => jest.restoreAllMocks());

	const getMatch = (): T => pipeline[0].$match as T;

	it('always restricts to ACTIVE products', async () => {
		const input = { page: 1, limit: 10, search: {} } as ProductsInquiry;
		await service.getProducts(null as unknown as ObjectId, input);

		expect(getMatch()).toEqual({ productStatus: ProductStatus.ACTIVE });
	});

	it('maps product filters to the $match stage', async () => {
		const input = {
			page: 1,
			limit: 10,
			search: {
				typeList: [ProductType.PET, ProductType.FOOD],
				speciesList: [ProductSpecies.DOG],
				genderList: [ProductGender.FEMALE],
				locationList: [ProductLocation.SEOUL],
				pricesRange: { start: 100, end: 500 },
				text: 'puppy',
			},
		} as ProductsInquiry;
		await service.getProducts(null as unknown as ObjectId, input);

		const match = getMatch();
		expect(match.productStatus).toBe(ProductStatus.ACTIVE);
		expect(match.productType).toEqual({ $in: [ProductType.PET, ProductType.FOOD] });
		expect(match.productSpecies).toEqual({ $in: [ProductSpecies.DOG] });
		expect(match.productGender).toEqual({ $in: [ProductGender.FEMALE] });
		expect(match.productLocation).toEqual({ $in: [ProductLocation.SEOUL] });
		expect(match.productPrice).toEqual({ $gte: 100, $lte: 500 });
		expect(match.productTitle).toEqual({ $regex: /puppy/i });
	});

	it('ignores empty filter lists', async () => {
		const input = {
			page: 1,
			limit: 10,
			search: { typeList: [], speciesList: [], genderList: [], locationList: [] },
		} as unknown as ProductsInquiry;
		await service.getProducts(null as unknown as ObjectId, input);

		expect(getMatch()).toEqual({ productStatus: ProductStatus.ACTIVE });
	});
});

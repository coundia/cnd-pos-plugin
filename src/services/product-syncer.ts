// src/plugins/pos-plugin/services/product-syncer.service.ts
import { Injectable, Inject } from '@nestjs/common';
import {
	RequestContext,
	RequestContextService,
	ProductService,
	Logger,
} from '@vendure/core';
import { ApolloClient, InMemoryCache, createHttpLink, gql, ApolloError } from '@apollo/client/core';
import fetch from 'cross-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { POS_PLUGIN_OPTIONS } from '../ui/constantes/constants';
import { PluginInitOptions } from '../types';
import { ISyncer } from './syncer.interface';
import {
	CreateProductInput,
	UpdateProductInput,
	DeletionResult,
} from '@vendure/common/lib/generated-types';
import {AdminTokenService} from "./admin-token.service";

@Injectable()
export class ProductSyncer implements ISyncer<any, any> {
	readonly entityName = 'Product';

	private apollo: ApolloClient<any>;

	private GET_PRODUCTS = gql`
    query AdminGetProducts($options: ProductListOptions) {
      products(options: $options) {
        items { id name slug createdAt updatedAt }
        totalItems
      }
    }
  `;

	private CREATE_PRODUCT = gql`
    mutation AdminCreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) { id name }
    }
  `;

	private UPDATE_PRODUCT = gql`
    mutation AdminUpdateProduct($input: UpdateProductInput!) {
      updateProduct(input: $input) { id name }
    }
  `;

	private DELETE_PRODUCT = gql`
    mutation AdminDeleteProduct($id: ID!) {
      deleteProduct(id: $id) { result }
    }
  `;

	constructor(
		@Inject(POS_PLUGIN_OPTIONS) private options: PluginInitOptions,
		private ctxService: RequestContextService,
		private productService: ProductService,
		private adminTokenService: AdminTokenService,
	) {
		// 1) Determine the admin token
		const token =
			this.options.authToken ||
			this.adminTokenService.getStoredToken() ||
			(() => {
				Logger.error('No token.txt found and authToken empty', 'ProductSyncer');
				return '';
			})();

		Logger.info("Generated token: ", 'ProductSyncer');
		Logger.info(token, 'ProductSyncer');


		// 2) Configure Apollo Client
		this.apollo = new ApolloClient({
			link: createHttpLink({
				uri: this.options.adminApiUrl  ,
				fetch,
				headers: { Authorization: `Bearer ${token}` },
			}),
			cache: new InMemoryCache(),
		});

		Logger.info(`ProductSyncer initialized (adminApiUrl=${this.options.adminApiUrl})`, 'ProductSyncer');
	}

	async fetchRemote(ctx: RequestContext): Promise<any[]> {
		Logger.info(`[${this.entityName}] fetchRemote start`, 'ProductSyncer');
		const all: any[] = [];
		let skip = 0;
		const take = 100;
		while (true) {
			try {
				const { data } = await this.apollo.query<{
					products: { items: any[]; totalItems: number };
				}>({
					query: this.GET_PRODUCTS,
					variables: { options: { skip, take } },
					fetchPolicy: 'network-only',
				});
				const { items, totalItems } = data.products;
				if (items.length === 0) break;
				all.push(...items);
				skip += take;
				if (all.length >= totalItems) break;
			} catch (err) {
				this.logApolloError('fetchRemote', err);
				break;
			}
		}
		Logger.info(`[${this.entityName}] fetchRemote fetched ${all.length}`, 'ProductSyncer');
		return all;
	}

	async fetchLocal(ctx: RequestContext): Promise<any[]> {
		Logger.info(`[${this.entityName}] fetchLocal start`, 'ProductSyncer');
		const adminCtx = await this.ctxService.create({ apiType: 'admin' });
		const { items } = await this.productService.findAll(adminCtx, { take: 1000 });
		Logger.info(`[${this.entityName}] fetchLocal fetched ${items.length}`, 'ProductSyncer');
		return items;
	}

	async push(ctx: RequestContext, items: any[]): Promise<void> {
		Logger.info(`[${this.entityName}] push ${items.length}`, 'ProductSyncer');
		for (const item of items) {
			try {
				await this.updateRemote({ id: item.id });
			} catch (err) {
				Logger.error(`Failed to push Product id=${item.id} `, 'ProductSyncer');
			}
		}
	}

	async pull(ctx: RequestContext, items: any[]): Promise<void> {
		Logger.info(`[${this.entityName}] pull ${items.length}`, 'ProductSyncer');
		// for (const remote of items) {
		// 	try {
		// 		await this.createLocal({  slug: remote.slug });
		// 	} catch (err) {
		// 		Logger.error(`Failed to pull Product remote-id=${remote.id}: ${err.message}`, 'ProductSyncer');
		// 	}
		// }
	}

	async deleteLocal(ctx: RequestContext, ids: string[]): Promise<void> {
		Logger.info(`[${this.entityName}] deleteLocal ${ids.join(',')}`, 'ProductSyncer');
		const adminCtx = await this.ctxService.create({ apiType: 'admin' });
		for (const id of ids) {
			await this.productService.softDelete(adminCtx, id);
		}
	}

	private logApolloError(method: string, err: any) {
		if (err instanceof ApolloError) {
			Logger.error(`[${this.entityName}] ${method} ApolloError: ${err.message}`, 'ProductSyncer');
		} else {
			Logger.error(`[${this.entityName}] ${method} Unknown error: ${err}`, 'ProductSyncer');
		}
	}

	async createRemote(input: CreateProductInput): Promise<any> {
		Logger.info(`[${this.entityName}] createRemote `, 'ProductSyncer');
		try {
			const { data } = await this.apollo.mutate<{ createProduct: any }>({
				mutation: this.CREATE_PRODUCT,
				variables: { input },
			});
			return data?.createProduct;
		} catch (err) {
			this.logApolloError('createRemote', err);
			throw err;
		}
	}

	async updateRemote(input: UpdateProductInput): Promise<any> {
		Logger.info(`[${this.entityName}] updateRemote id=${input.id}`, 'ProductSyncer');
		try {
			const { data } = await this.apollo.mutate<{ updateProduct: any }>({
				mutation: this.UPDATE_PRODUCT,
				variables: { input },
			});
			return data?.updateProduct;
		} catch (err) {
			this.logApolloError('updateRemote', err);
			throw err;
		}
	}


	async createLocal(input: CreateProductInput): Promise<any> {
		Logger.info(`[${this.entityName}] createLocal  `, 'ProductSyncer');
		const adminCtx = await this.ctxService.create({ apiType: 'admin' });
		return this.productService.create(adminCtx, input);
	}

	async updateLocal(input: UpdateProductInput): Promise<any> {
		Logger.info(`[${this.entityName}] updateLocal id=${input.id}`, 'ProductSyncer');
		const adminCtx = await this.ctxService.create({ apiType: 'admin' });
		return this.productService.update(adminCtx, input);
	}
}

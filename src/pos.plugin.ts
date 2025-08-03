// src/plugins/pos-plugin/pos-plugin.ts

import * as path from 'path';
import { AdminUiExtension } from '@vendure/ui-devkit/compiler';
import {
	ChannelService,
	CustomerService,
	Logger,
	PluginCommonModule,
	ShippingMethodService,
	VendurePlugin,
} from '@vendure/core';
import { OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { POS_PLUGIN_OPTIONS } from './ui/constantes/constants';
import { PluginInitOptions } from './types';

import {
	OnPlaceShippingCalculator,
	OnPlaceShippingEligibilityChecker,
} from './ui/components/config/on-place-shipping';
import { PartialPaymentHandler } from './partial-payment/partial-payment-method-handler';

import { PaymentSubscriber } from './subscriber/payment-subscriber';
import { OrderPlacedSubscriber } from './subscriber/order-placed-subscriber';
import { ChangeLogSubscriber } from './subscriber/change-log.subscriber';

import { TransactionEntry } from './entities/transaction-entry.entity';
import { TransactionEntryTranslation } from './entities/transaction-entry-translation.entity';
import { ChangeLog } from './entities/change-log.entity';
import { SyncCursor } from './entities/sync-cursor.entity';

import { TransactionEntryService } from './services/transaction-entry.service';
import { ChangeLogService } from './services/change-log.service';
import { SyncCursorService } from './services/sync-cursor.service';

import { SyncOrchestrator } from './services/sync-orchestrator.service';
import { ProductSyncer } from './services/product-syncer';
import { AdminTokenService } from './services/admin-token.service';

import { TransactionEntryAdminResolver } from './api/transaction-entry-admin.resolver';
import { SyncResolver } from './api/sync.resolver';
import { adminApiExtensions } from './api/api-extensions';
import {bootstrapPos} from "./ui/components/application-bootstrap/bootstrap";
import {AdminTokenResolver} from "./api/admin-token.resolver";

@VendurePlugin({
	imports: [PluginCommonModule],
	providers: [
		// Provide the remote Admin API URL under the expected key `adminApiUrl`
		{
			provide: POS_PLUGIN_OPTIONS,
			useFactory: (): PluginInitOptions => ({
				adminApiUrl: process.env.API_REMOTE_INSTANCE,
				authToken: '', // will be loaded/generated via AdminTokenService
			}),
		},

		// Event subscribers
		PaymentSubscriber,
		OrderPlacedSubscriber,
		ChangeLogSubscriber,

		// Core services
		TransactionEntryService,
		ChangeLogService,
		SyncCursorService,

		// Sync machinery
		SyncOrchestrator,
		ProductSyncer,
		AdminTokenService,

		// Collect all syncers under 'SYNCERS' token
		{
			provide: 'SYNCERS',
			useFactory: (productSyncer: ProductSyncer) => [productSyncer],
			inject: [ProductSyncer],
		},
	],
	entities: [TransactionEntry, TransactionEntryTranslation, ChangeLog, SyncCursor],
	adminApiExtensions: {
		schema: adminApiExtensions,
		resolvers: [
			TransactionEntryAdminResolver,
			SyncResolver,
			AdminTokenResolver
		],
	},
	configuration: config => {
		config.shippingOptions = {
			...config.shippingOptions,
			shippingEligibilityCheckers: [
				...(config.shippingOptions?.shippingEligibilityCheckers ?? []),
				OnPlaceShippingEligibilityChecker,
			],
			shippingCalculators: [
				...(config.shippingOptions?.shippingCalculators ?? []),
				OnPlaceShippingCalculator,
			],
		};
		config.paymentOptions.paymentMethodHandlers.push(PartialPaymentHandler);
		return config;
	},
	compatibility: '^3.0.0',
})
export class CndPosPlugin implements OnApplicationBootstrap {
	static options: PluginInitOptions;

	constructor(private moduleRef: ModuleRef) {}

	async onApplicationBootstrap(): Promise<void> {
		const channelService = this.moduleRef.get(ChannelService, { strict: false });
		const shippingMethodService = this.moduleRef.get(ShippingMethodService, { strict: false });
		const customerService = this.moduleRef.get(CustomerService, { strict: false });
		const tokenService = this.moduleRef.get(AdminTokenService, { strict: false });

		// Bootstrap: generate token + init shipping & anonymous customer
		await bootstrapPos(
			channelService,
			shippingMethodService,
			customerService,
			tokenService,
		);

		Logger.info('CndPosPlugin OnApplicationBootstrap', 'CndPosPlugin');
	}

	static init(options: PluginInitOptions): typeof CndPosPlugin {
		this.options = options;
		return CndPosPlugin;
	}

	static ui: AdminUiExtension = {
		id: 'pos-ui',
		extensionPath: path.join(__dirname, 'ui'),
		routes: [{ route: 'pos', filePath: 'routes.ts' }],
		providers: ['providers.ts'],
		translations: {
			en: path.join(__dirname, 'ui/i18n/en.custom.json'),
			fr: path.join(__dirname, 'ui/i18n/fr.custom.json'),
		},
	};
}

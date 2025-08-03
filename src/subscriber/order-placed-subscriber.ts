import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
	EventBus,
	OrderStateTransitionEvent,
	RefundEvent,
	RequestContext,
} from '@vendure/core';
import { TransactionEntryService } from '../services/transaction-entry.service';
import { TransactionEntryType } from '../entities/transaction-entry.entity';
import { Logger } from '@vendure/core';

@Injectable()
export class OrderPlacedSubscriber implements OnApplicationBootstrap {
	constructor(
		private eventBus: EventBus,
		private transactionEntryService: TransactionEntryService,
	) {}

	onApplicationBootstrap(): void {
 		//this.eventBus.ofType(OrderStateTransitionEvent).subscribe(event => this.handleOrderPaid(event));

 		this.eventBus.ofType(RefundEvent).subscribe(event => this.handleRefundCreated(event));
	}

	private async handleRefundCreated(event: RefundEvent) {
 		try {
			const ctx: RequestContext = event.ctx;
			const refund = event.refund;
			const orderCode = event.order.code;
			await this.transactionEntryService.create(ctx, {
				amount: refund.total / 100,
				description: `Remboursement commande ${orderCode}`,
				code: 'REFUND:'+orderCode,
				dateTransaction: new Date(),
				typeEntry: TransactionEntryType.DEBIT,
				translations: [],
			});
			Logger.info(`DEBIT entry enregistrée pour le REFUND de la commande ${orderCode}`, 'OrderPlacedSubscriber');
		} catch (err) {
			Logger.error(`Erreur lors de la création de la REFUND entry pour le refund de ${event.order.code}`, undefined, 'OrderPlacedSubscriber');
		}
	}
}

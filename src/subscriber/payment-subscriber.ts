import { Injectable } from '@nestjs/common';
import { Logger, Payment, RequestContext } from '@vendure/core';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { TransactionEntryService } from '../services/transaction-entry.service';
import { TransactionEntryType } from '../entities/transaction-entry.entity';

@Injectable()
export class PaymentSubscriber implements EntitySubscriberInterface<Payment> {
	constructor(
		dataSource: DataSource,
		private transactionEntryService: TransactionEntryService,
	) {
		// On enregistre ce subscriber auprès de TypeORM
		dataSource.subscribers.push(this);
	}

	listenTo() {
		return Payment;
	}

	async beforeInsert(event: InsertEvent<Payment>) {
		Logger.info('****NEW PAYMENT****', 'PaymentSubscriber');

		let amountReceived = event.entity.metadata?.amount ?? 0;
		const amountTotal = event.entity.amount;

		const orderCode = event.entity.order.code ?? event.entity.id.toString();

		let note = '';
		if (amountReceived < amountTotal) {
			amountReceived = amountReceived * 1;
			event.entity.amount = amountReceived;
			note = 'Paiement partiel de '+orderCode;
		} else {
			amountReceived = amountTotal;
			note = 'Paiement comptant : '+orderCode ;
		}

		const amountRestant = amountTotal - amountReceived;

		Logger.info(`▶ Total = ${amountTotal / 100}`, 'PaymentSubscriber');
		Logger.info(`▶ Reçu = ${amountReceived / 100}`, 'PaymentSubscriber');
		Logger.info(`▶ Restant = ${amountRestant / 100}`, 'PaymentSubscriber');

		// Met à jour les metadata du paiement
		event.entity.metadata = {
			...event.entity.metadata,
			note: event.entity.metadata?.note ?? note,
			amountReceived: amountReceived / 100,
			amountTotal: amountTotal / 100,
			amountRestant: amountRestant / 100,
			amount: event.entity.metadata?.amount / 100,
		};

		try {
			const ctx = (event.queryRunner?.data?.ctx as RequestContext) ?? RequestContext.empty();

			await this.transactionEntryService.create(ctx, {
				amount: amountReceived / 100,
				description: note || `Paiement commande ${orderCode ?? ''}`,
				code: "PAYMENT:"+orderCode ,
				dateTransaction: new Date(),
				typeEntry: TransactionEntryType.CREDIT,
				translations: [],
			});

			Logger.info(`TransactionEntry SALE créée pour le paiement ${orderCode}`, 'PaymentSubscriber');
		} catch (err) {
			Logger.error(`Erreur lors de la création de TransactionEntry ${orderCode}`, 'PaymentSubscriber');
		}
	}

	beforeUpdate(event: UpdateEvent<Payment>) {
		// même principe si vous voulez intercepter les updates
	}
}

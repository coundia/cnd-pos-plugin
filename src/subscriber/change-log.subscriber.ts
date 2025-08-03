import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
	EventBus,
	VendureEntityEvent,
	ProductEvent,
	CustomerEvent,
	OrderEvent,
	RequestContext,
	Logger,
	ProcessContext,
} from '@vendure/core';
import { ChangeLogService } from '../services/change-log.service';

@Injectable()
export class ChangeLogSubscriber implements OnApplicationBootstrap {
	constructor(
		private eventBus: EventBus,
		private changeLogService: ChangeLogService,
		private processContext: ProcessContext,
	) {}

	onApplicationBootstrap(): void {
		// todo
		// if (!this.processContext.isWorker) {
		// 	Logger.info('ChangeLogSubscriber actif uniquement côté WORKER', 'ChangeLogSubscriber');
		// 	return;
		//}

		Logger.info('ChangeLogSubscriber démarré (WORKER)', 'ChangeLogSubscriber');

		// 🔹 Écoute des ProductEvent & CustomerEvent
		const entityEventTypes = [ProductEvent, CustomerEvent] as const;
		for (const evtType of entityEventTypes) {
			this.eventBus
				.ofType<VendureEntityEvent<any, any>>(evtType)
				.subscribe(event => this.handleEntityEvent(event));
		}

		// 🔹 Écoute des OrderEvent (si tu veux traquer les commandes aussi)
		this.eventBus.ofType<OrderEvent>(OrderEvent).subscribe(event => this.handleOrderEvent(event));
	}

	private async handleEntityEvent(event: VendureEntityEvent<any, any>) {
		try {
			const ctx = event.ctx as RequestContext;
			const entityName = event.entity.constructor.name;
			const entityId = (event.entity as { id: string }).id;

			await this.changeLogService.create(ctx, {
				entityName,
				entityId,
				operation: event.type, // 'created' | 'updated' | 'deleted'
				metadata: "",
			});

			Logger.info(
				`ChangeLog ${event.type} enregistré pour ${entityName} #${entityId}`,
				'ChangeLogSubscriber',
			);
		} catch (err) {
			Logger.error(
				`Erreur ChangeLog pour ${event.entity.constructor.name}`,
				'ChangeLogSubscriber'
			);
		}
	}

	private async handleOrderEvent(event: OrderEvent) {
		try {
			const ctx = event.ctx as RequestContext;
			const orderId = (event.order as { id: string }).id;

			await this.changeLogService.create(ctx, {
				entityName: 'Order',
				entityId: orderId,
				operation: event.type,
				metadata: "",
			});

			Logger.info(
				`ChangeLog ${event.type} enregistré pour Order #${event.order.code}`,
				'ChangeLogSubscriber',
			);
		} catch (err) {
			Logger.error(
				`Erreur ChangeLog pour Order #${event.order.code}`,
				'ChangeLogSubscriber'
			);
		}
	}
}

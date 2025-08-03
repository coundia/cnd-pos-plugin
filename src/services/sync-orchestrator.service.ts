import { Injectable, Inject } from '@nestjs/common';
import { Logger, RequestContext } from '@vendure/core';
import { ChangeLogService } from './change-log.service';
import { SyncCursorService } from './sync-cursor.service';
import { ISyncer } from './syncer.interface';

@Injectable()
export class SyncOrchestrator {
	constructor(
		@Inject('SYNCERS') private syncers: ISyncer<any, any>[],
		private changeLogService: ChangeLogService,
		private syncCursorService: SyncCursorService,
	) {}

	async runIncremental(ctx: RequestContext): Promise<void> {
		Logger.info('Début de runIncremental()', 'SyncOrchestrator');

		for (const syncer of this.syncers) {
			Logger.info(`Traitement de ${syncer.entityName}`, 'SyncOrchestrator');

			const existing = await this.syncCursorService.findOneByEntity(ctx, syncer.entityName);
			Logger.info(`Curseur pour ${syncer.entityName}: ${existing?.lastProcessed}`, 'SyncOrchestrator');

			const since = existing?.lastProcessed;
			const changes = await this.changeLogService.findByEntitySince(ctx, syncer.entityName, since);
			Logger.info(`Nombre de changements pour ${syncer.entityName}: ${changes.items.length}`, 'SyncOrchestrator');

			for (const change of changes.items) {
				const idStr = String(change.entityId);
				Logger.info(
					`Changement ${change.operation} sur ${syncer.entityName} id=${idStr} at ${change.updatedAt}`,
					'SyncOrchestrator',
				);

				if (change.operation === 'deleted' && syncer.deleteLocal) {
					Logger.info(`Suppression locale de ${syncer.entityName} id=${idStr}`, 'SyncOrchestrator');
					await syncer.deleteLocal(ctx, [change.entityId]);
				} else {
					// 1) Fetch all local items
					Logger.info(`Requête locale pour ${syncer.entityName}`, 'SyncOrchestrator');
					const localList = await syncer.fetchLocal(ctx);
					Logger.info(
						`[${syncer.entityName}] fetchLocal items: ${localList.map(i => i.id).join(', ')}`,
						'SyncOrchestrator',
					);

					// 2) Compare as strings
					const local = localList.find(item => String(item.id) === idStr);
					if (local) {
						Logger.info(`Push de ${syncer.entityName} id=${idStr}`, 'SyncOrchestrator');
						await syncer.push(ctx, [local]);

						Logger.info(`Fetch remote pour ${syncer.entityName} id=${idStr}`, 'SyncOrchestrator');
						const remoteList = await syncer.fetchRemote(ctx);
						const remote = remoteList.filter(r => String(r.id) === idStr);
						if (remote.length) {
							Logger.info(`Pull de ${syncer.entityName} id=${idStr}`, 'SyncOrchestrator');
							await syncer.pull(ctx, remote);
						}
					} else {
						Logger.info(`Aucune entité locale trouvée pour ${syncer.entityName} id=${idStr}`, 'SyncOrchestrator');
					}
				}

				// 3) Update the cursor
				await this.syncCursorService.upsert(ctx, {
					entityName: syncer.entityName,
					lastProcessed: change.updatedAt,
					metadata: '',
				});
				Logger.info(`Curseur mis à jour pour ${syncer.entityName} à ${change.updatedAt}`, 'SyncOrchestrator');
			}
		}

		Logger.info('Fin de runIncremental()', 'SyncOrchestrator');
	}
}

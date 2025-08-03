// src/plugins/sync-plugin/services/sync-cursor.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { DeletionResponse, DeletionResult } from '@vendure/common/lib/generated-types';
import { ID, PaginatedList } from '@vendure/common/lib/shared-types';
import {
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    TransactionalConnection,
    assertFound,
    patchEntity,
} from '@vendure/core';
import { SyncCursor } from '../entities/sync-cursor.entity';
import { PluginInitOptions } from '../types';
import { POS_PLUGIN_OPTIONS } from '../ui/constantes/constants';

interface CreateSyncCursorInput {
    entityName: string;
    lastProcessed: Date;
    metadata: string;
}
interface UpdateSyncCursorInput {
    id: ID;
    entityName?: string;
    lastProcessed?: Date;
    metadata?: string;
}

@Injectable()
export class SyncCursorService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder,
        @Inject(POS_PLUGIN_OPTIONS) private options: PluginInitOptions,
    ) {}

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<SyncCursor>,
        relations?: RelationPaths<SyncCursor>,
    ): Promise<PaginatedList<SyncCursor>> {
        return this.listQueryBuilder
            .build(SyncCursor, options, { ctx, relations })
            .getManyAndCount()
            .then(([items, totalItems]) => ({ items, totalItems }));
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<SyncCursor>,
    ): Promise<SyncCursor | null> {
        return this.connection.getRepository(ctx, SyncCursor).findOne({ where: { id }, relations });
    }

    async create(ctx: RequestContext, input: CreateSyncCursorInput): Promise<SyncCursor> {
        const cursor = new SyncCursor(input);
        const saved = await this.connection.getRepository(ctx, SyncCursor).save(cursor);
        return assertFound(this.findOne(ctx, saved.id));
    }

    async update(ctx: RequestContext, input: UpdateSyncCursorInput): Promise<SyncCursor> {
        const repo = this.connection.getRepository(ctx, SyncCursor);
        const entity = await this.connection.getEntityOrThrow(ctx, SyncCursor, input.id);
        const patched = patchEntity(entity, input);
        await repo.save(patched, { reload: false });
        return assertFound(this.findOne(ctx, patched.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const repo = this.connection.getRepository(ctx, SyncCursor);
        const entity = await this.connection.getEntityOrThrow(ctx, SyncCursor, id);
        try {
            await repo.remove(entity);
            return { result: DeletionResult.DELETED };
        } catch (err: any) {
            return { result: DeletionResult.NOT_DELETED, message: err.message };
        }
    }

    /** Recherche le curseur par nom d’entité */
    async findOneByEntity(ctx: RequestContext, entityName: string): Promise<SyncCursor | null> {
        return this.connection.getRepository(ctx, SyncCursor).findOne({ where: { entityName } });
    }

    /** Crée ou met à jour le curseur */
    async upsert(
        ctx: RequestContext,
        input: { entityName: string; lastProcessed: Date; metadata: string },
    ): Promise<SyncCursor> {
        const repo = this.connection.getRepository(ctx, SyncCursor);
        let cursor = await repo.findOne({ where: { entityName: input.entityName } });
        if (cursor) {
            cursor.lastProcessed = input.lastProcessed;
            cursor.metadata = input.metadata;
        } else {
            cursor = new SyncCursor({
                entityName: input.entityName,
                lastProcessed: input.lastProcessed,
                metadata: input.metadata,
            });
        }
        return repo.save(cursor);
    }
}

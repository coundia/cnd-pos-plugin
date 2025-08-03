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
    patchEntity
} from '@vendure/core';
import { ChangeLog } from '../entities/change-log.entity';
import { PluginInitOptions } from '../types';
import { POS_PLUGIN_OPTIONS } from '../ui/constantes/constants';
import {SortOrder} from "../ui/graphql/graphql";

// These can be replaced by generated types if you set up code generation
interface CreateChangeLogInput {
    entityName: string;
    entityId: string;
    operation: string;
    metadata: string;
    // Define the input fields here
}
interface UpdateChangeLogInput {
    id: ID;
    entityName?: string;
    entityId?: string;
    operation?: string;
    metadata?: string;
    // Define the input fields here
}

@Injectable()
export class ChangeLogService {
    constructor(
        private connection: TransactionalConnection,
        private listQueryBuilder: ListQueryBuilder, @Inject(POS_PLUGIN_OPTIONS) private options: PluginInitOptions
    ) {}

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<ChangeLog>,
        relations?: RelationPaths<ChangeLog>,
    ): Promise<PaginatedList<ChangeLog>> {
        return this.listQueryBuilder
            .build(ChangeLog, options, {
                relations,
                ctx,
            }
            ).getManyAndCount().then(([items, totalItems]) => {
                return {
                    items,
                    totalItems,
                }
            }
            );
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<ChangeLog>,
    ): Promise<ChangeLog | null> {
        return this.connection
            .getRepository(ctx, ChangeLog)
            .findOne({
                where: { id },
                relations,
            });
    }

    async create(ctx: RequestContext, input: CreateChangeLogInput): Promise<ChangeLog> {
        const newEntityInstance = new ChangeLog(input);
        const newEntity = await this.connection.getRepository(ctx, ChangeLog).save(newEntityInstance);
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateChangeLogInput): Promise<ChangeLog> {
        const entity = await this.connection.getEntityOrThrow(ctx, ChangeLog, input.id);
        const updatedEntity = patchEntity(entity, input);
        await this.connection.getRepository(ctx, ChangeLog).save(updatedEntity, { reload: false });
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, ChangeLog, id);
        try {
            await this.connection.getRepository(ctx, ChangeLog).remove(entity);
            return {
                result: DeletionResult.DELETED,
            };
        } catch (e: any) {
            return {
                result: DeletionResult.NOT_DELETED,
                message: e.toString(),
            };
        }
    }

    async findByEntitySince(
        ctx: RequestContext,
        entityName: string,
        since?: Date,
    ): Promise<PaginatedList<ChangeLog>> {
        return this.listQueryBuilder
            .build(
                ChangeLog,
                {
                    filter: {
                        entityName: { eq: entityName },
                         ...(since ? { updatedAt: { after: since } } : {}),
                    },
                    sort: { updatedAt: SortOrder.ASC },
                },
                { ctx },
            )
            .getManyAndCount()
            .then(([items, totalItems]) => ({ items, totalItems }));
    }

}

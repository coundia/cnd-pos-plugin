import {Inject, Injectable, OnModuleInit} from '@nestjs/common';
import {DeletionResponse, DeletionResult, JobState} from '@vendure/common/lib/generated-types';
import {CustomFieldsObject, ID, PaginatedList} from '@vendure/common/lib/shared-types';
import {
    assertFound,
    CustomFieldRelationService,
    JobQueue,
    JobQueueService,
    ListQueryBuilder,
    ListQueryOptions,
    RelationPaths,
    RequestContext,
    SerializedRequestContext,
    TransactionalConnection,
    TranslatableSaver,
    Translated,
    TranslationInput,
    TranslatorService
} from '@vendure/core';
import {POS_PLUGIN_OPTIONS} from '../ui/constantes/constants';
import {TransactionEntryTranslation} from '../entities/transaction-entry-translation.entity';
import {TransactionEntry} from '../entities/transaction-entry.entity';
import {PluginInitOptions} from '../types';

// These can be replaced by generated types if you set up code generation
interface CreateTransactionEntryInput {
    amount: number;
    description: string;
    code: string;
    typeEntry?: string;
    dateTransaction?: Date;
     customFields?: CustomFieldsObject;
    translations: Array<TranslationInput<TransactionEntry>>;
}
interface UpdateTransactionEntryInput {
    id: ID;
    amount?: number;
    description?: string;
    code?: string;
    typeEntry?: string;
    dateTransaction?: Date;
     customFields?: CustomFieldsObject;
    translations: Array<TranslationInput<TransactionEntry>>;
}

@Injectable()
export class TransactionEntryService implements OnModuleInit {
    private transactionEntryJobsQueue: JobQueue<{ ctx: SerializedRequestContext, someArg: string; }>;

    constructor(
        private connection: TransactionalConnection,
        private translatableSaver: TranslatableSaver,
        private listQueryBuilder: ListQueryBuilder,
        private customFieldRelationService: CustomFieldRelationService,
        private translator: TranslatorService, @Inject(POS_PLUGIN_OPTIONS) private options: PluginInitOptions, private jobQueueService: JobQueueService
    ) {}

    public async onModuleInit(): Promise<void> {
        this.transactionEntryJobsQueue = await this.jobQueueService.createQueue({
            name: 'transaction-entry-jobs',
            process: async job => {
                // Deserialize the RequestContext from the job data
                const ctx = RequestContext.deserialize(job.data.ctx);
                // The "someArg" property is passed in when the job is triggered
                const someArg = job.data.someArg;

                // Inside the `process` function we define how each job
                // in the queue will be processed.
                // Let's simulate some long-running task
                const totalItems = 10;
                for (let i = 0; i < totalItems; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // You can optionally respond to the job being cancelled
                    // during processing. This can be useful for very long-running
                    // tasks which can be cancelled by the user.
                    if (job.state === JobState.CANCELLED) {
                        throw new Error('Job was cancelled');
                    }

                    // Progress can be reported as a percentage like this
                    job.setProgress(Math.floor(i / totalItems * 100));
                }

                // The value returned from the `process` function is stored
                // as the "result" field of the job
                return {
                    processedCount: totalItems,
                    message: `Successfully processed ${totalItems} items`,
                };
            },
        })
    }

    findAll(
        ctx: RequestContext,
        options?: ListQueryOptions<TransactionEntry>,
        relations?: RelationPaths<TransactionEntry>,
    ): Promise<PaginatedList<Translated<TransactionEntry>>> {
        return this.listQueryBuilder
            .build(TransactionEntry, options, {
                relations,
                ctx,
            }
            ).getManyAndCount().then(([items, totalItems]) => {
                return {
                    items: items.map(item => this.translator.translate(item, ctx)),
                    totalItems,
                }
            }
            );
    }

    findOne(
        ctx: RequestContext,
        id: ID,
        relations?: RelationPaths<TransactionEntry>,
    ): Promise<Translated<TransactionEntry> | null> {
        return this.connection
            .getRepository(ctx, TransactionEntry)
            .findOne({
                where: { id },
                relations,
            }).then(entity => entity && this.translator.translate(entity, ctx));
    }

    async create(ctx: RequestContext, input: CreateTransactionEntryInput): Promise<Translated<TransactionEntry>> {
        const newEntity = await this.translatableSaver.create({
            ctx,
            input,
            entityType: TransactionEntry,
            translationType: TransactionEntryTranslation,
            beforeSave: async f => {
                // Any pre-save logic can go here
            },
        });
        await this.customFieldRelationService.updateRelations(ctx, TransactionEntry, input, newEntity);
        return assertFound(this.findOne(ctx, newEntity.id));
    }

    async update(ctx: RequestContext, input: UpdateTransactionEntryInput): Promise<Translated<TransactionEntry>> {
        const updatedEntity = await this.translatableSaver.update({
            ctx,
            input,
            entityType: TransactionEntry,
            translationType: TransactionEntryTranslation,
            beforeSave: async f => {
                // Any pre-save logic can go here
            },
        });
        await this.customFieldRelationService.updateRelations(ctx, TransactionEntry, input, updatedEntity);
        return assertFound(this.findOne(ctx, updatedEntity.id));
    }

    async delete(ctx: RequestContext, id: ID): Promise<DeletionResponse> {
        const entity = await this.connection.getEntityOrThrow(ctx, TransactionEntry, id);
        try {
            await this.connection.getRepository(ctx, TransactionEntry).remove(entity);
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

    public triggerTransactionEntryJobs(ctx: RequestContext) {
        return this.transactionEntryJobsQueue.add({
            ctx: ctx.serialize(),
            someArg: 'foo',
        })
    }

    async deleteAll(ctx: RequestContext, ids: ID[]): Promise<DeletionResponse> {
        for (const id of ids) {
            await this.delete(ctx, id);
        }
        return {
            result: DeletionResult.DELETED,
        };
    }
}

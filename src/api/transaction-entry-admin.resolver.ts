import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {DeletionResponse, Permission} from '@vendure/common/lib/generated-types';
import {CustomFieldsObject} from '@vendure/common/lib/shared-types';
import {
    Allow,
    Ctx,
    ID,
    ListQueryOptions,
    PaginatedList,
    RelationPaths,
    Relations,
    RequestContext,
    Transaction,
    TranslationInput
} from '@vendure/core';
import {TransactionEntry} from '../entities/transaction-entry.entity';
import {TransactionEntryService} from '../services/transaction-entry.service';

// These can be replaced by generated types if you set up code generation
interface CreateTransactionEntryInput {
    amount: number;
    description: string;
    code: string;
    dateTransaction: Date ;

    customFields?: CustomFieldsObject;
    translations: Array<TranslationInput<TransactionEntry>>;
}
interface UpdateTransactionEntryInput {
    id: ID;
    amount?: number;
    description?: string;
    code?: string;
    dateTransaction: Date ;

    customFields?: CustomFieldsObject;
    translations: Array<TranslationInput<TransactionEntry>>;
}

@Resolver()
export class TransactionEntryAdminResolver {
    constructor(private transactionEntryService: TransactionEntryService) {}

    @Query()
    @Allow(Permission.SuperAdmin)
    async transactionEntry(
        @Ctx() ctx: RequestContext,
        @Args() args: { id: ID },
        @Relations(TransactionEntry) relations: RelationPaths<TransactionEntry>,
    ): Promise<TransactionEntry | null> {
        return this.transactionEntryService.findOne(ctx, args.id, relations);
    }

    @Query()
    @Allow(Permission.SuperAdmin)
    async transactionEntries(
        @Ctx() ctx: RequestContext,
        @Args() args: { options: ListQueryOptions<TransactionEntry> },
        @Relations(TransactionEntry) relations: RelationPaths<TransactionEntry>,
    ): Promise<PaginatedList<TransactionEntry>> {
        return this.transactionEntryService.findAll(ctx, args.options || undefined, relations);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async createTransactionEntry(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: CreateTransactionEntryInput },
    ): Promise<TransactionEntry> {
        return this.transactionEntryService.create(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async updateTransactionEntry(
        @Ctx() ctx: RequestContext,
        @Args() args: { input: UpdateTransactionEntryInput },
    ): Promise<TransactionEntry> {
        return this.transactionEntryService.update(ctx, args.input);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async deleteTransactionEntry(@Ctx() ctx: RequestContext, @Args() args: { id: ID }): Promise<DeletionResponse> {
        return this.transactionEntryService.delete(ctx, args.id);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.SuperAdmin)
    async deleteTransactionEntries(
        @Ctx() ctx: RequestContext,
        @Args() args: { ids: ID[] },
    ): Promise<DeletionResponse> {
        return this.transactionEntryService.deleteAll(ctx, args.ids);
    }

}

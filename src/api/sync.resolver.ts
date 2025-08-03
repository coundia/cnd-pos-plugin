import { Resolver, Mutation } from '@nestjs/graphql';
import {Allow, RequestContext} from '@vendure/core';
import {Permission} from '@vendure/common/lib/generated-types';

import {

	Ctx,
} from '@vendure/core';

import { SyncOrchestrator } from '../services/sync-orchestrator.service';

@Resolver()
export class SyncResolver {
	constructor(private orchestrator: SyncOrchestrator) {}

	@Mutation()
	@Allow(Permission.SuperAdmin)
	async syncIncremental(@Ctx() ctx: RequestContext): Promise<boolean> {
		await this.orchestrator.runIncremental(ctx);
		return true;
	}
}

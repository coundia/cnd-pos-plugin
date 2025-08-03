import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
	AuthService,
	Logger,
	RequestContext,
	RequestContextService,
} from '@vendure/core';
import { AuthenticationInput } from '@vendure/common/lib/generated-types';
import { NotVerifiedError } from '@vendure/core/dist/common/error/generated-graphql-shop-errors';

@Resolver()
export class AdminTokenResolver {
	constructor(
		private authService: AuthService,
		private ctxService: RequestContextService,
	) {}

	@Mutation()
	async issueAdminToken(
		@Args('input') input: AuthenticationInput,
	): Promise<string> {
		Logger.info('issueAdminToken', 'AdminTokenResolver');

		const ctx: RequestContext = await this.ctxService.create({ apiType: 'admin' });

		if (!input.native) {
			throw new Error('Only native authentication is supported');
		}

		Logger.info(`Issuing admin token for ${input.native.username}`, 'AdminTokenResolver');
		const sessionOrError = await this.authService.authenticate(
			ctx,
			'admin',
			'native',
			input.native,
		);
		if (!('token' in sessionOrError)) {
			throw new Error('Authentication failed: ' + sessionOrError.message);
		}

		const sessionResult = await this.authService.createAuthenticatedSessionForUser(
			ctx,
			sessionOrError.user,
			'native',
		);
		if (sessionResult instanceof NotVerifiedError) {
			Logger.error(`Session could not be verified: ${sessionResult.message}`, 'AdminTokenResolver');
			throw new Error('Session could not be verified');
		}

		Logger.info('AdminTokenResolver: returning token string', 'AdminTokenResolver');
		return sessionResult.token;
	}
}

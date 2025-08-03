// src/plugins/pos-plugin/services/admin-token.service.ts

import { Injectable, Inject } from '@nestjs/common';
import {
	ApolloClient,
	InMemoryCache,
	createHttpLink,
	gql,
	ApolloError,
	FetchResult,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { POS_PLUGIN_OPTIONS } from '../ui/constantes/constants';
import { PluginInitOptions } from '../types';
import {Logger} from "@vendure/core";

@Injectable()
export class AdminTokenService {
	private tokenFile = path.join(process.cwd(), 'token.txt');

	private readonly LOGIN_MUTATION = gql`
    mutation AdminLogin($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        ... on CurrentUser {
          token
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `;

	private client: ApolloClient<any>;

	constructor(@Inject(POS_PLUGIN_OPTIONS) private options: PluginInitOptions) {
		if (!options.adminApiUrl) {
			throw new Error('AdminTokenService requires options.adminApiUrl');
		}
		Logger.info(
			`AdminTokenService initialized; will call remote admin API at ${options.adminApiUrl}`,
			'AdminTokenService',
		);
		this.client = new ApolloClient({
			link: createHttpLink({
				uri: options.adminApiUrl,
				fetch,
			}),
			cache: new InMemoryCache(),
		});
	}

	/**
	 * Calls the remote Admin API login mutation and saves the returned JWT to token.txt
	 */
	async generatePermanentToken(username: string, password: string): Promise<string> {
		Logger.info(
			`Calling login mutation at ${this.options.adminApiUrl}`,
			'AdminTokenService',
		);
		try {
			const response: FetchResult = await this.client.mutate({
				mutation: this.LOGIN_MUTATION,
				variables: { username, password },
			});

			// If there were GraphQL-level errors, log them in full:
			if (response.errors && response.errors.length) {
				response.errors.forEach(err => {
					Logger.error(
						`[GraphQLError] ${err.message}\n${JSON.stringify(err.extensions, null, 2)}`,
						'AdminTokenService',
					);
				});
				throw new Error('GraphQL errors occurred');
			}

			const result = response.data?.login;
			if (!result) {
				throw new Error('No data returned from login mutation');
			}
			if ('errorCode' in result && result.errorCode) {
				// This is your server-side ErrorResult
				const msg = `ErrorResult: ${result.errorCode} – ${result.message}`;
				Logger.error(msg, 'AdminTokenService');
				throw new Error(msg);
			}
			if (!result.token) {
				throw new Error('Login succeeded but no token field was returned');
			}

			fs.writeFileSync(this.tokenFile, result.token, 'utf8');
			Logger.info(`Token successfully saved to ${this.tokenFile}`, 'AdminTokenService');
			return result.token;

		} catch (err: any) {
			if (err instanceof ApolloError) {
				// Network or GraphQL transport errors
				if (err.networkError) {
					Logger.error(
						`[NetworkError] ${JSON.stringify(err.networkError, null, 2)}`,
						'AdminTokenService',
					);
				}
				if (err.graphQLErrors && err.graphQLErrors.length) {
					err.graphQLErrors.forEach(e => {
						Logger.error(`[GraphQL] ${e.message}`, 'AdminTokenService');
					});
				}
				throw err;
			} else {
				// Other errors
				Logger.error(`Unexpected error: ${err.message || err}`, 'AdminTokenService');
				throw err;
			}
		}
	}

	/** Reads the saved token from disk, if present */
	getStoredToken(): string | null {
		if (fs.existsSync(this.tokenFile)) {
			return fs.readFileSync(this.tokenFile, 'utf8').trim();
		}
		return null;
	}
}

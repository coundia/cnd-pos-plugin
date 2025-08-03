import { RequestContext } from '@vendure/core';

export interface ISyncer<TLocal, TRemote> {
	/**
	 * Retourne la liste distante modifiée depuis la dernière date
	 */
	fetchRemote(ctx: RequestContext, since?: Date): Promise<TRemote[]>;
	/**
	 * Retourne la liste locale modifiée depuis la dernière date
	 */
	fetchLocal(ctx: RequestContext, since?: Date): Promise<TLocal[]>;
	/**
	 * Upsert local → remote
	 */
	push(ctx: RequestContext, locals: TLocal[]): Promise<void>;
	/**
	 * Upsert remote → local
	 */
	pull(ctx: RequestContext, remotes: TRemote[]): Promise<void>;
	/**
	 * Supprime local → remote
	 */
	deleteRemote?(ctx: RequestContext, ids: string[]): Promise<void>;
	/**
	 * Supprime remote → local
	 */
	deleteLocal?(ctx: RequestContext, ids: string[]): Promise<void>;
	/**
	 * Nom de l’entité, pour le logging
	 */
	entityName: string;
}

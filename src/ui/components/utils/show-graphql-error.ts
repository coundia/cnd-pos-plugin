import {NotificationService} from '@vendure/admin-ui/core';

interface ErrorResult {
	errorCode: string;
	message: string;
	__typename: string;
}

type MutationResponse<T extends { [key: string]: any }> = {
	data?: T;
};

/**
 * Checks a single‐field mutation response for an OrderModificationError (or any Error union),
 * and if one is found, shows it via the NotificationService.
 *
 * @param response The raw gql result object
 * @param mutationName The key under response.data that holds the payload
 * @param notificationService Vendure’s NotificationService
 * @returns true if it found & displayed an error; false if there was no error
 */
export function hasError<T extends Record<string, any>>(
	response: MutationResponse<T>,
	mutationName: keyof T & string,
	notificationService: NotificationService
): boolean {
	const payload = response.data?.[mutationName] as ErrorResult | undefined;
	if (payload?.errorCode) {
		// If the GraphQL union branch was the error type, payload.__typename ends with “Error”
		notificationService.error(payload.message);
		return true;
	}
	return false;
}

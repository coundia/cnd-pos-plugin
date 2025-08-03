import {LanguageCode, RequestContext} from "@vendure/core";

export async function initShippingMethod(channelService:any,shippingMethodService:any) {

	const defaultChannel = await channelService.getDefaultChannel();

	// On crée un RequestContext "fictif"
	const ctx = new RequestContext({
		authorizedAsOwnerOnly: false,
		apiType: 'admin',
		channel: defaultChannel,
		isAuthorized: true
	});

	const existing = await shippingMethodService.findAll(ctx, {
		filter: {code: {eq: 'on-place'}},
	});
	if (existing.totalItems === 0) {
		await shippingMethodService.create(
			ctx,
			{
				code: 'on-place',
				fulfillmentHandler: 'manual-fulfillment',
				checker: {
					code: 'on-place-checker',
					arguments: [],
				},
				calculator: {
					code: 'on-place-calculator',
					arguments: [],
				},
				translations: [
					{
						languageCode: LanguageCode.en,
						name: 'Pickup On Place',
						description: 'Come to the shop to get your order',
					},
					{
						languageCode: LanguageCode.fr,
						name: 'Paye sur place',
						description: 'Tu peux payer sur place',
					},

				],
			}
		);
		console.log('[CndPosPlugin] ✅ on-place shipping method created');
	}
}
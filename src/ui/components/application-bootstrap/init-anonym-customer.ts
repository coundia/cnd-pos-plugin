import {ChannelService, CustomerService, RequestContext} from '@vendure/core';

export async function initAnonymCustomer(
	channelService: ChannelService,
	customerService: CustomerService,
): Promise<void> {
	const channel = await channelService.getDefaultChannel();
	const ctx = new RequestContext({
		apiType: 'admin',
		isAuthorized: true,
		authorizedAsOwnerOnly: false,
		channel,
	});

	const existing = await customerService.findAll(ctx, {
		filter: {
			emailAddress: { eq: 'anonymous@domain.local' },
		},
	});

	if (existing.totalItems === 0) {
		await customerService.create(ctx, {
			firstName: 'Anonymous',
			lastName: 'Customer',
			phoneNumber: 'Customer',
			title: 'Guest Customer ',
			emailAddress: 'anonymous@domain.local',
		});
		console.log('[CndPosPlugin] ✅ anonymous customer created');
	}
}

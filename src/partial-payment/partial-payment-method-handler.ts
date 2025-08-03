import {
	CreatePaymentResult,
	LanguageCode,
	Logger,
	Order,
	Payment,
	PaymentMethodHandler,
	RequestContext,
	SettlePaymentResult,
} from '@vendure/core';

export const PartialPaymentHandler = new PaymentMethodHandler({
	code: 'partial-payment',
	description: [
		{ languageCode: LanguageCode.en, value: 'Partial Payment' },
		{ languageCode: LanguageCode.fr, value: 'Paiement partiel' },
	],
	// Aucun argument de config externe
	args: {},

	/**
	 * addPaymentToOrder(input: { orderId, method, amount, metadata })
	 */
	createPayment: async (
		ctx: RequestContext,
		order: Order,
		amount: number,
		args,
		metadata: any,
	): Promise<CreatePaymentResult> => {
		// Si on a passé un montant dans metadata, on l'utilise
		const payable = metadata?.amount != null ? metadata.amount : amount;

		// Ici vous pouvez appeler un API tierce, envoyer un e-mail, etc.
		Logger.info(
			`▶ PartialPayment.createPayment: order=${order.id}, payable=${payable}, note=${metadata?.note ?? '—'}`,
			'PartialPaymentPlugin',
		);

		return {
			amount: payable,
			state: 'Settled',  // ou 'Authorized' selon votre flow
			transactionId: `PARTIAL-${order.id}-${Date.now()}`,
			metadata: {
				note: metadata?.note,
				requestedAmount: metadata?.amount,
			},
		};
	},

	settlePayment: async (
		ctx: RequestContext,
		order: Order,
		payment: Payment,
		args,
	): Promise<SettlePaymentResult> => {
		Logger.verbose(
			`✔ PartialPayment.settlePayment: payment=${payment.id}`,
			'PartialPaymentPlugin',
		);
		return { success: true };
	},
});

import {Apollo} from 'apollo-angular';
import {SET_BILLING_ADDRESS, SET_SHIPPING_ADDRESS} from "../../constantes/constantes.graphql";
import {CreateAddressInput} from "../../graphql/graphql";

interface OrderResult {
	id: string;
}

export const ADDRESS: CreateAddressInput = {
	streetLine1: 'THIES - PA - SUR PLACE',
	city: 'THIES',
	postalCode: '21000',
	countryCode: 'SN',
}

export function sendBillingAddress(apollo: Apollo, orderId: string) {
	return apollo
		.mutate<{ setDraftOrderBillingAddress: OrderResult }>({
			mutation: SET_BILLING_ADDRESS,
			variables: {orderId: orderId,input: ADDRESS},
		});
}

export function sendShippingAddress(apollo: Apollo, orderId: string) {

	return apollo
		.mutate<{ setDraftOrderShippingAddress: OrderResult }>({
			mutation: SET_SHIPPING_ADDRESS,
			variables: {orderId: orderId,input: ADDRESS},
		});
}

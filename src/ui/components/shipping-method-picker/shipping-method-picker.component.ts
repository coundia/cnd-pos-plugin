import {Apollo} from 'apollo-angular';
import {map, switchMap, take} from 'rxjs/operators';
import {ELIGIBLE_SHIPPING_METHODS, SET_SHIPPING_METHOD} from "../../constantes/constantes.graphql";


interface ShippingMethod {
	id: string;
	code: string;
	description: string;
	price: any;
}

type SetShippingMethodResult =
	| { __typename: 'Order'; id: string }
	| { __typename: 'ErrorResult'; errorCode: string; message: string };


export function sendShippingMethod(apollo: Apollo, orderId: string, selectedId: string) {

	return apollo
		.mutate<{ setDraftOrderShippingMethod: SetShippingMethodResult }>({
			mutation: SET_SHIPPING_METHOD,
			variables: {
				orderId: orderId,
				shippingMethodId: selectedId,
			},
		});
}

export function updateShippingMethod(apollo: Apollo, orderId: string) {
	return apollo
		.watchQuery<{ eligibleShippingMethodsForDraftOrder: ShippingMethod[] }>({
			query: ELIGIBLE_SHIPPING_METHODS,
			variables: { orderId },
		})
		.valueChanges.pipe(
			take(1),   // ← on ne veut que la première émission
			map(res => res.data.eligibleShippingMethodsForDraftOrder),
			switchMap(methods => {
				const method = methods.find(m => m.code === 'on-place');
				return sendShippingMethod(apollo, orderId, method?.id ?? '1');
			})
		);
}
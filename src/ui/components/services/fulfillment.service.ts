// src/plugins/pos-plugin/services/fulfillment.helper.ts

import {Apollo, gql} from 'apollo-angular';
import {Observable, throwError} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {CreateFulfillmentError, Fulfillment,} from '../../graphql/graphql';

export const OrderDetailDocument = gql`
  query OrderDetailQueryDetails($id: ID!) {
    order(id: $id) {
      ...OrderDetail
      __typename
    }
  }

  fragment OrderLine on OrderLine {
    id
    quantity
    __typename
  }

  fragment OrderDetail on Order {
    id
    lines {
      ...OrderLine
    }
    __typename
  }
`;

/** Le type du résultat de la requête OrderDetailQuery */
export type OrderDetailQuery = {
	order: {
		id: string;
		lines: Array<{
			id: string;
			quantity: number;
			__typename: 'OrderLine';
		}>;
		__typename: 'Order';
	};
};

/** Les variables de OrderDetailQuery */
export type OrderDetailQueryVariables = {
	id: string;
};

export interface FulfillmentLineInput {
	orderLineId: string;
	quantity: number;
}

export interface FulfillmentHandlerArgument {
	name: string;
	value: string;
}

export interface CreateFulfillmentInput {
	lines: FulfillmentLineInput[];
	handler: {
		code: string;
		arguments: FulfillmentHandlerArgument[];
	};
}

const CREATE_FULFILLMENT_MUTATION = gql`
  mutation CreateFulfillment($input: FulfillOrderInput!) {
    addFulfillmentToOrder(input: $input) {
      ...Fulfillment
      ... on CreateFulfillmentError {
        errorCode
        message
        fulfillmentHandlerError
      }
      ... on FulfillmentStateTransitionError {
        errorCode
        message
        transitionError
      }
      ...ErrorResult
    }
  }

  fragment Fulfillment on Fulfillment {
    id
    state
    nextStates
    createdAt
    updatedAt
    method
    lines {
      orderLineId
      quantity
    }
    trackingCode
  }

  fragment ErrorResult on ErrorResult {
    errorCode
    message
  }
`;

const TRANSITION_FULFILLMENT_MUTATION = gql`
  mutation TransitionFulfillmentToState($id: ID!, $state: String!) {
    transitionFulfillmentToState(id: $id, state: $state) {
      ...Fulfillment
      ...ErrorResult
      ... on FulfillmentStateTransitionError {
        errorCode
        message
        transitionError
      }
    }
  }

  fragment Fulfillment on Fulfillment {
    id
    state
    nextStates
    createdAt
    updatedAt
    method
    lines {
      orderLineId
      quantity
    }
    trackingCode
  }

  fragment ErrorResult on ErrorResult {
    errorCode
    message
  }
`;

/**
 * Crée un fulfillment avec l’input fourni.
 * Émet une erreur si le serveur retourne un ErrorResult ou CreateFulfillmentError.
 */
export function createFulfillment(
	apollo: Apollo,
	input: CreateFulfillmentInput,
): Observable<Fulfillment> {
	return apollo
		.mutate<{ addFulfillmentToOrder: Fulfillment | CreateFulfillmentError }>({
			mutation: CREATE_FULFILLMENT_MUTATION,
			variables: { input },
		})
		.pipe(
			map(res => {
				const result = res.data?.addFulfillmentToOrder;
				if (!result) {
					throw new Error('Aucune donnée retournée par createFulfillment');
				}
				if ('errorCode' in result) {
					throw new Error(result.message);
				}
				return result as Fulfillment;
			}),
			catchError(err => throwError(() => err)),
		);
}

/**
 * Passe le fulfillment `$id` à l’état `$state`.
 * Émet une erreur si le serveur retourne un ErrorResult ou FulfillmentStateTransitionError.
 */
export function transitionFulfillmentToState(
	apollo: Apollo,
	id: string,
	state: string,
): Observable<Fulfillment> {
	return apollo
		.mutate<{ transitionFulfillmentToState: Fulfillment | CreateFulfillmentError & { transitionError?: string } }>({
			mutation: TRANSITION_FULFILLMENT_MUTATION,
			variables: { id, state },
		})
		.pipe(
			map(res => {
				const result = res.data?.transitionFulfillmentToState;
				if (!result) {
					throw new Error('Aucune réponse du serveur pour la transition');
				}
				if ('errorCode' in result) {
					throw new Error(
						`${result.message}${result.transitionError ? ` (${result.transitionError})` : ''}`
					);
				}
				return result as Fulfillment;
			}),
			catchError(err => throwError(() => err)),
		);
}

/**
 * Crée un fulfillment pour chaque ligne (quantité = ligne.quantity),
 * puis le passe immédiatement en "Shipped".
 */
export function fulfillAndShipAllLines(
	apollo: Apollo,
	orderId: string,
): Observable<Fulfillment> {
	return apollo
		.query<OrderDetailQuery, OrderDetailQueryVariables>({
			query: OrderDetailDocument,
			variables: { id: orderId },
		})
		.pipe(
			map(res =>
				res.data.order.lines.map(line => ({
					orderLineId: line.id,
					quantity: line.quantity,
				}))
			),
			map(lines => ({
				lines,
				handler: {
					code: 'manual-fulfillment',
					arguments: [
						{ name: 'method', value: 'method' },
						{ name: 'trackingCode', value: 'track' },
					],
				},
			}) as CreateFulfillmentInput),
			switchMap(input => createFulfillment(apollo, input)),
			switchMap(f => transitionFulfillmentToState(apollo, f.id, 'Shipped')),
			catchError(err => throwError(() => err)),
		);
}

/**
 * Crée un fulfillment contenant chaque ligne de la commande (quantité = 1),
 * puis le passe immédiatement en état "Shipped".
 */
export function createDefaultFulfillmentForOrder(
	apollo: Apollo,
	orderId: string,
): Observable<Fulfillment> {
	return apollo
		.query<OrderDetailQuery, OrderDetailQueryVariables>({
			query: OrderDetailDocument,
			variables: { id: orderId },
		})
		.pipe(
			// 1️⃣ Préparer les lignes avec quantité = 1
			map(res =>
				res.data.order.lines.map(line => ({
					orderLineId: line.id,
					quantity: line.quantity,
				}))
			),
			// 2️⃣ Construire l’input CreateFulfillmentInput
			map(lines => ({
				lines,
				handler: {
					code: 'manual-fulfillment',
					arguments: [
						{ name: 'method', value: 'method' },
						{ name: 'trackingCode', value: 'track' },
					],
				},
			}) as CreateFulfillmentInput),
			// 3️⃣ Créer le fulfillment
			switchMap(input => createFulfillment(apollo, input)),
			// 4️⃣ Basculer ce fulfillment en "Shipped"
			switchMap(f => transitionFulfillmentToState(apollo, f.id, 'Shipped')),
			switchMap(f => transitionFulfillmentToState(apollo, f.id, 'Delivered')),
			catchError(err => throwError(() => err)),
		);
}


// src/graphql/dashboard.graphql.ts
import { gql } from 'apollo-angular';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

/** The shape of the data returned by the query */
export interface GetTransactionEntrySummaryQuery {
	transactionEntries: {
		totalItems: number;
		items: Array<{
			amount: number;
			typeEntry: string;
			dateTransaction: string;
		}>;
	};
}

/** The variables the query accepts */
export interface GetTransactionEntrySummaryQueryVariables {
	start: string;        // ISO DateTime
	end: string;          // ISO DateTime
	take?: number;        // Optional maximum number of items to fetch
}

export const GET_TRANSACTION_ENTRY_SUMMARY: TypedDocumentNode<
	GetTransactionEntrySummaryQuery,
	GetTransactionEntrySummaryQueryVariables
> = gql`
  query GetTransactionEntrySummary(
    $start: DateTime!
    $end: DateTime!
    $take: Int
  ) {
    transactionEntries(
      options: {
        filter: { dateTransaction: { between: { start: $start, end: $end } } }
        take: $take
      }
    ) {
      totalItems
      items {
        amount
        typeEntry
        dateTransaction
      }
    }
  }
`;

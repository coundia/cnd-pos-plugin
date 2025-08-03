import type { DocumentNode } from 'graphql';
import gql from "graphql-tag";


export const DeleteTransactionEntryDocument = {
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'mutation',
			name: { kind: 'Name', value: 'DeleteTransactionEntry' },
			variableDefinitions: [
				{
					kind: 'VariableDefinition',
					variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
					type: {
						kind: 'NonNullType',
						type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
					},
				},
			],
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{
						kind: 'Field',
						name: { kind: 'Name', value: 'deleteTransactionEntry' },
						arguments: [
							{
								kind: 'Argument',
								name: { kind: 'Name', value: 'id' },
								value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
							},
						],
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: 'result' } },
								{ kind: 'Field', name: { kind: 'Name', value: 'message' } },
							],
						},
					},
				],
			},
		},
	],
} ;



export const deleteTransactionEntriesDocument: DocumentNode = gql`
  mutation deleteTransactionEntries($ids: [ID!]!) {
    deleteTransactionEntries(ids: $ids) {
      result
      message
    }
  }
`;

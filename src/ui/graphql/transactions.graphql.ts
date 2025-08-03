import {TypedDocumentNode as DocumentNode} from "@graphql-typed-document-node/core";
import {
	CreateTransactionEntryMutation,
	CreateTransactionEntryMutationVariables,
	GetTransactionEntriesQuery,
	GetTransactionEntriesQueryVariables,
	GetTransactionEntryDetailQuery,
	GetTransactionEntryDetailQueryVariables,
	UpdateTransactionEntryMutation,
	UpdateTransactionEntryMutationVariables
} from "./graphql";

export const GetTransactionEntriesDocument = {
	"kind": "Document", "definitions": [{
		"kind": "OperationDefinition",
		"operation": "query",
		"name": {"kind": "Name", "value": "GetTransactionEntries"},
		"variableDefinitions": [{
			"kind": "VariableDefinition",
			"variable": {"kind": "Variable", "name": {"kind": "Name", "value": "options"}},
			"type": {"kind": "NamedType", "name": {"kind": "Name", "value": "TransactionEntryListOptions"}}
		}],
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {"kind": "Name", "value": "transactionEntries"},
				"arguments": [{
					"kind": "Argument",
					"name": {"kind": "Name", "value": "options"},
					"value": {"kind": "Variable", "name": {"kind": "Name", "value": "options"}}
				}],
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [{
						"kind": "Field",
						"name": {"kind": "Name", "value": "items"},
						"selectionSet": {
							"kind": "SelectionSet",
							"selections": [{"kind": "Field", "name": {"kind": "Name", "value": "id"}}, {
								"kind": "Field",
								"name": {"kind": "Name", "value": "code"}
							},
								{"kind": "Field", "name": {"kind": "Name", "value": "typeEntry"}},
								{"kind": "Field", "name": {"kind": "Name", "value": "dateTransaction"}},
								{
								"kind": "Field",
								"name": {"kind": "Name", "value": "amount"}
							}, {"kind": "Field", "name": {"kind": "Name", "value": "description"}}, {
								"kind": "Field",
								"name": {"kind": "Name", "value": "createdAt"}
							}, {"kind": "Field", "name": {"kind": "Name", "value": "updatedAt"}}]
						}
					}, {"kind": "Field", "name": {"kind": "Name", "value": "totalItems"}}]
				}
			}]
		}
	}]
} as unknown as DocumentNode<GetTransactionEntriesQuery, GetTransactionEntriesQueryVariables>;
export const GetTransactionEntryDetailDocument = {
	"kind": "Document",
	"definitions": [{
		"kind": "OperationDefinition",
		"operation": "query",
		"name": {"kind": "Name", "value": "GetTransactionEntryDetail"},
		"variableDefinitions": [{
			"kind": "VariableDefinition",
			"variable": {"kind": "Variable", "name": {"kind": "Name", "value": "id"}},
			"type": {"kind": "NonNullType", "type": {"kind": "NamedType", "name": {"kind": "Name", "value": "ID"}}}
		}],
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {"kind": "Name", "value": "transactionEntry"},
				"arguments": [{
					"kind": "Argument",
					"name": {"kind": "Name", "value": "id"},
					"value": {"kind": "Variable", "name": {"kind": "Name", "value": "id"}}
				}],
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [{
						"kind": "FragmentSpread",
						"name": {"kind": "Name", "value": "TransactionEntryDetail"}
					}]
				}
			}]
		}
	}, {
		"kind": "FragmentDefinition",
		"name": {"kind": "Name", "value": "TransactionEntryDetail"},
		"typeCondition": {"kind": "NamedType", "name": {"kind": "Name", "value": "TransactionEntry"}},
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{"kind": "Field", "name": {"kind": "Name", "value": "id"}}, {
				"kind": "Field",
				"name": {"kind": "Name", "value": "code"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "amount"}}, {
				"kind": "Field",
				"name": {"kind": "Name", "value": "description"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "typeEntry"}},
				{"kind": "Field", "name": {"kind": "Name", "value": "dateTransaction"}},
				{
				"kind": "Field",
				"name": {"kind": "Name", "value": "createdAt"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "updatedAt"}}]
		}
	}]
} as unknown as DocumentNode<GetTransactionEntryDetailQuery, GetTransactionEntryDetailQueryVariables>;
export const CreateTransactionEntryDocument = {
	"kind": "Document",
	"definitions": [{
		"kind": "OperationDefinition",
		"operation": "mutation",
		"name": {"kind": "Name", "value": "CreateTransactionEntry"},
		"variableDefinitions": [{
			"kind": "VariableDefinition",
			"variable": {"kind": "Variable", "name": {"kind": "Name", "value": "input"}},
			"type": {
				"kind": "NonNullType",
				"type": {"kind": "NamedType", "name": {"kind": "Name", "value": "CreateTransactionEntryInput"}}
			}
		}],
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {"kind": "Name", "value": "createTransactionEntry"},
				"arguments": [{
					"kind": "Argument",
					"name": {"kind": "Name", "value": "input"},
					"value": {"kind": "Variable", "name": {"kind": "Name", "value": "input"}}
				}],
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [{
						"kind": "FragmentSpread",
						"name": {"kind": "Name", "value": "TransactionEntryDetail"}
					}]
				}
			}]
		}
	}, {
		"kind": "FragmentDefinition",
		"name": {"kind": "Name", "value": "TransactionEntryDetail"},
		"typeCondition": {"kind": "NamedType", "name": {"kind": "Name", "value": "TransactionEntry"}},
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{"kind": "Field", "name": {"kind": "Name", "value": "id"}}, {
				"kind": "Field",
				"name": {"kind": "Name", "value": "code"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "amount"}}, {
				"kind": "Field",
				"name": {"kind": "Name", "value": "description"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "typeEntry"}},
				{"kind": "Field", "name": {"kind": "Name", "value": "dateTransaction"}},
				{
				"kind": "Field",
				"name": {"kind": "Name", "value": "createdAt"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "updatedAt"}}]
		}
	}]
} as unknown as DocumentNode<CreateTransactionEntryMutation, CreateTransactionEntryMutationVariables>;
export const UpdateTransactionEntryDocument = {
	"kind": "Document",
	"definitions": [{
		"kind": "OperationDefinition",
		"operation": "mutation",
		"name": {"kind": "Name", "value": "UpdateTransactionEntry"},
		"variableDefinitions": [{
			"kind": "VariableDefinition",
			"variable": {"kind": "Variable", "name": {"kind": "Name", "value": "input"}},
			"type": {
				"kind": "NonNullType",
				"type": {"kind": "NamedType", "name": {"kind": "Name", "value": "UpdateTransactionEntryInput"}}
			}
		}],
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{
				"kind": "Field",
				"name": {"kind": "Name", "value": "updateTransactionEntry"},
				"arguments": [{
					"kind": "Argument",
					"name": {"kind": "Name", "value": "input"},
					"value": {"kind": "Variable", "name": {"kind": "Name", "value": "input"}}
				}],
				"selectionSet": {
					"kind": "SelectionSet",
					"selections": [{
						"kind": "FragmentSpread",
						"name": {"kind": "Name", "value": "TransactionEntryDetail"}
					}]
				}
			}]
		}
	}, {
		"kind": "FragmentDefinition",
		"name": {"kind": "Name", "value": "TransactionEntryDetail"},
		"typeCondition": {"kind": "NamedType", "name": {"kind": "Name", "value": "TransactionEntry"}},
		"selectionSet": {
			"kind": "SelectionSet",
			"selections": [{"kind": "Field", "name": {"kind": "Name", "value": "id"}}, {
				"kind": "Field",
				"name": {"kind": "Name", "value": "code"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "amount"}}, {
				"kind": "Field",
				"name": {"kind": "Name", "value": "description"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "typeEntry"}},
				{"kind": "Field", "name": {"kind": "Name", "value": "dateTransaction"}},
				{
				"kind": "Field",
				"name": {"kind": "Name", "value": "createdAt"}
			}, {"kind": "Field", "name": {"kind": "Name", "value": "updatedAt"}}]
		}
	}]
} as unknown as DocumentNode<UpdateTransactionEntryMutation, UpdateTransactionEntryMutationVariables>;


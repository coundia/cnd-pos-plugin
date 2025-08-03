import gql from 'graphql-tag';

const transactionEntryAdminApiExtensions = gql`
  type TransactionEntryTranslation {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    languageCode: LanguageCode!
    localizedName: String!
  }

  type TransactionEntry implements Node {
    id: ID!
    createdAt: DateTime
    updatedAt: DateTime
    dateTransaction: DateTime
    amount: Int
    description: String
    code: String
    typeEntry: String
    localizedName: String
    translations: [TransactionEntryTranslation!]!
  }

  type TransactionEntryList implements PaginatedList {
    items: [TransactionEntry!]!
    totalItems: Int!
  }

  # Generated at run-time by Vendure
  input TransactionEntryListOptions

  extend type Query {
    transactionEntry(id: ID!): TransactionEntry
    transactionEntries(options: TransactionEntryListOptions): TransactionEntryList!
  }

  input TransactionEntryTranslationInput {
    id: ID
    languageCode: LanguageCode!
    localizedName: String
  }

  input CreateTransactionEntryInput {
    amount: Int
    description: String
    code: String
    typeEntry: String
    dateTransaction: DateTime
    localizedName: String
    translations: [TransactionEntryTranslationInput!]!
  }

  input UpdateTransactionEntryInput {
    id: ID!
    amount: Int
    typeEntry: String
    description: String
    dateTransaction: DateTime
    code: String
    localizedName: String
    translations: [TransactionEntryTranslationInput!]
  }

  extend type Mutation {
    createTransactionEntry(input: CreateTransactionEntryInput!): TransactionEntry!
    updateTransactionEntry(input: UpdateTransactionEntryInput!): TransactionEntry!
    deleteTransactionEntry(id: ID!): DeletionResponse!
    deleteTransactionEntries(ids: [ID!]): DeletionResponse!
    syncIncremental: Boolean!
    issueAdminToken(input: AuthenticationInput!): String!


  }
`;
export const adminApiExtensions = gql`
  ${transactionEntryAdminApiExtensions}
`;

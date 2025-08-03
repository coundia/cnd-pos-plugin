import gql from 'graphql-tag';

export const SYNC_INCREMENTAL = gql`
  mutation SyncIncremental {
    syncIncremental
  }
`;

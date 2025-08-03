import {gql} from "apollo-angular";

export const SET_BILLING_ADDRESS = gql`
  mutation SetBillingAddress($orderId: ID!, $input: CreateAddressInput!) {
    setDraftOrderBillingAddress(orderId: $orderId, input: $input) {
      id
    }
  }
`;
export const SET_SHIPPING_ADDRESS = gql`
  mutation SetShippingAddress($orderId: ID!, $input: CreateAddressInput!) {
    setDraftOrderShippingAddress(orderId: $orderId, input: $input) {
      id
    }
  }
`;

export const ELIGIBLE_SHIPPING_METHODS = gql`
  query EligibleShippingMethods($orderId: ID!) {
    eligibleShippingMethodsForDraftOrder(orderId: $orderId) {
      id
      code
      description
      price
    }
  }
`;

export const SET_SHIPPING_METHOD = gql`
  mutation SetShippingMethod($orderId: ID!, $shippingMethodId: ID!) {
    setDraftOrderShippingMethod(orderId: $orderId, shippingMethodId: $shippingMethodId) {
      __typename
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const CONFIRM_ORDER = gql`
  mutation TransitionOrder($orderId: ID!, $state: String!) {
    transitionOrderToState(id: $orderId, state: $state) {
      ... on Order { id code state }
      ... on OrderStateTransitionError { errorCode message }
    }
  }
`;

export const ADD_MANUAL_PAYMENT_CONFIRM = gql`
  mutation AddManualPayment($input: ManualPaymentInput!) {
    addManualPaymentToOrder(input: $input) {
      ... on Order { id }
      ... on ManualPaymentStateError { errorCode message }
    }
  }
`;

export const CREATE_DRAFT_ORDER = gql`
  mutation CreateDraftOrder {
    createDraftOrder {
      id
      code
      state
    }
  }
`;

export const SET_CUSTOMER_FOR_DRAFT_ORDER = gql`
  mutation SetCustomerForDraftOrder($orderId: ID!, $customerId: ID!) {
    setCustomerForDraftOrder(orderId: $orderId, customerId: $customerId) {
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADD_ITEM_TO_DRAFT_ORDER = gql`
  mutation AddItemToDraftOrder($orderId: ID!, $input: AddItemToDraftOrderInput!) {
    addItemToDraftOrder(orderId: $orderId, input: $input) {
      ... on Order {
        id
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const ADD_MANUAL_PAYMENT = gql`
  mutation AddManualPaymentManuel(
    $orderId: ID!
    $method: String!
    $metadata: JSON!
  ) {
    addManualPaymentToOrder(
      input: { orderId: $orderId, method: $method, metadata: $metadata }
    ) {
      ... on Order { id }
      ... on ManualPaymentStateError { errorCode message }
    }
  }
`;

export const TRANSITION_ORDER_STATE = gql`
  mutation TransitionOrderToState($id: ID!, $state: String!) {
    transitionOrderToState(id: $id, state: $state) {
      __typename
      ... on Order {
        id
        state
      }
      ... on OrderStateTransitionError {
        errorCode
        message
        transitionError
        fromState
        toState
      }
    }
  }
`;



export const GET_CUSTOMERS = gql`
  query GetCustomerList($options: CustomerListOptions!) {
    customers(options: $options) {
      items {
        id
        firstName
        lastName
        emailAddress
      }
      totalItems
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ... on Customer {
        id
        firstName
        lastName
        emailAddress
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

export const GET_CUSTOMER_BY_EMAIL = gql`
  query GetCustomerByEmail($email: String!) {
    customers(options: {
      skip: 0
      take: 1
      filter: { emailAddress: { eq: $email } }
    }) {
      items {
        id
      }
      totalItems
    }
  }
`;

export const CUSTOMER_DETAIL_QUERY = gql`
  query CustomerDetailQuery($id: ID!, $orderListOptions: OrderListOptions) {
    customer(id: $id) {
      ...Customer
      groups {
        id
        name
      }
      orders(options: $orderListOptions) {
        items {
          id
          code
          type
          state
          total
          totalWithTax
          currencyCode
          createdAt
          updatedAt
          orderPlacedAt
        }
        totalItems
      }
    }
  }

  fragment Address on Address {
    id
    createdAt
    updatedAt
    fullName
    company
    streetLine1
    streetLine2
    city
    province
    postalCode
    country {
      id
      code
      name
    }
    phoneNumber
    defaultShippingAddress
    defaultBillingAddress
  }

  fragment Customer on Customer {
    id
    createdAt
    updatedAt
    title
    firstName
    lastName
    phoneNumber
    emailAddress
    user {
      id
      identifier
      verified
      lastLogin
    }
    addresses {
      ...Address
    }
  }
`;

export const TRANSITION_FULFILLMENT_TO_STATE = gql`
  mutation transitionFulfillmentToState {
    transitionFulfillmentToState {
      id
      code
      state
    }
  }
`;

export const ORDER_DETAIL_QUERY = gql`
  query OrderDetailQuery($id: ID!) {
    order(id: $id) {
      ...OrderDetail
    }
  }

  fragment OrderDetail on Order {
    id
    code
    state
    total
    totalWithTax
    currencyCode
    createdAt
    customer {
      id
      firstName
      lastName
    }
    lines {
      id
      quantity
      unitPriceWithTax
      productVariant {
        name
        sku
      }
    }
  }
`;

export const GET_ORDER_WITH_PAYMENTS = gql`
  query GetOrderWithPayments($id: ID!) {
    order(id: $id) {
      id
      code
   customer {
       firstName
       lastName
     }
      totalWithTax
      currencyCode
      payments {
        id
        amount
        method
        state
        transactionId
        metadata
        createdAt
      }
    }
  }
`;


export const GET_STOCK_MOVEMENTS = gql`
  query GetStockMovements($options: ProductVariantListOptions) {
    productVariants(options: $options) {
      items {
        id
        name
        updatedAt    
        outOfStockThreshold           
        stockLevels {
          stockLocation { name }
          stockOnHand
          stockAllocated
        }
        stockMovements {
          items {
            __typename
            ... on StockMovement {
              createdAt
              updatedAt
              type
              quantity
            }
            ... on Allocation {
              createdAt
              updatedAt
              type
              quantity
            }
            ... on Sale {
              createdAt
              updatedAt
              type
              quantity
            }
            ... on Cancellation {
              createdAt
              updatedAt
              type
              quantity
            }
            ... on Return {
              createdAt
              updatedAt
              type
              quantity
            }
            ... on Release {
              createdAt
              updatedAt
              type
              quantity
            }
          }
        }
      }
      totalItems
    }
  }
`;

export const GET_VARIANTS_WITH_STOCK = gql`
query GetVariantsWithStock($options: ProductVariantListOptions!) {
  productVariants(options: $options) {
    items {
      id
      name
      sku
      outOfStockThreshold
      updatedAt
      stockLevels {
        stockLocation { name }
        stockOnHand
        stockAllocated
      }
      __typename
    }
    totalItems
    __typename
  }
}
`;
const { gql } = require("apollo-server");
const typeDefs = gql`
  type User {
    id: ID
    name: String
    lastname: String
    email: String
    createdAt: String
  }
  type Product {
    id: ID
    name: String
    stock: Int
    price: Float
    createdAt: String
  }
  type Token {
    token: String
  }
  type Client {
    id: ID
    name: String
    lastname: String
    company: String
    email: String
    phone: String
    createdAt: String
    seller: ID
  }
  type Order {
    id: ID
    order: [OrderGroup]
    total: Float
    client: Client
    seller: ID
    createdAt: String
    state: OrderState
  }
  type OrderGroup {
    id: ID
    quantity: Int,
    price: Float,
    name: String
  }
  type TopClient {
    total: Float
    client: [Client]
  }
  type TopSeller {
    total: Float
    seller: [User]
  }
  input UserAuthInput {
    email: String!
    password: String!
  }
  input UserInput {
    name: String!
    lastname: String!
    email: String!
    password: String!
  }
  input ProductInput {
    name: String!
    stock: Int!
    price: Float!
  }
  input ClientInput {
    name: String!
    lastname: String!
    company: String!
    email: String!
    phone: String
  }
  input OrderProductInput {
    id: ID
    quantity: Int,
    name: String,
    price: Float
  }
  input OrderInput {
    order: [OrderProductInput]
    total: Float
    client: ID
    state: OrderState
  }
  enum OrderState {
    Pendiente
    Completado
    Cancelado
  }
  type Mutation {
    # Users
    newUser(input: UserInput): User
    userAuth(input: UserAuthInput): Token

    #Productos
    newProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductInput!): Product
    deleteProduct(id: ID!): String

    # Clients
    newClient(input: ClientInput!): Client
    updateClient(id: ID!, input: ClientInput!): Client
    deleteClient(id: ID!): String

    # Orders
    newOrder(input: OrderInput): Order
    updateOrder(id: ID!, input: OrderInput): Order
    deleteOrder(id: ID!): String
  }
  type Query {
    # Users
    getUser: User
    getTopSellers: [TopSeller]
    # Products
    getProducts: [Product]
    getProduct(id: ID!): Product
    getProductsByName(text: String!): [Product]
    #Clients
    getClients: [Client]
    getClientsBySeller: [Client]
    getClient(id: ID!): Client
    getBestClients: [TopClient]
    # Orders
    getOrders: [Order]
    getOrdersBySeller: [Order]
    getOrder(id: ID!): Order
    getOrderByState(state: String!): [Order]
  }
`;
module.exports = typeDefs;

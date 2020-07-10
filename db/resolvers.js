//Utilities
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });
//Models
const User = require("../models/User");
const Product = require("../models/Product");
const Client = require("../models/Client");
const Order = require("../models/Order");
//Functions
const createToken = async (user, keyword, expiresIn) => {
  const { id, email, password, name, lastname } = user;
  return jwt.sign({ id, email, password, name, lastname }, keyword, {
    expiresIn,
  });
};

//Resolvers
const resolvers = {
  Query: {
    getUser: async (_, {}, ctx) => {
      return ctx.user;
    },
    getProducts: async () => {
      try {
        const products = await Product.find({});
        return products;
      } catch (error) {
        console.log(error);
      }
    },
    getProduct: async (_, { id }) => {
      try {
        const product = await Product.findById(id);
        if (!product) {
          throw new Error("Producto no encontrado");
        }
        return product;
      } catch (error) {
        console.log(error);
      }
    },
    getClients: async () => {
      try {
        const clients = await Client.find({});
        return clients;
      } catch (error) {
        console.log(error);
      }
    },
    getClientsBySeller: async (_, {}, ctx) => {
      try {
        const clients = await Client.find({ seller: ctx.user.id.toString() });
        return clients;
      } catch (error) {
        console.log(error);
      }
    },
    getClient: async (_, { id }, ctx) => {
      try {
        const client = await Client.findById(id);
        if (!client) {
          throw new Error("El cliente no existe");
        }
        if (client.seller.toString() !== ctx.user.id) {
          throw new Error("No posee las credenciales");
        }
        return client;
      } catch (error) {
        console.log(error);
      }
    },
    getOrders: async () => {
      try {
        const orders = await Order.find({});
        return orders;
      } catch (error) {
        console.log(error);
      }
    },
    getOrdersBySeller: async (_, {}, ctx) => {
      try {
        const orders = Order.find({ seller: ctx.user.id }).populate('client');
        return orders;
      } catch (error) {
        console.log(error);
      }
    },
    getOrder: async (_, { id }, ctx) => {
      try {
        const order = await Order.findById(id);
        if (!order) {
          throw new Error("La orden no existe");
        }
        if (order.seller.toString() !== ctx.user.id) {
          throw new Error("No posee las credenciales");
        }
        return order;
      } catch (error) {
        console.log(error);
      }
    },
    getOrderByState: async (_, { state }, ctx) => {
      const orders = await Order.find({ seller: ctx.user.id, state });
      return orders;
    },
    getBestClients: async () => {
      const clients = await Order.aggregate([
        { $match: { state: "Completado" } },
        {
          $group: {
            _id: "$client",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client",
          },
        },
        {
          $limit: 10,
        },
        {
          $sort: { total: -1 },
        },
      ]);
      return clients;
    },
    getTopSellers: async () => {
      const sellers = await Order.aggregate([
        { $match: { state: "Completado" } },
        {
          $group: {
            _id: "$seller",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $limit: 5,
        },
        {
          $sort: { total: -1 },
        },
      ]);
      return sellers;
    },
    getProductsByName: async (_, { text }) => {
      const products = await Product.find({ $text: { $search: text } });
      return products;
    },
  },
  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password } = input;
      const isUserExist = await User.findOne({ email });
      if (isUserExist) {
        throw new Error("El usuario ya existe");
      }
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);
      try {
        const user = new User(input);
        user.save();
        return user;
      } catch (error) {
        console.log(error);
      }
    },
    userAuth: async (_, { input }) => {
      const { email, password } = input;
      const isUserExist = await User.findOne({ email });
      if (!isUserExist) {
        throw new Error("El usuario no existe");
      }
      const correctPassword = await bcryptjs.compare(
        password,
        isUserExist.password
      );
      if (!correctPassword) {
        throw new Error("La contraseña es incorrecta");
      }
      return {
        token: createToken(isUserExist, process.env.SECRET, "24h"),
      };
    },
    newProduct: async (_, { input }) => {
      try {
        const newProduct = new Product(input);
        const product = await newProduct.save();
        return product;
      } catch (error) {
        console.log(error);
      }
    },
    updateProduct: async (_, { id, input }) => {
      try {
        let product = await Product.findById(id);
        if (!product) {
          throw new Error("El producto solicitado no existe");
        }
        product = await Product.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return product;
      } catch (error) {
        console.log(error);
      }
    },
    deleteProduct: async (_, { id }) => {
      let product = await Product.findById(id);
      if (!product) {
        throw new Error("Producto no encontrado");
      }
      await Product.findOneAndDelete({ _id: id });
      return "Producto eliminado";
    },
    newClient: async (_, { input }, ctx) => {
      const { email } = input;
      console.log(ctx);
      const client = await Client.findOne({ email });
      if (client) {
        throw new Error("El cliente ya existe");
      }
      const newClient = new Client(input);
      newClient.seller = ctx.user.id;
      try {
        const result = await newClient.save();
        return result;
      } catch (error) {
        console.log(error);
      }
    },
    updateClient: async (_, { id, input }, ctx) => {
      let client = await Client.findById(id);
      if (!client) {
        throw new Error("El cliente no existe");
      }
      if (client.seller.toString() !== ctx.user.id) {
        throw new Error("No tiene las credenciales");
      }
      client = await Client.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return client;
      try {
      } catch (error) {
        console.log(error);
      }
    },
    deleteClient: async (_, { id }, ctx) => {
      const client = await Client.findById(id);
      if (!client) {
        throw new Error("Cliente no encontrado");
      }
      if (client.seller.toString() !== ctx.user.id) {
        throw new Error("No posee las credenciales");
      }
      await Client.findOneAndDelete({ _id: id });
      return "Cliente eliminado";
    },
    newOrder: async (_, { input }, ctx) => {
      const { client } = input;
      let isClientExist = await Client.findById(client);
      if (!isClientExist) {
        throw new Error("El cliente no existe");
      }
      if (isClientExist.seller.toString() !== ctx.user.id) {
        throw new Error("No posee las credenciales");
      }
      for await (const article of input.order) {
        const { id } = article;
        const product = await Product.findById(id);
        if (article.quantity > product.stock) {
          throw new Error(
            `El artículo ${product.name} excede la cantidad disponible`
          );
        } else {
          product.stock = product.stock - article.quantity;
          await product.save();
        }
      }
      const newOrder = new Order(input);
      newOrder.seller = ctx.user.id;
      const result = await newOrder.save();
      return result;
    },
    updateOrder: async (_, { id, input }, ctx) => {
      try {
        const { client } = input;
        const order = await Order.findById(id);
        if (!order) {
          throw new Error("El pedido no existe");
        }
        const isClientExist = await Client.findById(client);
        if (!isClientExist) {
          throw new Error("No existe el cliente");
        }
        if (order.seller.toString() !== ctx.user.id) {
          throw new Error("No posee las credenciales");
        }
        if (input.order) {
          for await (const article of input.order) {
            const { id } = article;
            const product = await Product.findById(id);
            if (article.quantity > product.stock) {
              throw new Error(
                `El artículo ${product.name} excede la cnatidad disponible`
              );
            } else {
              product.stock = product.stock - article.quantity;
              await product.save();
            }
          }
        }
        const result = await Order.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return result;
      } catch (error) {
        console.log(error);
      }
    },
    deleteOrder: async (_, { id }, ctx) => {
      const order = await Order.findById(id);
      if (!order) {
        throw new Error("El pedido no existe");
      }
      if (order.seller.toString() !== ctx.user.id) {
        throw new Error("No posee las credenciales");
      }
      await Order.findOneAndDelete({ _id: id });
      return "Pedido eliminado";
    },
  },
};

module.exports = resolvers;

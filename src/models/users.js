import { db } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const collection = 'users';

export default {
  async findOne(query, options) {
    return db.findOne(process.env.MONGO_DATABASE, collection, query, options);
  },
  async find(query = {}, projection) {
    return db.find(process.env.MONGO_DATABASE, collection, query, projection);
  },
  async removeOne(query) {
    return db.removeOne(process.env.MONGO_DATABASE, collection, query);
  },
  async replaceOne(query) {
    return db.replaceOne(process.env.MONGO_DATABASE, collection, query);
  },
  async updateOne(filter, update) {
    return db.updateOne(process.env.MONGO_DATABASE, collection, filter, update);
  },
  async insertOne(data) {
    const results = await db.insertOne(
      process.env.MONGO_DATABASE,
      collection,
      data,
    );
    return results;
  },
};

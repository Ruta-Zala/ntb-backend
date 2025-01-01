import { db } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const collection = 'Role';

export default {
  async findOne(query, options) {
    return db.findOne(process.env.MONGO_DATABASE, collection, query, options);
  },
  async countDocuments(query = {}) {
    return db.countDocuments(process.env.MONGO_DATABASE, collection, query);
  },
  async find(query = {}, projection, options = {}) {
    return db.find(
      process.env.MONGO_DATABASE,
      collection,
      query,
      projection,
      options,
    );
  },
  async removeOne(query) {
    return db.removeOne(process.env.MONGO_DATABASE, collection, query);
  },
  async replaceOne(query) {
    return db.replaceOne(process.env.MONGO_DATABASE, collection, query);
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

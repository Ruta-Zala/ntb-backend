import { db } from './db.js';

const collection = 'users';

export default {
  async findOne(query, options) {
    return db.findOne('networking_toolbox_data', collection, query, options);
  },
  async find(query = {}, projection) {
    return db.find('networking_toolbox_data', collection, query, projection);
  },
  async removeOne(query) {
    return db.removeOne('networking_toolbox_data', collection, query);
  },
  async replaceOne(query) {
    return db.replaceOne('networking_toolbox_data', collection, query);
  },
  async updateOne(filter, update) {
    return db.updateOne('networking_toolbox_data', collection, filter, update);
  },
  async insertOne(data) {
    const results = await db.insertOne(
      'networking_toolbox_data',
      collection,
      data,
    );
    return results;
  },
};

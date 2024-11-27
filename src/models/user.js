import { db } from './db.js';

const collection = 'users';

export default {
  async updateOne(filter, update) {
    return db.updateOne('networking_toolbox_data', collection, filter, update);
  },
};

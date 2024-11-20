const db = require('./db')
const collection = 'users'
 
module.exports = {
  async updateOne (filter, update) {
    return db.updateOne('networking_toolbox_data', collection, filter, update)
  },  
}
const mongo = require('mongodb')
const MongoClient = mongo.MongoClient
const ObjectID = mongo.ObjectId

let dev = process.env.NODE_ENV !== 'production';

class DB {
  constructor(connections = {}) {
    this.connections = connections
    this.ObjectID = ObjectID
  }

  async getConnection(db) {
    if (!db) {
      throw Error('database name is a required parameter for getConnection')
    }
    let parsedEnvs
    if (!dev) {
      const containerEnvs = process.env.parietus2DataDocDb || '{}'
      parsedEnvs = JSON.parse(containerEnvs)
    } else {
      // throw Error('This is the prod connection file. Use the dev file for development!')
      parsedEnvs = {
        username: process.env.DB_USERNAME || 'brilee0',
        password: process.env.DB_PASSWORD || 'G3cHNcpQbAXRSFW1',
        host: 'ntb-cluster.3hkjb.mongodb.net',
      }
    }
    return new Promise((resolve, reject) => {
      if (this.connections[db]) {
        resolve(this.connections[db])
      } else {
        let connectionProperties = {
          auth: {
            username: parsedEnvs.username,
            password: parsedEnvs.password
          },
          authSource: 'admin',
          authMechanism: 'SCRAM-SHA-1',
          // directConnection: true,
          retryWrites: false,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          // sslValidate: false,
          // ssl:true,
          // replicaSet:'rs0',
          // readPreference:'secondaryPreferred',
        };

        const { username, password, host } = parsedEnvs;
        if (!username || !password || !host) {
          throw new Error('Missing required database environment variables');
        }
        let url = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}/?retryWrites=true&w=majority&appName=NTB-Cluster`;

        MongoClient.connect(url, connectionProperties, (err, client) => {
          if (err) {
            return reject(err)
          } else {
            this.connections[db] = client
            resolve(this.connections[db])
          }
        })
      }
    })
  }

  find(db, collection, query = {}, projection, sort) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db).collection(collection)
            .find(query).project(projection).sort(sort)
            .toArray(function (queryError, doc) {
              if (queryError) reject(queryError)
              else resolve(doc)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  findOne(db, collection, query, options) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .findOne(query, options, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  insertOne(db, collection, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .insertOne(data, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  insertMany(db, collection, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .insertMany(data, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })     
    })
  } 

  upsert(db, collection, query, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .findOneAndReplace(query, data, { upsert: true }, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  updateOne(db, collection, filter, update) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .updateOne(filter, update, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  updateMany(db, collection, filter, updates) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .updateMany(filter, updates, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  removeOne(db, collection, query) {
    return this.deleteOne(db, collection, query)
  }

  deleteOne(db, collection, query) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .deleteOne(query, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  deleteMany(db, collection, query) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .deleteMany(query, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  removeMany(db, collection, query) {
    return this.deleteMany(db, collection, query)
  }


  replaceOne(db, collection, query, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .findOneAndReplace(query, data, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }


  findOneAndUpdate(db, collection, filter, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .findOneAndReplace(filter, data, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  bulkWrite(db, collection, operationsArray, isOrdered) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          client.db(db)
            .collection(collection)
            .bulkWrite(operationsArray, { ordered: isOrdered }, function (err, result) {
              if (err) reject(err)
              else resolve(result)
            })
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  collection(db, collection) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then(client => {
          resolve(client.db(db).collection(collection))
        })
        .catch(e => {
          reject(e)
        })
    })
  }

}

module.exports = DB

import { MongoClient, ObjectId } from 'mongodb';

const dev = process.env.NODE_ENV !== 'production';

class DB {
  constructor(connections = {}) {
    this.connections = connections;
    this.ObjectID = ObjectId;
  }

  async getConnection(db) {
    if (!db) {
      throw new Error(
        'database name is a required parameter for getConnection',
      );
    }
    let parsedEnvs;
    if (!dev) {
      const containerEnvs = process.env.parietus2DataDocDb || '{}';
      parsedEnvs = JSON.parse(containerEnvs);
    } else {
      parsedEnvs = {
        username: process.env.DB_USERNAME || 'brilee0',
        password: process.env.DB_PASSWORD || 'G3cHNcpQbAXRSFW1',
        host: 'ntb-cluster.3hkjb.mongodb.net',
      };
    }
    return new Promise((resolve, reject) => {
      if (this.connections[db]) {
        resolve(this.connections[db]);
      } else {
        const connectionProperties = {
          auth: {
            username: parsedEnvs.username,
            password: parsedEnvs.password,
          },
          authSource: 'admin',
          authMechanism: 'SCRAM-SHA-1',
          retryWrites: false,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };

        const { username, password, host } = parsedEnvs;
        if (!username || !password || !host) {
          throw new Error('Missing required database environment variables');
        }
        const url = `mongodb+srv://${encodeURIComponent(
          username,
        )}:${encodeURIComponent(
          password,
        )}@${host}/?retryWrites=true&w=majority&appName=NTB-Cluster`;

        MongoClient.connect(url, connectionProperties, (err, client) => {
          if (err) {
            return reject(err);
          } else {
            this.connections[db] = client;
            resolve(this.connections[db]);
          }
        });
      }
    });
  }

  countDocuments(db, collection, query = {}) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .countDocuments(query, (err, count) => {
              if (err) reject(err);
              else resolve(count);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  find(db, collection, query = {}, projection = {}, options = {}) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          const cursor = client
            .db(db)
            .collection(collection)
            .find(query)
            .project(projection);

          // Only apply sorting if `options.sort` exists and is valid
          if (
            options.sort &&
            typeof options.sort === 'object' &&
            Object.keys(options.sort).length > 0
          ) {
            cursor.sort(options.sort);
          }

          // Apply skip and limit if provided
          if (options.skip) {
            cursor.skip(options.skip);
          }
          if (options.limit) {
            cursor.limit(options.limit);
          }

          cursor.toArray((queryError, doc) => {
            if (queryError) reject(queryError);
            else resolve(doc);
          });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  findOne(db, collection, query, options) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .findOne(query, options, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  insertOne(db, collection, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .insertOne(data, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  insertMany(db, collection, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .insertMany(data, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  upsert(db, collection, query, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .findOneAndReplace(query, data, { upsert: true }, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  updateOne(db, collection, filter, update) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .updateOne(filter, update, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  updateMany(db, collection, filter, updates) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .updateMany(filter, updates, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  removeOne(db, collection, query) {
    return this.deleteOne(db, collection, query);
  }

  deleteOne(db, collection, query) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .deleteOne(query, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  deleteMany(db, collection, query) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .deleteMany(query, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  removeMany(db, collection, query) {
    return this.deleteMany(db, collection, query);
  }

  replaceOne(db, collection, query, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .findOneAndReplace(query, data, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  findOneAndUpdate(db, collection, filter, data) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .findOneAndReplace(filter, data, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  bulkWrite(db, collection, operationsArray, isOrdered) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          client
            .db(db)
            .collection(collection)
            .bulkWrite(
              operationsArray,
              { ordered: isOrdered },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              },
            );
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  collection(db, collection) {
    return new Promise((resolve, reject) => {
      this.getConnection(db)
        .then((client) => {
          resolve(client.db(db).collection(collection));
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}

export { DB, ObjectId };

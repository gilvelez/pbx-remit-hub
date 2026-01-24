const { MongoClient } = require("mongodb");

let cached = global._pbxMongoClient;
if (!cached) cached = global._pbxMongoClient = { client: null, promise: null };

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");
  if (cached.client) return cached.client.db();

  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    }).then((client) => {
      cached.client = client;
      return client;
    });
  }
  const client = await cached.promise;
  return client.db();
}

module.exports = { getDb };

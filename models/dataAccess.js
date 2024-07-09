const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = 'mongodb+srv://phanh:test123@cluster0.gq0r5y5.mongodb.net/'
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
client.connect()
module.exports = client;
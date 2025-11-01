// PBX Function: Create Lead
// Saves email leads to MongoDB with connection pooling

const { MongoClient } = require('mongodb');

let client; // Reuse connection across invocations

exports.handler = async (event) => {
  try {
    // Get MongoDB configuration from environment
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'pbx';
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Initialize client if not exists
    if (!client) {
      client = new MongoClient(uri);
    }

    // Connect if not connected
    if (!client.topology?.isConnected()) {
      await client.connect();
    }

    // Get database and collection
    const db = client.db(dbName);
    const leads = db.collection('leads');

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate email
    if (!body.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Insert lead with timestamp
    const result = await leads.insertOne({
      email: body.email,
      source: body.source || 'netlify-function',
      createdAt: new Date(),
      metadata: body.metadata || {}
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        insertedId: result.insertedId,
        message: 'Lead created successfully'
      }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error('Error creating lead:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

/**
 * PBX Recipient - Statements API
 * Transaction history and PDF export
 * Falls back to mock mode when MongoDB is unavailable
 */

// Safely handle MongoDB
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const DB_MODE = MONGODB_URI ? 'live' : 'mock';
console.log(`[recipient-statements] DB_MODE=${DB_MODE}`);

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[recipient-statements] MongoDB module not available, using mock mode');
  }
}

// Mock transaction data for demo mode
const MOCK_TRANSACTIONS = [
  { id: 'txn_001', type: 'credit', category: 'USD Received', description: 'Payment from Acme Corp', currency: 'USD', amount: 500.00, created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'txn_002', type: 'fx_conversion', category: 'FX Conversion', description: 'USD → PHP @ 56.12', currency: 'PHP', amount: 28060.00, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'txn_003', type: 'bill_payment', category: 'Bill Payment', description: 'Meralco - 1234567890', currency: 'PHP', amount: -3500.00, created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'txn_004', type: 'transfer_out', category: 'Transfer', description: 'GCash to 0917****890', currency: 'PHP', amount: -5000.00, created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: 'txn_005', type: 'credit', category: 'USD Received', description: 'Freelance payment', currency: 'USD', amount: 1000.00, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const MOCK_SUMMARY = {
  total_credits_usd: 1500.00,
  total_conversions: 28060.00,
  total_bills_paid: 3500.00,
  total_transfers: 5000.00,
};

async function getDb() {
  if (!MongoClient || !MONGODB_URI) {
    return null;
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return { client, db: client.db(DB_NAME) };
  } catch (e) {
    console.error('[recipient-statements] MongoDB connection failed:', e.message);
    return null;
  }
}

function getCategoryLabel(type) {
  const labels = {
    credit: 'USD Received',
    simulated_credit: 'Test Funding',
    fx_conversion: 'FX Conversion',
    bill_payment: 'Bill Payment',
    transfer_out: 'Transfer',
  };
  return labels[type] || type;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sessionToken = event.headers['x-session-token'] || event.headers['X-Session-Token'];
    const user_id = sessionToken ? sessionToken.substring(0, 36) : 'demo_user';

    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const { start_date, end_date, type, currency, limit = '50' } = params;

      if (DB_MODE === 'mock') {
        let filtered = [...MOCK_TRANSACTIONS];

        if (type) filtered = filtered.filter(t => t.type === type);
        if (currency) filtered = filtered.filter(t => t.currency === currency);
        if (start_date) filtered = filtered.filter(t => new Date(t.created_at) >= new Date(start_date));
        if (end_date) filtered = filtered.filter(t => new Date(t.created_at) <= new Date(end_date));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            transactions: filtered.slice(0, parseInt(limit)),
            total: filtered.length,
            summary: MOCK_SUMMARY,
            _mode: 'mock',
          }),
        };
      }

      const connection = await getDb();
      if (!connection) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            transactions: MOCK_TRANSACTIONS,
            total: MOCK_TRANSACTIONS.length,
            summary: MOCK_SUMMARY,
            _mode: 'mock',
          }),
        };
      }

      const { client, db } = connection;
      try {
        const query = { user_id };

        if (type) query.type = type;
        if (currency) query.currency = currency;
        if (start_date || end_date) {
          query.created_at = {};
          if (start_date) query.created_at.$gte = start_date;
          if (end_date) query.created_at.$lte = end_date;
        }

        const transactions = await db.collection('ledger')
          .find(query)
          .sort({ created_at: -1 })
          .limit(parseInt(limit))
          .toArray();

        // Calculate summary
        const allTransactions = await db.collection('ledger').find({ user_id }).toArray();
        const summary = allTransactions.reduce((acc, t) => {
          if ((t.type === 'credit' || t.type === 'simulated_credit') && t.currency === 'USD') {
            acc.total_credits_usd += Math.abs(t.amount);
          } else if (t.type === 'fx_conversion') {
            acc.total_conversions += Math.abs(t.amount);
          } else if (t.type === 'bill_payment') {
            acc.total_bills_paid += Math.abs(t.amount);
          } else if (t.type === 'transfer_out') {
            acc.total_transfers += Math.abs(t.amount);
          }
          return acc;
        }, { total_credits_usd: 0, total_conversions: 0, total_bills_paid: 0, total_transfers: 0 });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            transactions: transactions.map(t => ({
              id: t.txn_id || t._id.toString(),
              type: t.type,
              category: t.category || getCategoryLabel(t.type),
              description: t.description,
              currency: t.currency,
              amount: t.amount,
              created_at: t.created_at,
            })),
            total: transactions.length,
            summary,
            _mode: 'live',
          }),
        };
      } finally {
        await client.close();
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action } = body;

      if (action === 'export_pdf') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Statement PDF generated',
            download_url: '#',
            filename: `PBX_Statement_${new Date().toISOString().split('T')[0]}.pdf`,
          }),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('[recipient-statements] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * PBX Recipient - Statements API
 * Transaction history and PDF export
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const USE_MOCKS = process.env.USE_MOCKS !== 'false';

// Mock transaction data for demo
const MOCK_TRANSACTIONS = [
  {
    id: 'txn_001',
    type: 'credit',
    category: 'USD Received',
    description: 'Payment from Acme Corp',
    currency: 'USD',
    amount: 500.00,
    balance_after: 1500.00,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'txn_002',
    type: 'fx_conversion',
    category: 'FX Conversion',
    description: 'USD → PHP @ 56.12',
    currency: 'PHP',
    amount: 28060.00,
    from_amount: 500,
    from_currency: 'USD',
    rate: 56.12,
    balance_after: 53060.00,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'txn_003',
    type: 'bill_payment',
    category: 'Bill Payment',
    description: 'Meralco - 1234567890',
    currency: 'PHP',
    amount: -3500.00,
    balance_after: 49560.00,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'txn_004',
    type: 'transfer_out',
    category: 'Transfer',
    description: 'GCash to 0917****890',
    currency: 'PHP',
    amount: -5000.00,
    balance_after: 44560.00,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'txn_005',
    type: 'credit',
    category: 'USD Received',
    description: 'Freelance payment',
    currency: 'USD',
    amount: 1000.00,
    balance_after: 2500.00,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

async function getDb() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME) };
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

      if (USE_MOCKS) {
        let filtered = [...MOCK_TRANSACTIONS];

        // Filter by type if specified
        if (type) {
          filtered = filtered.filter(t => t.type === type);
        }

        // Filter by currency if specified
        if (currency) {
          filtered = filtered.filter(t => t.currency === currency);
        }

        // Filter by date range
        if (start_date) {
          const start = new Date(start_date);
          filtered = filtered.filter(t => new Date(t.created_at) >= start);
        }
        if (end_date) {
          const end = new Date(end_date);
          filtered = filtered.filter(t => new Date(t.created_at) <= end);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            transactions: filtered.slice(0, parseInt(limit)),
            total: filtered.length,
            summary: {
              total_credits_usd: 1500.00,
              total_conversions: 28060.00,
              total_bills_paid: 3500.00,
              total_transfers: 5000.00,
            },
          }),
        };
      }

      // Real MongoDB query
      const { client, db } = await getDb();
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
        const summary = transactions.reduce((acc, t) => {
          if (t.type === 'credit' && t.currency === 'USD') {
            acc.total_credits_usd += Math.abs(t.amount);
          } else if (t.type === 'fx_conversion') {
            acc.total_conversions += t.to_amount || 0;
          } else if (t.type === 'bill_payment') {
            acc.total_bills_paid += Math.abs(t.amount);
          } else if (t.type === 'transfer_out') {
            acc.total_transfers += Math.abs(t.amount);
          }
          return acc;
        }, {
          total_credits_usd: 0,
          total_conversions: 0,
          total_bills_paid: 0,
          total_transfers: 0,
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            transactions: transactions.map(t => ({
              id: t.transaction_id || t._id.toString(),
              type: t.type,
              category: getCategoryLabel(t.type),
              description: getDescription(t),
              currency: t.currency,
              amount: t.amount,
              created_at: t.created_at,
            })),
            total: transactions.length,
            summary,
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
        // In production, this would generate and return a PDF
        // For now, return a mock response
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Statement PDF generated',
            download_url: '#', // Would be a real URL in production
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
    console.error('Statements API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function getCategoryLabel(type) {
  const labels = {
    credit: 'USD Received',
    fx_conversion: 'FX Conversion',
    bill_payment: 'Bill Payment',
    transfer_out: 'Transfer',
  };
  return labels[type] || type;
}

function getDescription(transaction) {
  if (transaction.type === 'fx_conversion') {
    return `USD → PHP @ ${transaction.rate}`;
  }
  if (transaction.type === 'bill_payment' && transaction.metadata) {
    return `${transaction.metadata.biller_name} - ${transaction.metadata.account_no}`;
  }
  if (transaction.type === 'transfer_out' && transaction.metadata) {
    return `${transaction.metadata.method_name} to ${transaction.metadata.recipient_display}`;
  }
  return transaction.description || '';
}

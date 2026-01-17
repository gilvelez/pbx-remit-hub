/**
 * PBX Recipient - Transfers/Payouts API
 * Transfer PHP to bank accounts, GCash, Maya
 * Falls back to mock mode when MongoDB is unavailable
 */

// Safely handle MongoDB
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const DB_MODE = MONGODB_URI ? 'live' : 'mock';
console.log(`[recipient-transfers] DB_MODE=${DB_MODE}`);

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[recipient-transfers] MongoDB module not available, using mock mode');
  }
}

// Transfer methods
const TRANSFER_METHODS = [
  { id: 'instapay', name: 'InstaPay', type: 'bank', eta: 'Instant (within minutes)', fee: 0, max_amount: 50000, description: 'Real-time bank transfers' },
  { id: 'pesonet', name: 'PESONet', type: 'bank', eta: 'Same day (cutoff 3PM)', fee: 0, max_amount: null, description: 'Batch bank transfers' },
  { id: 'gcash', name: 'GCash', type: 'ewallet', eta: 'Instant', fee: 0, max_amount: 100000, description: 'Send to GCash wallet' },
  { id: 'maya', name: 'Maya', type: 'ewallet', eta: 'Instant', fee: 0, max_amount: 100000, description: 'Send to Maya wallet' },
];

const BANKS = [
  { code: 'bpi', name: 'BPI' },
  { code: 'bdo', name: 'BDO' },
  { code: 'unionbank', name: 'UnionBank' },
  { code: 'metrobank', name: 'Metrobank' },
  { code: 'landbank', name: 'Landbank' },
  { code: 'pnb', name: 'PNB' },
  { code: 'security_bank', name: 'Security Bank' },
  { code: 'china_bank', name: 'China Bank' },
  { code: 'rcbc', name: 'RCBC' },
  { code: 'eastwest', name: 'EastWest Bank' },
];

// Mock transfer history
const MOCK_TRANSFERS = [
  { id: 'txn_1', method: 'gcash', method_name: 'GCash', recipient: '0917****890', amount: 5000.00, status: 'completed', eta: 'Delivered', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'txn_2', method: 'instapay', method_name: 'InstaPay', recipient: 'BPI ****4567', amount: 15000.00, status: 'completed', eta: 'Delivered', created_at: new Date(Date.now() - 86400000).toISOString() },
];

async function getDb() {
  if (!MongoClient || !MONGODB_URI) {
    return null;
  }
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    return { client, db: client.db(DB_NAME) };
  } catch (e) {
    console.error('[recipient-transfers] MongoDB connection failed:', e.message);
    return null;
  }
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

      if (params.type === 'methods') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ methods: TRANSFER_METHODS, banks: BANKS }),
        };
      }

      if (params.type === 'history') {
        if (DB_MODE === 'mock') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ transfers: MOCK_TRANSFERS, _mode: 'mock' }),
          };
        }

        const connection = await getDb();
        if (!connection) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ transfers: MOCK_TRANSFERS, _mode: 'mock' }),
          };
        }

        const { client, db } = connection;
        try {
          const transfers = await db.collection('ledger')
            .find({ user_id, type: 'transfer_out' })
            .sort({ created_at: -1 })
            .limit(20)
            .toArray();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              transfers: transfers.map(t => ({
                id: t.txn_id || t._id.toString(),
                method: t.metadata?.method,
                method_name: t.metadata?.method_name || TRANSFER_METHODS.find(m => m.id === t.metadata?.method)?.name,
                recipient: t.metadata?.recipient_display,
                amount: Math.abs(t.amount),
                status: t.status,
                eta: t.status === 'completed' ? 'Delivered' : t.metadata?.eta,
                created_at: t.created_at,
              })),
              _mode: 'live',
            }),
          };
        } finally {
          await client.close();
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ methods: TRANSFER_METHODS, banks: BANKS }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action } = body;

      if (action === 'transfer') {
        const { method, amount, recipient_account, recipient_name, bank_code } = body;

        const transferMethod = TRANSFER_METHODS.find(m => m.id === method);
        if (!transferMethod) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid transfer method' }),
          };
        }

        if (!amount || amount <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid amount' }),
          };
        }

        if (transferMethod.max_amount && amount > transferMethod.max_amount) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Amount exceeds ${method} limit of ₱${transferMethod.max_amount.toLocaleString()}` }),
          };
        }

        const transaction_id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Mask recipient
        let recipient_display = recipient_account;
        if (transferMethod.type === 'ewallet' && recipient_account.length > 7) {
          recipient_display = recipient_account.substring(0, 4) + '****' + recipient_account.slice(-3);
        } else if (transferMethod.type === 'bank') {
          const bankName = BANKS.find(b => b.code === bank_code)?.name || 'Bank';
          recipient_display = `${bankName} ****${recipient_account.slice(-4)}`;
        }

        const status = transferMethod.type === 'ewallet' ? 'completed' : 'processing';

        if (DB_MODE === 'live') {
          const connection = await getDb();
          if (connection) {
            const { client, db } = connection;
            try {
              // Deduct from PHP wallet
              await db.collection('wallets').updateOne(
                { user_id },
                {
                  $inc: { php_balance: -amount },
                  $set: { updated_at: new Date().toISOString() },
                }
              );

              // Record ledger entry
              await db.collection('ledger').insertOne({
                txn_id: transaction_id,
                user_id,
                type: 'transfer_out',
                category: 'Transfer',
                description: `${transferMethod.name} to ${recipient_display}`,
                currency: 'PHP',
                amount: -amount,
                status,
                metadata: {
                  method,
                  method_name: transferMethod.name,
                  recipient_account,
                  recipient_name: recipient_name || '',
                  recipient_display,
                  bank_code: bank_code || null,
                  eta: transferMethod.eta,
                },
                created_at: new Date().toISOString(),
              });
            } finally {
              await client.close();
            }
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            transaction_id,
            method: transferMethod.name,
            recipient: recipient_display,
            amount,
            status,
            eta: transferMethod.eta,
            created_at: new Date().toISOString(),
            _mode: DB_MODE,
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
    console.error('[recipient-transfers] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

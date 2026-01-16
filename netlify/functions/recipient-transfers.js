/**
 * PBX Recipient - Transfers/Payouts API
 * Transfer PHP to bank accounts, GCash, Maya
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const USE_MOCKS = process.env.USE_MOCKS !== 'false';

// Transfer methods with ETAs
const TRANSFER_METHODS = [
  { 
    id: 'instapay', 
    name: 'InstaPay', 
    type: 'bank',
    eta: 'Instant (within minutes)',
    fee: 0,
    max_amount: 50000,
    description: 'Real-time bank transfers',
  },
  { 
    id: 'pesonet', 
    name: 'PESONet', 
    type: 'bank',
    eta: 'Same day (cutoff 3PM)',
    fee: 0,
    max_amount: null,
    description: 'Batch bank transfers',
  },
  { 
    id: 'gcash', 
    name: 'GCash', 
    type: 'ewallet',
    eta: 'Instant',
    fee: 0,
    max_amount: 100000,
    description: 'Send to GCash wallet',
  },
  { 
    id: 'maya', 
    name: 'Maya', 
    type: 'ewallet',
    eta: 'Instant',
    fee: 0,
    max_amount: 100000,
    description: 'Send to Maya wallet',
  },
];

// Common Philippine banks
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

      if (params.type === 'methods') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            methods: TRANSFER_METHODS,
            banks: BANKS,
          }),
        };
      }

      if (params.type === 'history') {
        if (USE_MOCKS) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              transfers: [
                {
                  id: 'txn_1',
                  method: 'gcash',
                  method_name: 'GCash',
                  recipient: '0917****890',
                  amount: 5000.00,
                  status: 'completed',
                  eta: 'Delivered',
                  created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                  id: 'txn_2',
                  method: 'instapay',
                  method_name: 'InstaPay',
                  recipient: 'BPI ****4567',
                  amount: 15000.00,
                  status: 'completed',
                  eta: 'Delivered',
                  created_at: new Date(Date.now() - 86400000).toISOString(),
                },
              ],
            }),
          };
        }

        const { client, db } = await getDb();
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
                id: t.transaction_id,
                method: t.metadata?.method,
                method_name: TRANSFER_METHODS.find(m => m.id === t.metadata?.method)?.name,
                recipient: t.metadata?.recipient_display,
                amount: t.amount,
                status: t.status,
                eta: t.status === 'completed' ? 'Delivered' : t.metadata?.eta,
                created_at: t.created_at,
              })),
            }),
          };
        } finally {
          await client.close();
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          methods: TRANSFER_METHODS,
          banks: BANKS,
        }),
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
            body: JSON.stringify({ 
              error: `Amount exceeds ${method} limit of ₱${transferMethod.max_amount.toLocaleString()}` 
            }),
          };
        }

        const transaction_id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Mask recipient for display
        let recipient_display = recipient_account;
        if (transferMethod.type === 'ewallet') {
          recipient_display = recipient_account.substring(0, 4) + '****' + recipient_account.substring(recipient_account.length - 3);
        } else if (transferMethod.type === 'bank') {
          const bankName = BANKS.find(b => b.code === bank_code)?.name || 'Bank';
          recipient_display = `${bankName} ****${recipient_account.slice(-4)}`;
        }

        if (!USE_MOCKS) {
          const { client, db } = await getDb();
          try {
            // Check PHP balance
            const wallet = await db.collection('wallets').findOne({ user_id });
            if (!wallet || wallet.php_balance < amount) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Insufficient PHP balance' }),
              };
            }

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
              transaction_id,
              user_id,
              type: 'transfer_out',
              currency: 'PHP',
              amount,
              status: 'processing',
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

            // Simulate instant completion for e-wallets
            if (transferMethod.type === 'ewallet') {
              await db.collection('ledger').updateOne(
                { transaction_id },
                { $set: { status: 'completed', completed_at: new Date().toISOString() } }
              );
            }
          } finally {
            await client.close();
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
            status: transferMethod.type === 'ewallet' ? 'completed' : 'processing',
            eta: transferMethod.eta,
            created_at: new Date().toISOString(),
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
    console.error('Transfers API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

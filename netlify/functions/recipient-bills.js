/**
 * PBX Recipient - Bills Payment API
 * Pay Philippine billers from PHP wallet
 * Falls back to mock mode when MongoDB is unavailable
 */

// Safely handle MongoDB
let MongoClient = null;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const DB_MODE = MONGODB_URI ? 'live' : 'mock';
console.log(`[recipient-bills] DB_MODE=${DB_MODE}`);

if (MONGODB_URI) {
  try {
    MongoClient = require('mongodb').MongoClient;
  } catch (e) {
    console.warn('[recipient-bills] MongoDB module not available, using mock mode');
  }
}

// Supported billers
const BILLERS = [
  { code: 'meralco', name: 'Meralco', category: 'electricity', logo: '⚡' },
  { code: 'pldt', name: 'PLDT', category: 'telecom', logo: '📞' },
  { code: 'globe', name: 'Globe', category: 'telecom', logo: '🌐' },
  { code: 'smart', name: 'Smart', category: 'telecom', logo: '📱' },
  { code: 'maynilad', name: 'Maynilad', category: 'water', logo: '💧' },
  { code: 'manila_water', name: 'Manila Water', category: 'water', logo: '🚰' },
];

// Mock data for demo mode
const MOCK_SAVED_BILLERS = [
  { id: 'saved_1', biller_code: 'meralco', biller_name: 'Meralco', account_no: '1234567890', nickname: 'Home Electric' },
  { id: 'saved_2', biller_code: 'pldt', biller_name: 'PLDT', account_no: '0987654321', nickname: 'Internet' },
];

const MOCK_PAYMENT_HISTORY = [
  {
    id: 'bill_1',
    biller_code: 'meralco',
    biller_name: 'Meralco',
    account_no: '1234567890',
    amount: 3500.00,
    status: 'paid',
    paid_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'bill_2',
    biller_code: 'pldt',
    biller_name: 'PLDT',
    account_no: '0987654321',
    amount: 1899.00,
    status: 'paid',
    paid_at: new Date(Date.now() - 172800000).toISOString(),
  },
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
    console.error('[recipient-bills] MongoDB connection failed:', e.message);
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
      
      if (params.type === 'billers') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ billers: BILLERS }),
        };
      }

      if (params.type === 'saved') {
        if (DB_MODE === 'mock') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ saved_billers: MOCK_SAVED_BILLERS, _mode: 'mock' }),
          };
        }

        const connection = await getDb();
        if (!connection) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ saved_billers: MOCK_SAVED_BILLERS, _mode: 'mock' }),
          };
        }

        const { client, db } = connection;
        try {
          const saved = await db.collection('saved_billers').find({ user_id }).toArray();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              saved_billers: saved.map(b => ({
                id: b._id.toString(),
                biller_code: b.biller_code,
                biller_name: BILLERS.find(bl => bl.code === b.biller_code)?.name || b.biller_code,
                account_no: b.account_no,
                nickname: b.nickname,
              })),
              _mode: 'live',
            }),
          };
        } finally {
          await client.close();
        }
      }

      if (params.type === 'history') {
        if (DB_MODE === 'mock') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ payments: MOCK_PAYMENT_HISTORY, _mode: 'mock' }),
          };
        }

        const connection = await getDb();
        if (!connection) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ payments: MOCK_PAYMENT_HISTORY, _mode: 'mock' }),
          };
        }

        const { client, db } = connection;
        try {
          const payments = await db.collection('ledger')
            .find({ user_id, type: 'bill_payment' })
            .sort({ created_at: -1 })
            .limit(20)
            .toArray();

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              payments: payments.map(p => ({
                id: p.txn_id || p._id.toString(),
                biller_code: p.metadata?.biller_code,
                biller_name: p.metadata?.biller_name || BILLERS.find(b => b.code === p.metadata?.biller_code)?.name,
                account_no: p.metadata?.account_no,
                amount: Math.abs(p.amount),
                status: p.status,
                paid_at: p.created_at,
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
        body: JSON.stringify({ billers: BILLERS }),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action } = body;

      if (action === 'save_biller') {
        const { biller_code, account_no, nickname } = body;

        if (!BILLERS.find(b => b.code === biller_code)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid biller' }),
          };
        }

        const biller_id = `biller_${Date.now()}`;

        if (DB_MODE === 'live') {
          const connection = await getDb();
          if (connection) {
            const { client, db } = connection;
            try {
              await db.collection('saved_billers').insertOne({
                user_id,
                biller_code,
                account_no,
                nickname: nickname || '',
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
            biller_id,
            message: 'Biller saved successfully',
            _mode: DB_MODE,
          }),
        };
      }

      if (action === 'pay') {
        const { biller_code, account_no, amount, save_biller, nickname } = body;

        if (!BILLERS.find(b => b.code === biller_code)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid biller' }),
          };
        }

        if (!amount || amount <= 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid amount' }),
          };
        }

        const transaction_id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const billerInfo = BILLERS.find(b => b.code === biller_code);

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
                type: 'bill_payment',
                category: 'Bill Payment',
                description: `${billerInfo.name} - ${account_no}`,
                currency: 'PHP',
                amount: -amount,
                status: 'paid',
                metadata: {
                  biller_code,
                  biller_name: billerInfo.name,
                  account_no,
                },
                created_at: new Date().toISOString(),
              });

              // Save biller if requested
              if (save_biller) {
                await db.collection('saved_billers').updateOne(
                  { user_id, biller_code, account_no },
                  {
                    $set: { nickname: nickname || billerInfo.name, updated_at: new Date().toISOString() },
                    $setOnInsert: { created_at: new Date().toISOString() },
                  },
                  { upsert: true }
                );
              }
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
            biller_name: billerInfo.name,
            account_no,
            amount,
            status: 'paid',
            paid_at: new Date().toISOString(),
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
    console.error('[recipient-bills] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

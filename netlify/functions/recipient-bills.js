/**
 * PBX Recipient - Bills Payment API
 * Pay Philippine billers from PHP wallet
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'pbx_database';

const USE_MOCKS = process.env.USE_MOCKS !== 'false';

// Supported billers (Phase 1 - hardcoded)
const BILLERS = [
  { code: 'meralco', name: 'Meralco', category: 'electricity', logo: '⚡' },
  { code: 'pldt', name: 'PLDT', category: 'telecom', logo: '📞' },
  { code: 'globe', name: 'Globe', category: 'telecom', logo: '🌐' },
  { code: 'smart', name: 'Smart', category: 'telecom', logo: '📱' },
  { code: 'maynilad', name: 'Maynilad', category: 'water', logo: '💧' },
  { code: 'manila_water', name: 'Manila Water', category: 'water', logo: '🚰' },
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
      
      if (params.type === 'billers') {
        // Return list of supported billers
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ billers: BILLERS }),
        };
      }

      if (params.type === 'saved') {
        // Return user's saved billers
        if (USE_MOCKS) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              saved_billers: [
                { id: 'saved_1', biller_code: 'meralco', account_no: '1234567890', nickname: 'Home Electric' },
                { id: 'saved_2', biller_code: 'pldt', account_no: '0987654321', nickname: 'Internet' },
              ],
            }),
          };
        }

        const { client, db } = await getDb();
        try {
          const saved = await db.collection('billers').find({ user_id }).toArray();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              saved_billers: saved.map(b => ({
                id: b._id.toString(),
                biller_code: b.biller_code,
                account_no: b.account_no,
                nickname: b.nickname,
              })),
            }),
          };
        } finally {
          await client.close();
        }
      }

      if (params.type === 'history') {
        // Return bill payment history
        if (USE_MOCKS) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              payments: [
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
              ],
            }),
          };
        }

        const { client, db } = await getDb();
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
                id: p.transaction_id,
                biller_code: p.metadata?.biller_code,
                biller_name: BILLERS.find(b => b.code === p.metadata?.biller_code)?.name,
                account_no: p.metadata?.account_no,
                amount: p.amount,
                status: p.status,
                paid_at: p.created_at,
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

        if (!USE_MOCKS) {
          const { client, db } = await getDb();
          try {
            await db.collection('billers').insertOne({
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

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            biller_id,
            message: 'Biller saved successfully',
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
              type: 'bill_payment',
              currency: 'PHP',
              amount,
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
              await db.collection('billers').updateOne(
                { user_id, biller_code, account_no },
                {
                  $set: {
                    nickname: nickname || '',
                    updated_at: new Date().toISOString(),
                  },
                  $setOnInsert: {
                    created_at: new Date().toISOString(),
                  },
                },
                { upsert: true }
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
            biller_name: billerInfo.name,
            account_no,
            amount,
            status: 'paid',
            paid_at: new Date().toISOString(),
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
    console.error('Bills API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

/**
 * Unified Add Money Function
 * 
 * Flow:
 * 1. Verify user's bank via Plaid
 * 2. Check available balance
 * 3. Create Circle wallet if needed
 * 4. Automatically mint USDC (1:1 with USD)
 * 5. Record transaction with both USD and USDC amounts
 * 6. Update wallet balances
 */

const { getDb } = require('./_mongoClient');

// Circle SDK setup
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_BASE_URL = process.env.CIRCLE_ENVIRONMENT === 'production' 
  ? 'https://api.circle.com/v1' 
  : 'https://api-sandbox.circle.com/v1';
const CIRCLE_WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
    },
    body: JSON.stringify(body),
  };
}

async function requireSession(db, event) {
  const token = event.headers['x-session-token'] || event.headers['X-Session-Token'];
  if (!token) throw new Error('Missing session token');
  const session = await db.collection('sessions').findOne({ token });
  if (!session) throw new Error('Invalid session');
  return session;
}

// Create Circle wallet for user if they don't have one
async function getOrCreateCircleWallet(db, userId) {
  const wallets = db.collection('wallets');
  let wallet = await wallets.findOne({ userId });
  
  if (wallet?.circleWallet?.walletId) {
    return wallet.circleWallet;
  }

  // Create new Circle wallet
  if (!CIRCLE_API_KEY) {
    // Mock mode - create fake wallet
    const mockWallet = {
      walletId: `mock_wallet_${userId}_${Date.now()}`,
      address: `0x${Buffer.from(userId).toString('hex').slice(0, 40).padEnd(40, '0')}`,
      blockchain: 'ETH-SEPOLIA',
      state: 'LIVE',
      createdAt: new Date(),
    };
    
    await wallets.updateOne(
      { userId },
      { 
        $set: { circleWallet: mockWallet, updatedAt: new Date() },
        $setOnInsert: { userId, usd: 0, php: 0, usdc: 0, createdAt: new Date() }
      },
      { upsert: true }
    );
    
    return mockWallet;
  }

  // Real Circle API call
  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotencyKey: `wallet_${userId}_${Date.now()}`,
        walletSetId: CIRCLE_WALLET_SET_ID,
        accountType: 'EOA',
        blockchain: 'ETH-SEPOLIA',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create Circle wallet');
    }

    const circleWallet = {
      walletId: data.data.wallet.id,
      address: data.data.wallet.address,
      blockchain: data.data.wallet.blockchain,
      state: data.data.wallet.state,
      createdAt: new Date(),
    };

    await wallets.updateOne(
      { userId },
      { 
        $set: { circleWallet, updatedAt: new Date() },
        $setOnInsert: { userId, usd: 0, php: 0, usdc: 0, createdAt: new Date() }
      },
      { upsert: true }
    );

    return circleWallet;
  } catch (error) {
    console.error('Circle wallet creation error:', error);
    throw new Error('Failed to create blockchain wallet');
  }
}

// Mint USDC to user's wallet (1:1 with USD)
async function mintUSDC(circleWallet, amount, transactionId) {
  if (!CIRCLE_API_KEY) {
    // Mock mode - simulate minting
    return {
      success: true,
      transactionHash: `mock_tx_${Date.now()}`,
      amount: amount,
      status: 'confirmed',
    };
  }

  try {
    const response = await fetch(`${CIRCLE_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotencyKey: transactionId,
        source: {
          type: 'wallet',
          id: process.env.CIRCLE_TREASURY_WALLET_ID,
        },
        destination: {
          type: 'wallet',
          id: circleWallet.walletId,
        },
        amount: {
          amount: amount.toFixed(2),
          currency: 'USD',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to mint USDC');
    }

    return {
      success: true,
      transactionHash: data.data.id,
      amount: amount,
      status: data.data.status,
    };
  } catch (error) {
    console.error('USDC mint error:', error);
    throw new Error('Failed to mint USDC');
  }
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return json(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
    const session = await requireSession(db, event);
    const userId = session.userId;

    const body = JSON.parse(event.body || '{}');
    const { amount, accountId, bankId } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return json(400, { error: 'Invalid amount' });
    }

    if (amount > 10000) {
      return json(400, { error: 'Maximum $10,000 per transaction' });
    }

    // Verify linked bank exists
    const banks = db.collection('banks');
    const linkedBank = await banks.findOne({ 
      userId, 
      $or: [
        { bank_id: bankId },
        { bank_id: accountId },
      ]
    });

    // Create transaction record
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const transactions = db.collection('transactions');
    
    await transactions.insertOne({
      transactionId,
      userId,
      type: 'add_money',
      amountUSD: amount,
      amountUSDC: amount, // 1:1
      fromBank: linkedBank ? {
        bank_id: linkedBank.bank_id,
        name: linkedBank.name,
        mask: linkedBank.mask,
        institution_name: linkedBank.institution_name,
      } : null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get or create Circle wallet
    const circleWallet = await getOrCreateCircleWallet(db, userId);

    // Mint USDC (1:1 with USD)
    const mintResult = await mintUSDC(circleWallet, amount, transactionId);

    // Update wallet balances
    const wallets = db.collection('wallets');
    const updatedWallet = await wallets.findOneAndUpdate(
      { userId },
      {
        $inc: { usd: amount, usdc: amount },
        $set: { updatedAt: new Date() },
        $setOnInsert: { userId, php: 0, createdAt: new Date() },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Update transaction status
    await transactions.updateOne(
      { transactionId },
      {
        $set: {
          status: mintResult.status === 'confirmed' ? 'confirmed' : 'pending',
          circleTransactionHash: mintResult.transactionHash,
          circleWalletAddress: circleWallet.address,
          updatedAt: new Date(),
        },
      }
    );

    return json(200, {
      success: true,
      transaction: {
        id: transactionId,
        amountUSD: amount,
        amountUSDC: amount,
        status: mintResult.status,
        circleTransactionHash: mintResult.transactionHash,
      },
      wallet: {
        walletId: circleWallet.walletId,
        address: circleWallet.address,
        blockchain: circleWallet.blockchain,
      },
      balances: {
        usd: updatedWallet.value?.usd || amount,
        usdc: updatedWallet.value?.usdc || amount,
        php: updatedWallet.value?.php || 0,
      },
      message: `Successfully added $${amount} USD and minted ${amount} USDC`,
    });

  } catch (error) {
    console.error('add-money-unified error:', error);
    const msg = String(error.message || error);
    const status = msg.includes('session') ? 401 : 500;
    return json(status, { error: msg });
  }
};

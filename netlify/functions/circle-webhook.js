/**
 * Circle Webhook Handler
 * 
 * Handles:
 * - Transaction confirmations from Circle
 * - Updates transaction status
 * - Reverses failed transactions
 * - Verifies webhook signatures
 */

const crypto = require('crypto');
const { getDb } = require('./_mongoClient');

const CIRCLE_WEBHOOK_SECRET = process.env.CIRCLE_WEBHOOK_SECRET;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// Verify Circle webhook signature
function verifySignature(payload, signature) {
  if (!CIRCLE_WEBHOOK_SECRET) {
    // In dev/sandbox mode without secret, accept all webhooks
    console.warn('CIRCLE_WEBHOOK_SECRET not set - accepting webhook without verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CIRCLE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const signature = event.headers['circle-signature'] || event.headers['Circle-Signature'];
    
    // Verify signature in production
    if (CIRCLE_WEBHOOK_SECRET && !verifySignature(event.body, signature)) {
      console.error('Invalid webhook signature');
      return json(401, { error: 'Invalid signature' });
    }

    const payload = JSON.parse(event.body || '{}');
    const { Type, Message } = payload;

    console.log('Circle webhook received:', Type);

    // Parse the message if it's a string
    const message = typeof Message === 'string' ? JSON.parse(Message) : Message;
    
    if (!message) {
      return json(200, { received: true, message: 'No message to process' });
    }

    const db = await getDb();
    const transactions = db.collection('transactions');
    const wallets = db.collection('wallets');

    // Handle different event types
    switch (Type) {
      case 'transfers': {
        const transfer = message;
        const transactionId = transfer.idempotencyKey;
        
        if (!transactionId) {
          console.log('No idempotencyKey in transfer, skipping');
          return json(200, { received: true });
        }

        const transaction = await transactions.findOne({ transactionId });
        
        if (!transaction) {
          console.log('Transaction not found:', transactionId);
          return json(200, { received: true, message: 'Transaction not found' });
        }

        // Update transaction status
        const newStatus = transfer.status === 'complete' ? 'confirmed' : 
                         transfer.status === 'failed' ? 'failed' : 'pending';

        await transactions.updateOne(
          { transactionId },
          {
            $set: {
              status: newStatus,
              circleStatus: transfer.status,
              circleTransactionHash: transfer.transactionHash || transfer.id,
              updatedAt: new Date(),
            },
          }
        );

        // If failed, reverse the balance
        if (newStatus === 'failed') {
          await wallets.updateOne(
            { userId: transaction.userId },
            {
              $inc: {
                usd: -transaction.amountUSD,
                usdc: -transaction.amountUSDC,
              },
              $set: { updatedAt: new Date() },
            }
          );
          console.log('Reversed failed transaction:', transactionId);
        }

        console.log('Updated transaction:', transactionId, 'status:', newStatus);
        break;
      }

      case 'wallets': {
        const wallet = message;
        console.log('Wallet event:', wallet.id, wallet.state);
        
        // Could update wallet status in DB if needed
        if (wallet.walletId) {
          await wallets.updateOne(
            { 'circleWallet.walletId': wallet.walletId },
            {
              $set: {
                'circleWallet.state': wallet.state,
                updatedAt: new Date(),
              },
            }
          );
        }
        break;
      }

      default:
        console.log('Unknown webhook type:', Type);
    }

    return json(200, { received: true, processed: true });

  } catch (error) {
    console.error('Circle webhook error:', error);
    // Always return 200 to prevent retries for processing errors
    return json(200, { received: true, error: error.message });
  }
};

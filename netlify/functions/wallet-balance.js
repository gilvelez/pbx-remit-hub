const { getDb } = require("./_mongoClient");
const { getWallet } = require("./walletStore");

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function requireSession(db, event) {
  const token = event.headers["x-session-token"] || event.headers["X-Session-Token"];
  if (!token) throw new Error("Missing session token");
  const session = await db.collection("sessions").findOne({ token });
  if (!session) throw new Error("Invalid session");
  return session;
}

exports.handler = async (event) => {
  try {
    const db = await getDb();
    const session = await requireSession(db, event);

    // Get wallet with USDC balance and Circle wallet info
    const wallets = db.collection('wallets');
    let wallet = await wallets.findOne({ userId: session.userId });
    
    if (!wallet) {
      // Create default wallet
      wallet = { 
        userId: session.userId, 
        usd: 0, 
        php: 0, 
        usdc: 0,
        circleWallet: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await wallets.insertOne(wallet);
    }

    return json(200, { 
      usd: Number(wallet.usd || 0), 
      php: Number(wallet.php || 0),
      usdc: Number(wallet.usdc || 0),
      circleWallet: wallet.circleWallet ? {
        address: wallet.circleWallet.address,
        blockchain: wallet.circleWallet.blockchain,
        state: wallet.circleWallet.state,
      } : null,
    });

  } catch (err) {
    console.error("wallet-balance error:", err);
    const msg = String(err.message || err);
    const status = msg.includes("session") ? 401 : 500;
    return json(status, { error: msg });
  }
};

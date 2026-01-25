const { getDb } = require("./_mongoClient");

async function getWallet(db, userId) {
  const col = db.collection("wallets");
  const doc = await col.findOne({ userId });
  if (doc) return doc;
  const base = { 
    userId, 
    usd: 0, 
    php: 0, 
    usdc: 0,
    circleWallet: null,
    updatedAt: new Date(), 
    createdAt: new Date() 
  };
  await col.insertOne(base);
  return base;
}

async function setWallet(db, userId, patch) {
  const col = db.collection("wallets");
  await col.updateOne(
    { userId },
    { $set: { ...patch, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  return getWallet(db, userId);
}

module.exports = { getWallet, setWallet };

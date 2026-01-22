exports.handler = async () => {
  const baseUrl = process.env.CIRCLE_BASE_URL || 'https://api-sandbox.circle.com/v1';
  const useMocks = (process.env.CIRCLE_USE_MOCKS || '').toLowerCase() === 'true';
  const treasuryId = process.env.CIRCLE_TREASURY_WALLET_ID || process.env.CIRCLE_MERCHANT_WALLET_ID || '';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      circle: {
        use_mocks: useMocks,
        base_url: baseUrl,
        has_api_key: !!process.env.CIRCLE_API_KEY,
        has_treasury_wallet_id: !!treasuryId,
        has_user_wallet_id: !!process.env.CIRCLE_USER_WALLET_ID,
        treasury_wallet_id_source: process.env.CIRCLE_TREASURY_WALLET_ID ? 'CIRCLE_TREASURY_WALLET_ID' : (process.env.CIRCLE_MERCHANT_WALLET_ID ? 'CIRCLE_MERCHANT_WALLET_ID' : 'none')
      }
    })
  };
};

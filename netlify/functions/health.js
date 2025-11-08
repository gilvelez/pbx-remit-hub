export const handler = async () => {
  return { statusCode: 200, body: JSON.stringify({ ok: true, env: process.env.PBX_ENV || 'dev', mocks: true }) };
};

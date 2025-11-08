export default async () => {
  const res = await fetch('https://api-sandbox.circle.com/v1/configuration', {
    headers: { Accept: 'application/json' },
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'content-type': 'application/json' } });
};

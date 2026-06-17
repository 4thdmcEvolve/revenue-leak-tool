export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  console.log('SYNTHESIZE FUNCTION HIT - method:', req.method);
  console.log('SYNTHESIZE BODY:', JSON.stringify(req.body));
  console.log('SYNTHESIZE API KEY PRESENT:', !!process.env.ANTHROPIC_API_KEY);

  return res.status(200).json({ success: true, text: 'TEST RESPONSE - function is reachable' });
}

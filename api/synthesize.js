const ipRequests = new Map();
const RATE_LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipRequests.get(ip);
  if (!record || now - record.windowStart > WINDOW_MS) {
    ipRequests.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getIP(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
  }

  const {
    clientName, clientBiz, topNames,
    conservativeAnnual, broaderAnnual, mode,
    responseSpeed, referralAsk, reviewStrength
  } = req.body;

  const prompt = `You are a senior business consultant for 4THDMC | EVOLVE LLC. You are in a paid Begin engagement session with ${clientName} from ${clientBiz}. Write a short consultant interpretation paragraph (3-4 sentences) based on these revenue leak audit results. Be direct and specific. Do not use hype language. Do not make guarantees. Use words like "estimated" and "suggests." Reference the top leaks by name and dollar amount. End with one sentence identifying the single highest-priority fix.

Top leaks: ${topNames}
Conservative annual leak: ${conservativeAnnual}
Broader opportunity gap: ${broaderAnnual}
Assumption mode: ${mode}
Lead response speed: ${responseSpeed}
Referral ask frequency: ${referralAsk}
Review strength: ${reviewStrength}`;

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await anthropicRes.json();
    console.log('Anthropic raw response:', JSON.stringify(data));
    const text = (data.content || []).map(b => b.text || '').join('').trim();
    console.log('Extracted text:', text);

    return res.status(200).json({ success: true, text });

  } catch (err) {
    console.error('Synthesize error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate synthesis.' });
  }
}

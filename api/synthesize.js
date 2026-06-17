export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  console.log('SYNTHESIZE FUNCTION HIT');
  console.log('API KEY PRESENT:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API KEY LENGTH:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0);

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
    console.log('ABOUT TO CALL ANTHROPIC');

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('ANTHROPIC HTTP STATUS:', anthropicRes.status);

    const data = await anthropicRes.json();
    console.log('ANTHROPIC FULL RESPONSE:', JSON.stringify(data));

    const text = (data.content || []).map(b => b.text || '').join('').trim();
    console.log('EXTRACTED TEXT LENGTH:', text.length);

    return res.status(200).json({ success: true, text, debugStatus: anthropicRes.status });

  } catch (err) {
    console.error('SYNTHESIZE CATCH ERROR:', err.message, err.stack);
    return res.status(500).json({ success: false, error: 'Failed to generate synthesis.', debugError: err.message });
  }
}

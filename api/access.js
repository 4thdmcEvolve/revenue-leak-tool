export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: 'No access code provided.' });
  }

  const validCode = process.env.ACCESS_CODE;

  if (!validCode) {
    console.error('ACCESS_CODE environment variable not set.');
    return res.status(500).json({ success: false, error: 'Server configuration error. Contact brandon@4thdmc.com.' });
  }

  if (code.trim() !== validCode) {
    return res.status(401).json({ success: false, error: 'Incorrect access code.' });
  }

  return res.status(200).json({ success: true });
}

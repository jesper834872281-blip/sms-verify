const API_KEY = process.env.SMS_API_KEY;
const MAX_USES = 2;

const COUNTRY_MAP = {
  "16": "england",
  "73": "brazil",
  "187": "usa"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { code, country } = req.query;
  if (!code) return res.status(400).json({ error: "请输入授权码" });

  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  // 查询授权码
  const r = await fetch(`${redisUrl}/hgetall/code:${code}`, {
    headers: { Authorization: `Bearer ${redisToken}` }
  });
  const d = await r.json();
  const fields = d.result || [];

  if (!fields || fields.length === 0) {
    return res.status(403).json({ error: "授权码无效" });
  }

  const obj = {};
  for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i+1];

  const uses = parseInt(obj.uses ?? 0);
  if (uses >= MAX_USES) {
    return res.status(403).json({ error: `授权码已用完（限${MAX_USES}次）` });
  }

  const countryCode = country || obj.country || "16";
  const countrySlug = COUNTRY_MAP[countryCode] || "england";

  try {
    const response = await fetch(
      `https://5sim.net/v1/user/buy/activation/${countrySlug}/any/claude`,
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json"
        }
      }
    );
    const result = await response.json();

    if (result.id) {
      await fetch(`${redisUrl}/hset/code:${code}/uses/${uses + 1}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      res.json({ order_id: String(result.id), phone: String(result.phone) });
    } else {
      res.status(400).json({ error: JSON.stringify(result) });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

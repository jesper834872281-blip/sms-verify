import { kv } from '@vercel/kv';

const API_KEY = process.env.SMS_API_KEY;
const MAX_USES = 2;

const COUNTRY_MAP = {
  "16":  "gb",
  "73":  "brazil",
  "187": "usa"
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { code, country } = req.query;

  if (!code) {
    return res.status(400).json({ error: "请输入授权码" });
  }

  const key = `code:${code}`;
  const data = await kv.hgetall(key);

  if (!data) {
    return res.status(403).json({ error: "授权码无效" });
  }

  const uses = parseInt(data.uses ?? 0);
  if (uses >= MAX_USES) {
    return res.status(403).json({ error: `授权码已用完（限${MAX_USES}次）` });
  }

  // 用码中绑定的国家，或用传入的国家
  const countryCode = country || data.country || "16";
  const countrySlug = COUNTRY_MAP[countryCode] || "gb";

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
      await kv.hset(key, { uses: uses + 1 });
      res.json({ order_id: String(result.id), phone: String(result.phone) });
    } else {
      res.status(400).json({ error: JSON.stringify(result) });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

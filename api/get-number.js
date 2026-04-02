const API_KEY = process.env.SMS_API_KEY;
const MAX_USES = 2;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { code, country } = req.query;
  if (!code) return res.status(400).json({ error: "请输入授权码" });

  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  try {
    // 验证授权码
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

    // 调用hero-sms获取号码
    const response = await fetch(
      `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=acz&country=${countryCode}`
    );

    const rawText = await response.text();
    console.log("hero-sms response:", rawText);

    if (!rawText || rawText.trim() === "") {
      return res.status(500).json({ error: "hero-sms返回空响应，请检查余额" });
    }

    const parts = rawText.split(":");
    if (parts[0] === "ACCESS_NUMBER") {
      // 扣除授权码次数
      await fetch(`${redisUrl}/hset/code:${code}/uses/${uses + 1}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      res.json({ order_id: parts[1], phone: parts[2].trim() });
    } else {
      res.status(400).json({ error: rawText });
    }

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

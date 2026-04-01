const API_KEY = process.env.SMS_API_KEY;
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

const PASSWORDS = {
  "CLAUDE-UK-99": "12",
  "CLAUDE-BR-88": "73",
  "CLAUDE-US-77": "187"
};

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userCode = req.query.code;
  if (!PASSWORDS[userCode]) return res.status(403).json({ error: "授权码无效" });

  try {
    // 1. 检查 Redis 状态
    const check = await fetch(`${REDIS_URL}/get/${userCode}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
    const status = await check.json();
    if (status.result === "used") return res.status(403).json({ error: "该授权码已失效（已使用过）" });

    // 2. 获取号码
    const country = PASSWORDS[userCode];
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=kt&country=${country}`;
    const response = await fetch(url);
    const rawText = await response.text();

    if (rawText.startsWith("ACCESS_NUMBER")) {
      const [_, orderId, phone] = rawText.split(":");
      
      // 3. 锁定卡密（有效期20分钟，防止刷新重复取号）
      await fetch(`${REDIS_URL}/set/${userCode}/used/EX/1200`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });

      res.status(200).json({ order_id: orderId, phone: phone });
    } else {
      res.status(400).json({ error: rawText });
    }
  } catch (e) {
    res.status(500).json({ error: "服务器通讯错误" });
  }
};

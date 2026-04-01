const API_KEY = process.env.SMS_API_KEY;
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { order_id, code } = req.query;

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getStatus&id=${order_id}`;
    const response = await fetch(url);
    const rawText = await response.text();

    if (rawText.startsWith("STATUS_OK")) {
      const smsCode = rawText.split(":")[1];

      // 🌟 收到验证码！将授权码在 Redis 中永久标记为 "used"
      await fetch(`${REDIS_URL}/set/${code}/used`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });

      res.status(200).json({ status: "ok", code: smsCode });
    } else {
      res.status(200).json({ status: "waiting" });
    }
  } catch (e) {
    res.status(500).json({ error: "查询失败" });
  }
};

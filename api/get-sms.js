const API_KEY = process.env.SMS_API_KEY;
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const orderId = req.query.order_id;
  const userCode = req.query.code;

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getStatus&id=${orderId}`;
    const response = await fetch(url);
    const rawText = await response.text();

    if (rawText.startsWith("STATUS_OK")) {
      const code = rawText.split(":")[1];

      // 🌟 核心：验证码到手，永久标记为已使用
      await fetch(`${REDIS_URL}/set/${userCode}/used`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });

      res.status(200).json({ status: "ok", code: code });
    } else {
      res.status(200).json({ status: "waiting" });
    }
  } catch (e) {
    res.status(500).json({ error: "轮询失败" });
  }
};

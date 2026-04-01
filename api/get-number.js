const API_KEY = process.env.SMS_API_KEY;
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const userCode = req.query.code ? req.query.code.trim() : null;

  if (!userCode) return res.status(400).json({ error: "请输入授权码" });

  try {
    // 1. 检查 Redis
    const checkRes = await fetch(`${REDIS_URL}/get/${userCode}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
    const checkData = await checkRes.json();

    if (!checkData.result) return res.status(403).json({ error: "授权码无效" });
    if (checkData.result === "used") return res.status(403).json({ error: "该授权码已失效" });

    const country = checkData.result;
    
    // 2. 这里的 URL 加了 operator=any 和强力参数
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=kt&country=${country}&operator=any`;
    
    const response = await fetch(url);
    let rawText = await response.text();
    rawText = rawText.trim(); // 🌟 关键修复：强力去除前后空格和换行

    console.log("平台返回原始数据:", rawText);

    if (rawText.includes("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      const orderId = parts[1];
      const phone = parts[2];
      
      // 成功才锁定 Redis (设置20分钟锁定)
      await fetch(`${REDIS_URL}/set/${userCode}/used/EX/1200`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });

      res.status(200).json({ order_id: orderId, phone: phone });
    } else {
      // 🌟 如果报错了，我们不锁定 Redis，让用户换个国家能继续用这个码
      res.status(400).json({ error: `平台提示: ${rawText}` });
    }
  } catch (e) {
    res.status(500).json({ error: "系统繁忙，请稍后再试" });
  }
};

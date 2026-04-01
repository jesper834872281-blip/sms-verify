const API_KEY = process.env.SMS_API_KEY;
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const userCode = req.query.code;

  if (!userCode) return res.status(400).json({ error: "请输入授权码" });

  try {
    // 1. 从 Redis 调取授权码信息
    const checkRes = await fetch(`${REDIS_URL}/get/${userCode}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
    const checkData = await checkRes.json();

    // 逻辑判定
    if (!checkData.result) {
      return res.status(403).json({ error: "授权码无效或未激活" });
    }
    if (checkData.result === "used") {
      return res.status(403).json({ error: "该授权码已失效" });
    }

    // 2. 这里的 result 就是之前存入的国家代码 (如 "12")
    const country = checkData.result;
  // 找到这一行并替换
    
const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=kt&country=${country}&operator=any&ref=any&maxPrice=100`;
    
    const response = await fetch(url);
    const rawText = await response.text();

    if (rawText.startsWith("ACCESS_NUMBER")) {
      const [_, orderId, phone] = rawText.split(":");
      
      // 3. 临时锁定授权码 (EX 1200 = 20分钟后自动过期恢复，防止刷新重复取号)
      await fetch(`${REDIS_URL}/set/${userCode}/used/EX/1200`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
      });

      res.status(200).json({ order_id: orderId, phone: phone });
    } else {
      res.status(400).json({ error: rawText });
    }
  } catch (e) {
    res.status(500).json({ error: "后端通讯故障" });
  }
};

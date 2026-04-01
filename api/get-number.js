const API_KEY = process.env.SMS_API_KEY;

// 锁死 Claude 专属代号
const TARGET_SERVICE = "acz"; 

module.exports = async function handler(req, res) {
  // 跨域 Header
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userCode = req.query.code;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // 1. 基础校验
  if (!userCode || !userCode.includes(today)) {
    return res.status(403).json({ error: "授权码无效或已过期" });
  }

  // 2. 严格控制国家逻辑：只允许 BR (巴西) 和 UK (英国)
  let country = "";
  const upperCode = userCode.toUpperCase();

  if (upperCode.includes("BR")) {
    country = "73";  // 巴西 (低价区 $0.05)
  } else if (upperCode.includes("UK")) {
    country = "12";  // 英国 (中低价区)
  } else {
    // 如果卡密里不含 BR 或 UK，直接拒绝请求
    return res.status(403).json({ error: "该授权码不支持此地区，请获取 BR 或 UK 授权码" });
  }

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=${TARGET_SERVICE}&country=${country}`;
    
    const response = await fetch(url);
    const rawText = await response.text(); 
    
    console.log(`=== Hero-SMS 响应: ${country} ===\n${rawText}`);

    if (rawText.startsWith("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      res.status(200).json({ order_id: parts[1], phone: parts[2] });
    } 
    else {
      let errorMsg = rawText;
      if (rawText === "NO_NUMBERS") errorMsg = "当前地区 Claude 号码暂无库存";
      if (rawText === "NO_BALANCE") errorMsg = "系统维护中(余额不足)";
      
      res.status(400).json({ error: errorMsg });
    }
  } catch (e) {
    res.status(500).json({ error: "服务器连接失败" });
  }
};

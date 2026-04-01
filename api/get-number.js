const API_KEY = process.env.SMS_API_KEY;

module.exports = async function handler(req, res) {
  // 允许跨域访问
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. 获取前端传来的授权码 (code)
  const userCode = req.query.code;

  // 2. 生成今天的日期字符串 (例如: 20260401)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // 3. 校验逻辑：必须输入包含今天日期的授权码
  if (!userCode || !userCode.includes(today)) {
    return res.status(403).json({ error: "授权码错误或已过期(仅限当日使用)" });
  }

  // 4. 固定服务为 Claude (代码 af)，并根据卡密里的关键字自动匹配国家
  const service = "af"; 
  let country = "12"; // 默认发英国 (12)

  const upperCode = userCode.toUpperCase();
  if (upperCode.includes("US")) {
    country = "187"; // 如果卡密带 US，发美国
  } else if (upperCode.includes("BR")) {
    country = "73";  // 如果卡密带 BR，发巴西
  }

  try {
    // 构造请求 Hero-SMS 的 URL
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=${service}&country=${country}`;
    
    const response = await fetch(url);
    const rawText = await response.text(); 
    
    console.log(`=== Hero-SMS 返回 ===\n${rawText}`);

    // 解析返回结果
    if (rawText.startsWith("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      res.status(200).json({ 
        order_id: parts[1], 
        phone: parts[2] 
      });
    } 
    else {
      // 处理各种报错情况 (库存不足、余额不足等)
      let errorMsg = rawText;
      if (rawText === "NO_NUMBERS") errorMsg = "该国家 Claude 号码暂时缺货";
      if (rawText === "NO_BALANCE") errorMsg = "系统余额不足，请联系管理员";
      
      res.status(400).json({ error: errorMsg });
    }

  } catch (e) {
    console.error("后端运行报错:", e);
    res.status(500).json({ error: "服务器内部通讯失败" });
  }
};

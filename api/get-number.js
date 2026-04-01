const API_KEY = process.env.SMS_API_KEY;

// 🌟 根据 Hero-SMS 货架分析，Claude 的正确代号为 av
const TARGET_SERVICE = "av"; 

module.exports = async function handler(req, res) {
  // 1. 设置跨域 Header，确保前端可以顺利访问
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 获取前端传来的 code
  const userCode = req.query.code;
  
  // 3. 生成今天的日期字符串 (例如: 20260401)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // 4. 安全校验：授权码必须包含当天的日期字符串
  if (!userCode || !userCode.includes(today)) {
    return res.status(403).json({ error: "授权码错误或已过期(仅限当日使用)" });
  }

  // 5. 自动识别国家 (默认英国 12)
  let country = "12"; 
  const upperCode = userCode.toUpperCase();
  
  if (upperCode.includes("US")) {
    country = "187"; // 美国
  } else if (upperCode.includes("BR")) {
    country = "73";  // 巴西
  }

  try {
    // 6. 请求 Hero-SMS 接口
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=${TARGET_SERVICE}&country=${country}`;
    
    const response = await fetch(url);
    const rawText = await response.text(); 
    
    console.log(`=== Hero-SMS 接口原始返回 ===\n${rawText}`);

    // 7. 解析返回结果
    if (rawText.startsWith("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      const orderId = parts[1];
      const phone = parts[2];
      
      // 成功：返回订单号和手机号给前端
      res.status(200).json({ order_id: orderId, phone: phone });
    } 
    else {
      // 失败：翻译常见的错误提示
      let errorMsg = rawText;
      if (rawText === "NO_NUMBERS") errorMsg = "当前国家号码已售罄，请换个国家测试";
      if (rawText === "NO_BALANCE") errorMsg = "系统余额不足，请联系管理员充值";
      if (rawText === "SERVICE_NOT_AVAILABLE") errorMsg = "该国家暂不支持 Claude 业务";
      if (rawText === "BAD_KEY") errorMsg = "后端 API 配置错误";
      
      res.status(400).json({ error: errorMsg });
    }

  } catch (e) {
    console.error("代码运行报错:", e);
    res.status(500).json({ error: "服务器内部通讯故障" });
  }
};

const API_KEY = process.env.SMS_API_KEY;

// 🌟 核心修改：将 av 改为 ot (Any Other)，这是万能代号，绕过平台货架限制
const TARGET_SERVICE = "ot"; 

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userCode = req.query.code;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (!userCode || !userCode.includes(today)) {
    return res.status(403).json({ error: "授权码错误或已过期" });
  }

  // 识别国家
  let country = "12"; // 默认英国
  const upperCode = userCode.toUpperCase();
  if (upperCode.includes("US")) country = "187"; // 美国
  if (upperCode.includes("BR")) country = "73";  // 巴西

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=${TARGET_SERVICE}&country=${country}`;
    
    const response = await fetch(url);
    const rawText = await response.text(); 
    
    console.log(`=== Hero-SMS 返回 ===\n${rawText}`);

    if (rawText.startsWith("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      res.status(200).json({ order_id: parts[1], phone: parts[2] });
    } 
    else {
      let errorMsg = rawText;
      if (rawText === "NO_NUMBERS") errorMsg = "当前国家号码已售罄，请尝试其他国家";
      if (rawText === "NO_BALANCE") errorMsg = "余额不足";
      if (rawText === "SERVICE_NOT_AVAILABLE") errorMsg = "该国家暂不支持万能接码模式";
      
      res.status(400).json({ error: errorMsg });
    }

  } catch (e) {
    res.status(500).json({ error: "连接失败" });
  }
};

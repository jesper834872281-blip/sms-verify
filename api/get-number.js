const API_KEY = process.env.SMS_API_KEY;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // 接收前端传来的国家代码：英国(12), 巴西(73), 美国(187)
  const country = req.query.country || "12"; 
  
  // 🌟 这里换成你刚刚确认的绝对正确的 Claude 专属代码：acz
  const service = "acz"; 

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=${service}&country=${country}`;
    
    const response = await fetch(url);
    const rawText = await response.text();

    if (rawText.startsWith("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      const orderId = parts[1];
      const phone = parts[2];
      return res.status(200).json({ order_id: orderId, phone: phone });
    } else {
      return res.status(400).json({ error: "平台报错: " + rawText });
    }
  } catch (e) {
    return res.status(500).json({ error: "服务器内部错误: " + e.message });
  }
};

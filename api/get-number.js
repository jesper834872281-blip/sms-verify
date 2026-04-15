const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const country = req.query.country || "16"; 
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
}

import fetch from 'node-fetch';

const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  // 允许跨域访问
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 接收前端传来的参数
  let service = req.query.service || "go";
  let country = req.query.country || "3";

  // 兼容你前端原来的 5sim 参数格式，自动转换成 Hero-SMS 的格式
  // Hero-SMS 中：谷歌是 'go'，中国是 '3'
  if (service.toLowerCase() === "google") service = "go";
  if (country.toLowerCase() === "china" || country.toLowerCase() === "cn") country = "3";

  try {
    // Hero-SMS 的标准 API 链接 (极致简单，不需要任何 Headers 伪装)
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getNumber&service=${service}&country=${country}`;
    
    const response = await fetch(url);
    const rawText = await response.text(); // 它返回的是纯文本，不是 JSON
    
    console.log(`=== Hero-SMS 接口返回 ===\n${rawText}`);

    // 成功的返回格式通常是：ACCESS_NUMBER:123456789:8613800000000
    if (rawText.startsWith("ACCESS_NUMBER")) {
      const parts = rawText.split(":");
      const orderId = parts[1];
      const phone = parts[2];
      
      // 完美返回给你的前端
      res.status(200).json({ order_id: orderId, phone: phone });
    } 
    else if (rawText === "NO_NUMBERS") {
      res.status(400).json({ error: "该国家/服务的号码暂时没库存了" });
    }
    else if (rawText === "NO_BALANCE") {
      res.status(400).json({ error: "账号余额不足，请充值" });
    }
    else if (rawText === "BAD_KEY") {
      res.status(400).json({ error: "API 密钥错误，请检查 Vercel 环境变量" });
    }
    else {
      // 其他报错
      res.status(400).json({

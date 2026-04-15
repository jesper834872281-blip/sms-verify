const API_KEY = process.env.SMS_API_KEY;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // 🌟 核心修复：强制打断 Vercel 和浏览器的缓存魔法
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const { order_id } = req.query;

  try {
    // 🌟 核心修复：在末尾加上时间戳 `_t=${Date.now()}`，每次都生成一个全新的请求链接
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getStatus&id=${order_id}&_t=${Date.now()}`;
    
    // 🌟 核心修复：明确告诉 fetch 机制“不要读取本地缓存”
    const response = await fetch(url, { cache: "no-store" });
    const rawText = await response.text();

    if (rawText.startsWith("STATUS_OK")) {
      const code = rawText.split(":")[1];
      return res.status(200).json({ status: "ok", code: code });
    } else {
      return res.status(200).json({ status: "waiting" });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  // 允许跨域请求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const service = req.query.service || "google";
  const country = req.query.country || "china";

try {
    const response = await fetch(
      `https://5sim.net/v1/user/buy/activation/${country}/any/${service}`,
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json",
          // 下面是新增的伪装代码
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
          "Referer": "https://5sim.net/"
        }
      }
    );
// ... 后面保持你现在的代码不变 ...
    // 【关键修改 1】先将返回结果作为纯文本读取，不要直接强转 JSON
    const rawText = await response.text();

    // 【关键修改 2】把 5sim 返回的真实状态和前 500 个字符打印到 Vercel 日志里
    console.log(`=== 5sim HTTP 状态码: ${response.status} ===`);
    console.log(`=== 5sim 返回真实内容 ===\n${rawText.substring(0, 500)}`);

    let data;
    try {
      // 尝试手动解析 JSON
      data = JSON.parse(rawText);
    } catch (parseError) {
      // 如果解析失败，说明 5sim 返回了 HTML（大概率是被 Cloudflare 拦截了）
      console.error("JSON 解析失败！5sim 返回的不是标准 JSON 数据。");
      return res.status(502).json({ 
        error: "请求 5sim 失败，服务器返回了非预期的数据（可能是防爬虫拦截）。",
        status: response.status,
        raw_response: rawText.substring(0, 200) // 把错误片段传给前端
      });
    }

    // 解析成功后的正常逻辑处理
    if (data.id) {
      res.json({ order_id: String(data.id), phone: String(data.phone) });
    } else {
      // 处理 5sim 返回的业务错误（如余额不足、没有可用号码等）
      res.status(400).json({ error: typeof data === 'string' ? data : JSON.stringify(data) });
    }

  } catch (e) {
    console.error("Vercel 请求外网失败:", e);
    res.status(500).json({ error: e.message });
  }
}

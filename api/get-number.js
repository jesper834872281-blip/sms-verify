import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const API_KEY = process.env.SMS_API_KEY;
const PROXY_URL = process.env.PROXY_URL; // 从 Vercel 读取你的代理链接

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const service = req.query.service || "google";
  const country = req.query.country || "china";

  try {
    // 创建代理引擎
    const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

    const response = await fetch(
      `https://5sim.net/v1/user/buy/activation/${country}/any/${service}`,
      {
        agent: agent, // 穿上代理的“外衣”
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
      }
    );

    const rawText = await response.text();
    console.log(`=== 经过代理后的 HTTP 状态码: ${response.status} ===`);
    console.log(`=== 5sim 返回内容 ===\n${rawText.substring(0, 500)}`);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("解析 JSON 失败，代理可能失效或仍被拦截！");
      return res.status(502).json({ 
        error: "请求 5sim 失败，返回了非预期数据（可能代理 IP 也被封了）",
        status: response.status,
        raw_response: rawText.substring(0, 200) 
      });
    }

    if (data.id) {
      res.json({ order_id: String(data.id), phone: String(data.phone) });
    } else {
      res.status(400).json({ error: typeof data === 'string' ? data : JSON.stringify(data) });
    }

  } catch (e) {
    console.error("请求完全失败（检查代理是否存活）:", e);
    res.status(500).json({ error: e.message });
  }
}

import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  const PROXY_URL = process.env.PROXY_URL; 
  const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

  try {
    // 让代码去问查 IP 的网站："我现在的 IP 是多少？"
    const response = await fetch('https://api.ipify.org?format=json', { agent });
    const data = await response.json();
    
    // 把查到的真实 IP 显示在网页上
    res.status(200).json({ 
      message: "当前 Vercel 请求外网使用的真实 IP 是：", 
      ip: data.ip 
    });
  } catch (e) {
    res.status(500).json({ error: "代理连接失败: " + e.message });
  }
}

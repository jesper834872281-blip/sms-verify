import { kv } from '@vercel/kv';

const ADMIN_PASSWORD = "200102";
const MAX_USES = 2; // 每个授权码最多用2次

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { adminPass, country } = req.query;
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "管理员密码错误" });
  }

  // 生成随机8位码
  const newCode = "SN-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  // 存入KV：码 → 使用次数0，附带国家信息
  await kv.hset(`code:${newCode}`, { uses: 0, country: country || "16" });

  res.status(200).json({ code: newCode, country: country, msg: "生码成功" });
}

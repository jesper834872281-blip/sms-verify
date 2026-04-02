const ADMIN_PASSWORD = "200102";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { adminPass, country } = req.query;
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "管理员密码错误" });
  }

  const newCode = "SN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;
  const createdAt = Date.now(); // 记录生成时间

  await fetch(`${redisUrl}/hset/code:${newCode}/uses/0/country/${country || "16"}/createdAt/${createdAt}`, {
    headers: { Authorization: `Bearer ${redisToken}` }
  });

  res.status(200).json({ code: newCode, country: country, msg: "生码成功" });
}

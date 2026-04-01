const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;
const ADMIN_PASSWORD = "200102"; 

export default async function handler(req, res) {
  const { adminPass, country } = req.query;

  if (adminPass !== ADMIN_PASSWORD) return res.status(401).send("无权生码");

  // 随机生成一个 8 位授权码
  const newCode = "SN-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  // 存入 Redis，存入国家代码作为 Value
  await fetch(`${REDIS_URL}/set/${newCode}/${country}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });

  res.status(200).json({ code: newCode, msg: "生码成功，请发给客户" });
}

const ADMIN_MASTER_KEY = "5201314";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { key, revoke } = req.query;
  if (key !== ADMIN_MASTER_KEY) {
    return res.status(403).json({ error: "管理员密码错误" });
  }

  const redisUrl = process.env.REDIS_URL;
  const redisToken = process.env.REDIS_TOKEN;

  // 作废码
  if (revoke) {
    await fetch(`${redisUrl}/hset/code:${revoke}/uses/99`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    return res.status(200).json({ success: true });
  }

  // 获取所有码
  const keysRes = await fetch(`${redisUrl}/keys/code:*`, {
    headers: { Authorization: `Bearer ${redisToken}` }
  });
  const keysData = await keysRes.json();
  const keys = keysData.result || [];

  if (keys.length === 0) return res.status(200).json([]);

  const list = await Promise.all(keys.map(async (k) => {
    const r = await fetch(`${redisUrl}/hgetall/${k}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    const d = await r.json();
    const fields = d.result || [];
    const obj = {};
    for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i+1];
    const uses = parseInt(obj.uses ?? 0);
    return {
      code: k.replace("code:", ""),
      uses: uses,
      country: obj.country ?? "未知",
      status: uses >= 99 ? "已作废" : uses >= 2 ? "已用完" : "可用"
    };
  }));

  res.status(200).json(list);
}

import { kv } from '@vercel/kv';

const ADMIN_MASTER_KEY = "5201314";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { key } = req.query;
  if (key !== ADMIN_MASTER_KEY) {
    return res.status(403).json({ error: "管理员密码错误" });
  }

  // 获取所有授权码
  const keys = await kv.keys("code:*");

  if (!keys || keys.length === 0) {
    return res.status(200).json([]);
  }

  // 获取每个码的详情
  const list = await Promise.all(keys.map(async (k) => {
    const data = await kv.hgetall(k);
    const code = k.replace("code:", "");
    return {
      code: code,
      uses: data?.uses ?? 0,
      country: data?.country ?? "未知",
      status: parseInt(data?.uses ?? 0) >= 2 ? "已用完" : "可用"
    };
  }));

  res.status(200).json(list);
}

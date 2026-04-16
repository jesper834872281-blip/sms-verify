export default async function handler(req, res) {
  // 设置跨域，绝不缓存
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ valid: false, error: "未提供授权码" });
  }

  try {
    // 🌟 1. 获取你的 Redis 数据库钥匙
    const redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;

    if (!redisUrl || !redisToken) {
       return res.status(500).json({ valid: false, error: "服务器缺失数据库环境变量" });
    }

    // 🌟 2. 直接去 Redis 里翻找这个授权码的档案
    const response = await fetch(`${redisUrl}/hgetall/code:${code}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    const data = await response.json();
    const fields = data.result || [];

    // 🌟 3. 如果结果是空的，说明根本没生成过这个码
    if (fields.length === 0) {
      return res.status(200).json({ valid: false, error: "授权码不存在或输入有误！" });
    }

    // 🌟 4. 把查到的数据翻译成对象
    const obj = {};
    for (let i = 0; i < fields.length; i += 2) {
      obj[fields[i]] = fields[i+1];
    }

    const uses = parseInt(obj.uses ?? 0);

    // 🌟 5. 检查卡密状态
    if (uses >= 99) {
      return res.status(200).json({ valid: false, error: "该授权码已被管理员作废！" });
    }
    
    // 从你的 admin 代码来看，你似乎设计了最多可以用 2 次？
    // 如果你想限制只能用 1 次，就把这里的 >= 2 改成 >= 1
    if (uses >= 2) { 
      return res.status(200).json({ valid: false, error: "该授权码次数已用尽！" });
    }

    // 🎉 6. 全部通过，开门放行！
    return res.status(200).json({ valid: true });

  } catch (error) {
    return res.status(500).json({ valid: false, error: "验证服务器网络波动，请重试" });
  }
}

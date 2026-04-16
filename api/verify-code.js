export default async function handler(req, res) {
  // 设置跨域，绝不缓存
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ valid: false, error: "未提供授权码" });
  }

  try {
    // 🌟 1. 自动获取你当前的 Vercel 域名
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // 🌟 2. 这里的 200102 是你刚才抓包泄露的管理员密码
    // 如果你以后在 admin.html 里换了总密码，记得把这里也同步改一下！
    const adminKey = "200102"; 
    
    // 🌟 3. 让 Vercel 自己去查自己的账本
    const listUrl = `${protocol}://${host}/api/list-codes?key=${adminKey}`;
    
    const response = await fetch(listUrl);
    const codesList = await response.json();

    if (codesList.error) {
      return res.status(500).json({ valid: false, error: "账本读取失败: " + codesList.error });
    }

    // 🌟 4. 在全库卡密里，寻找客户填写的这个码
    const foundCode = codesList.find(c => c.code === code);

    if (!foundCode) {
      return res.status(200).json({ valid: false, error: "授权码不存在或输入有误！" });
    }

    // 🌟 5. 检查卡密状态 (同步你 admin.html 里的防白嫖逻辑)
    if (parseInt(foundCode.uses) >= 99) {
      return res.status(200).json({ valid: false, error: "该授权码已被管理员作废！" });
    }
    
    // 如果你想限制一个码只能接 1 次或 2 次，在这里拦截
    // 这里设置的是如果已经接码成功过，就不让进了
    if (parseInt(foundCode.uses) >= 1) { 
      return res.status(200).json({ valid: false, error: "该授权码次数已用尽！" });
    }

    // 🎉 6. 全部通过，开门放行！
    return res.status(200).json({ valid: true });

  } catch (error) {
    return res.status(500).json({ valid: false, error: "验证服务器开小差了，请重试" });
  }
}

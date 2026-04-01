// 这里要和你 get-number.js 里的密码本保持同步
const PASSWORDS = {
  "CLAUDE-UK-99": "英国 (12)",
  "CLAUDE-BR-88": "巴西 (73)",
  "CLAUDE-US-77": "美国 (187)"
};

// 🌟 设置一个管理员总密码，只有输入这个才能看列表
const ADMIN_MASTER_KEY = "5201314"; 

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const { key } = req.query;

  if (key !== ADMIN_MASTER_KEY) {
    return res.status(403).json({ error: "管理员密码错误" });
  }

  // 返回卡密列表
  const list = Object.keys(PASSWORDS).map(code => ({
    code: code,
    country: PASSWORDS[code]
  }));

  res.status(200).json(list);
};

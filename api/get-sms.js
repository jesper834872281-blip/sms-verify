const API_KEY = process.env.SMS_API_KEY;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { order_id } = req.query;

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getStatus&id=${order_id}`;
    const response = await fetch(url);
    const rawText = await response.text();

    if (rawText.startsWith("STATUS_OK")) {
      const code = rawText.split(":")[1];
      return res.status(200).json({ status: "ok", code: code });
    } else {
      return res.status(200).json({ status: "waiting" });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

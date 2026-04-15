const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ status: "error", error: "Missing order_id" });
  }

  try {
    const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${API_KEY}&action=getStatus&id=${order_id}&_t=${Date.now()}`;
    
    const response = await fetch(url, { cache: "no-store" });
    const rawText = await response.text();

    if (rawText.startsWith("STATUS_OK")) {
      const code = rawText.split(":")[1];
      return res.status(200).json({ status: "ok", code: code });
    } else {
      return res.status(200).json({ status: "waiting", detail: rawText });
    }
  } catch (error) {
    return res.status(500).json({ status: "error", error: error.message });
  }
}

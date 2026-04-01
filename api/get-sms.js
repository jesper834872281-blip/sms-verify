const API_KEY = process.env.SMS_API_KEY;
const BASE_URL = "https://api.sms-activate.org/stubs/handler_api.php";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const order_id = req.query.order_id;

  try {
    const response = await fetch(
      `${BASE_URL}?api_key=${API_KEY}&action=getStatus&id=${order_id}`
    );
    const text = await response.text();

    if (text.startsWith("STATUS_OK")) {
      res.json({ status: "ok", code: text.split(":")[1].trim() });
    } else if (text === "STATUS_WAIT_CODE") {
      res.json({ status: "waiting" });
    } else {
      res.json({ status: "error", msg: text });
    }
  } catch (e) {
    res.status(500).json({ status: "error", msg: e.message });
  }
}

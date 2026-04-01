const API_KEY = process.env.SMS_API_KEY;
const BASE_URL = "https://api.sms-activate.org/stubs/handler_api.php";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const service = req.query.service || "go";
  const country = req.query.country || "6";

  try {
    const response = await fetch(
      `${BASE_URL}?api_key=${API_KEY}&action=getNumber&service=${service}&country=${country}`
    );
    const text = await response.text();
    const parts = text.split(":");

    if (parts[0] === "ACCESS_NUMBER") {
      res.json({ order_id: parts[1], phone: parts[2].trim() });
    } else {
      res.status(400).json({ error: text });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

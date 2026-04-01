const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const service = req.query.service || "google";
  const country = req.query.country || "china";

  try {
    const response = await fetch(
      `https://5sim.net/v1/user/buy/activation/${country}/any/${service}`,
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json"
        }
      }
    );
    const data = await response.json();
    if (data.id) {
      res.json({ order_id: String(data.id), phone: String(data.phone) });
    } else {
      res.status(400).json({ error: JSON.stringify(data) });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

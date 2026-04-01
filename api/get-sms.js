const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const order_id = req.query.order_id;

  try {
    const response = await fetch(
      `https://5sim.net/v1/user/check/${order_id}`,
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json"
        }
      }
    );
    const data = await response.json();

    if (data.sms && data.sms.length > 0) {
      res.json({ status: "ok", code: data.sms[0].code });
    } else {
      res.json({ status: "waiting" });
    }
  } catch (e) {
    res.status(500).json({ status: "error", msg: e.message });
  }
}

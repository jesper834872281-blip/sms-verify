const API_KEY = process.env.SMS_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { order_id } = req.body || {};

  try {
    await fetch(
      `https://5sim.net/v1/user/finish/${order_id}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json"
        }
      }
    );
  } catch(e) {}

  res.json({ status: "done" });
}

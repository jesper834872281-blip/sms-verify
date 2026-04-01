const API_KEY = process.env.SMS_API_KEY;
const BASE_URL = "https://api.sms-activate.org/stubs/handler_api.php";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { order_id } = req.body || {};

  await fetch(
    `${BASE_URL}?api_key=${API_KEY}&action=setStatus&status=6&id=${order_id}`
  );
  res.json({ status: "done" });
}

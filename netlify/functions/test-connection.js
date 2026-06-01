import Razorpay from "razorpay";
import { getDecryptedRazorpayConfig } from "./utils/db.js";

export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    let { keyId, keySecret } = JSON.parse(event.body || "{}");
    
    if (!keyId || !keySecret) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Credentials input fields cannot be empty." })
      };
    }

    // If keySecret has masked format, load actual secret configured on server
    if (/^•+$/.test(keySecret)) {
      const config = await getDecryptedRazorpayConfig();
      if (config.keyId === keyId) {
        keySecret = config.keySecret;
      } else {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Secret key belongs to a different Key ID." })
        };
      }
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    await razorpay.orders.all({ count: 1 });
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "ok" })
    };
  } catch (error) {
    console.error("Test connection verification failed:", error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: error.message || "Invalid Razorpay Key ID or Key Secret" })
    };
  }
};

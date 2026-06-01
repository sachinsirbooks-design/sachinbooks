import Razorpay from "razorpay";
import { getDecryptedRazorpayConfig, db, addDoc, collection } from "./utils/db.js";

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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { amount, currency, receipt } = JSON.parse(event.body || "{}");
    const config = await getDecryptedRazorpayConfig();

    if (!config.enabled) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Razorpay integration is currently disabled." })
      };
    }

    if (!config.keyId || !config.keySecret) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Razorpay keys are not fully configured in the admin dashboard." })
      };
    }

    const razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // convert INR to paise
      currency: currency || "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    try {
      if (db) {
        await addDoc(collection(db, "payment_logs"), {
          type: "order_created",
          orderId: receipt || null,
          razorpayOrderId: order.id,
          amount: amount,
          status: "pending",
          createdAt: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error("Error creating payment log:", logErr);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...order,
        keyId: config.keyId
      })
    };
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to create Razorpay order" })
    };
  }
};

import Razorpay from "razorpay";
import { getDecryptedRazorpayConfig, db, addDoc, collection, doc, updateDoc } from "./utils/db.js";

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
    const { paymentId, orderId, amount } = JSON.parse(event.body || "{}");
    if (!paymentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required razorpay payment id for refund." })
      };
    }

    const config = await getDecryptedRazorpayConfig();
    const razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    const refundOptions = {
      payment_id: paymentId,
    };
    if (amount) {
      refundOptions.amount = Math.round(amount * 100);
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    if (orderId && db) {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "cancelled",
        paymentStatus: "refunded",
        refundId: refund.id
      });
    }

    if (db) {
      await addDoc(collection(db, "paymentLogs"), {
        type: "refund_success",
        orderId: orderId || null,
        paymentId: paymentId,
        refundId: refund.id,
        amount: amount || null,
        createdAt: new Date().toISOString()
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, refund })
    };
  } catch (err) {
    console.error("Refund error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Failed to issue refund with Razorpay" })
    };
  }
};

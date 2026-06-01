import { db, addDoc, collection, doc, updateDoc } from "./utils/db.js";

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
    const { orderId, errorReason, razorpayOrderId, razorpayPaymentId } = JSON.parse(event.body || "{}");
    
    if (orderId && db) {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { paymentStatus: "failed" });
    }
    
    if (db) {
      await addDoc(collection(db, "failedPayments"), {
        orderId: orderId || null,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        errorReason: errorReason || "Payment modal dismissed or aborted",
        timestamp: new Date().toISOString()
      });
      
      await addDoc(collection(db, "paymentLogs"), {
        type: "payment_failed_popup",
        orderId: orderId || null,
        status: "failed",
        createdAt: new Date().toISOString()
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error("Record failed payment error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

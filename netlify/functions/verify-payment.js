import crypto from "crypto";
import { getDecryptedRazorpayConfig, db, addDoc, collection, doc, getDoc, updateDoc } from "./utils/db.js";

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = JSON.parse(event.body || "{}");

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required verification properties." })
      };
    }

    const config = await getDecryptedRazorpayConfig();

    if (!config.keySecret) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Payment verification keys are missing from settings." })
      };
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", config.keySecret)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    // Log Payment Verification Trace
    try {
      if (db) {
        await addDoc(collection(db, "paymentLogs"), {
          type: "payment_verification",
          orderId: orderId || null,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          status: isValid ? "success" : "failed",
          createdAt: new Date().toISOString()
        });
        await addDoc(collection(db, "payment_logs"), {
          type: "payment_verification",
          orderId: orderId || null,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          status: isValid ? "success" : "failed",
          createdAt: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error("Error creating verification payment log:", logErr);
    }

    if (isValid) {
      let orderData = null;
      if (orderId && db) {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          orderData = orderSnap.data();
        }

        await updateDoc(orderRef, {
          status: "processing",
          paymentId: razorpay_payment_id,
          paymentOrderId: razorpay_order_id,
          paymentStatus: "success"
        });

        // Save success database records
        await addDoc(collection(db, "payments"), {
          paymentId: razorpay_payment_id,
          orderId: orderId,
          amount: orderData?.total || 0,
          userEmail: orderData?.address?.fullName ? `${orderData.address.fullName} (${orderData.address?.phone || ""})` : "test@test.com",
          userId: orderData?.userId || null,
          timestamp: new Date().toISOString()
        });
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: "success" })
      };
    } else {
      if (orderId && db) {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          paymentStatus: "failed"
        });

        await addDoc(collection(db, "failedPayments"), {
          orderId: orderId,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          errorReason: "Signature verification failed",
          timestamp: new Date().toISOString()
        });
      }
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: "failure", error: "Authentication signature verification failed." })
      };
    }
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to verify payment" })
    };
  }
};

import crypto from "crypto";
import { getDecryptedRazorpayConfig, db, addDoc, collection, doc, getDoc, updateDoc, query, where, getDocs } from "./utils/db.js";

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
    const signature = event.headers["x-razorpay-signature"] || event.headers["X-Razorpay-Signature"];
    if (!signature) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing x-razorpay-signature header" }) };
    }

    const config = await getDecryptedRazorpayConfig();

    if (!config.webhookSecret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Webhook secret key is not configured in settings." }) };
    }

    // Verify authentic payload signature
    const rawPayload = event.body;
    const expectedSignature = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(rawPayload)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("Razorpay Webhook verification mismatch occurred.");
      if (db) {
        await addDoc(collection(db, "paymentLogs"), {
          type: "webhook_signature_failure",
          receivedSignature: signature,
          createdAt: new Date().toISOString()
        });
        await addDoc(collection(db, "payment_logs"), {
          type: "webhook_signature_failure",
          receivedSignature: signature,
          createdAt: new Date().toISOString()
        });
      }
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid Webhook Signature." }) };
    }

    const parsedEvent = JSON.parse(event.body || "{}");
    console.log(`Razorpay Webhook authenticated perfectly: event=${parsedEvent.event}`);

    // Log webhook action
    if (db) {
      await addDoc(collection(db, "paymentLogs"), {
        type: "webhook_received",
        event: parsedEvent.event,
        payload: {
          id: parsedEvent.payload?.payment?.entity?.id || null,
          order_id: parsedEvent.payload?.payment?.entity?.order_id || null,
          amount: parsedEvent.payload?.payment?.entity?.amount ? parsedEvent.payload.payment.entity.amount / 100 : null
        },
        createdAt: new Date().toISOString()
      });
      await addDoc(collection(db, "payment_logs"), {
        type: "webhook_received",
        event: parsedEvent.event,
        payload: {
          id: parsedEvent.payload?.payment?.entity?.id || null,
          order_id: parsedEvent.payload?.payment?.entity?.order_id || null,
          amount: parsedEvent.payload?.payment?.entity?.amount ? parsedEvent.payload.payment.entity.amount / 100 : null
        },
        createdAt: new Date().toISOString()
      });
    }

    if (parsedEvent.event === "payment.captured" || parsedEvent.event === "order.paid") {
      const paymentEntity = parsedEvent.payload?.payment?.entity || {};
      const rzpOrderId = paymentEntity.order_id;
      const rzpPaymentId = paymentEntity.id;
      const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0;
      const userEmail = paymentEntity.email || "webhook@test.com";

      let matchedOrderId = "";
      let matchedOrderData = null;

      if (rzpOrderId && db) {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("paymentOrderId", "==", rzpOrderId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          matchedOrderId = docSnap.id;
          matchedOrderData = docSnap.data();
        } else {
          const receipt = paymentEntity.receipt;
          if (receipt) {
            const orderDocRef = doc(db, "orders", receipt);
            const orderSnap = await getDoc(orderDocRef);
            if (orderSnap.exists()) {
              matchedOrderId = orderSnap.id;
              matchedOrderData = orderSnap.data();
            }
          }
        }
      }

      if (matchedOrderId && matchedOrderData && db) {
        if (matchedOrderData.paymentStatus !== "success") {
          const orderDocRef = doc(db, "orders", matchedOrderId);
          await updateDoc(orderDocRef, {
            status: "processing",
            paymentId: rzpPaymentId,
            paymentOrderId: rzpOrderId,
            paymentStatus: "success"
          });

          await addDoc(collection(db, "payments"), {
            paymentId: rzpPaymentId,
            orderId: matchedOrderId,
            amount: matchedOrderData.total || amount,
            userEmail: matchedOrderData.address?.fullName ? `${matchedOrderData.address.fullName} (${matchedOrderData.address?.phone || ""})` : userEmail,
            userId: matchedOrderData.userId || null,
            timestamp: new Date().toISOString()
          });

          await addDoc(collection(db, "paymentLogs"), {
            type: "webhook_order_paid",
            orderId: matchedOrderId,
            razorpayOrderId: rzpOrderId,
            razorpayPaymentId: rzpPaymentId,
            status: "success",
            createdAt: new Date().toISOString()
          });
          console.log(`Order ${matchedOrderId} successfully updated via Webhook.`);
        }
      }
    } else if (parsedEvent.event === "payment.failed" && db) {
      const paymentEntity = parsedEvent.payload?.payment?.entity || {};
      const rzpOrderId = paymentEntity.order_id;
      const rzpPaymentId = paymentEntity.id;
      const errorReason = paymentEntity.error_description || "Webhook payment failure event";

      let matchedOrderId = "";
      if (rzpOrderId) {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("paymentOrderId", "==", rzpOrderId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          matchedOrderId = snapshot.docs[0].id;
        }
      }

      if (matchedOrderId) {
        const orderDocRef = doc(db, "orders", matchedOrderId);
        await updateDoc(orderDocRef, { paymentStatus: "failed" });
      }

      await addDoc(collection(db, "failedPayments"), {
        orderId: matchedOrderId || null,
        razorpayOrderId: rzpOrderId || null,
        razorpayPaymentId: rzpPaymentId || null,
        errorReason,
        timestamp: new Date().toISOString()
      });

      await addDoc(collection(db, "paymentLogs"), {
        type: "webhook_payment_failed",
        orderId: matchedOrderId || null,
        razorpayOrderId: rzpOrderId || null,
        status: "failed",
        createdAt: new Date().toISOString()
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "ok" })
    };
  } catch (error) {
    console.error("Razorpay Webhook handler error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Webhook handling failed." })
    };
  }
};

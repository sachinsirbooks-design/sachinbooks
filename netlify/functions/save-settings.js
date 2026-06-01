import { db, doc, getDoc, encrypt } from "./utils/db.js";

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
    const { enabled, testMode, keyId, keySecret, webhookSecret } = JSON.parse(event.body || "{}");
    
    let currentRazorpay = {};
    if (db) {
      const docRef = doc(db, "settings", "site_settings");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const d = snapshot.data();
        currentRazorpay = d.razorpay || {};
      }
    }

    let encryptedKeySecret = "";
    if (keySecret && !/^•+$/.test(keySecret)) {
      encryptedKeySecret = encrypt(keySecret);
    } else if (currentRazorpay && currentRazorpay.encryptedKeySecret) {
      encryptedKeySecret = currentRazorpay.encryptedKeySecret;
    }

    let encryptedWebhookSecret = "";
    if (webhookSecret && !/^•+$/.test(webhookSecret)) {
      encryptedWebhookSecret = encrypt(webhookSecret);
    } else if (currentRazorpay && currentRazorpay.encryptedWebhookSecret) {
      encryptedWebhookSecret = currentRazorpay.encryptedWebhookSecret;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        encryptedKeySecret,
        encryptedWebhookSecret
      })
    };
  } catch (error) {
    console.error("Save settings error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to secure Razorpay settings" })
    };
  }
};

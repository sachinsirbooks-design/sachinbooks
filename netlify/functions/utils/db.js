import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import crypto from "crypto";

// Fallback to literal configuration derived from the local firebase-applet-config.json
const firebaseConfigEnv = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCWxu6wn0USdDt-hQr6ZWuUlS7aoadxjbU",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0637806090.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0637806090",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0637806090.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "980161271823",
  appId: process.env.FIREBASE_APP_ID || "1:980161271823:web:0ab76f633b1062bc29ab7a",
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "ai-studio-9469fb85-ed3b-4f44-8f63-f3f904a6b0d8"
};

let firebaseConfig = firebaseConfigEnv;
if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (e) {
    console.error("Failed to parse FIREBASE_CONFIG environment variable:", e);
  }
}

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");

// Cryptographic Encryption Helpers
const ENCRYPTION_KEY_RAW = process.env.RAZORPAY_ENCRYPTION_KEY || "sachinsir_razorpay_default_secure_key_129#";
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

export function encrypt(text) {
  try {
    if (!text) return "";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (err) {
    console.error("Encryption error:", err);
    return "";
  }
}

export function decrypt(text) {
  try {
    if (!text) return "";
    const parts = text.split(":");
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final()
    ]);
    return decryptedBuffer.toString("utf8");
  } catch (err) {
    console.error("Decryption error:", err);
    return text;
  }
}

export async function getDecryptedRazorpayConfig() {
  let dbConfig = {
    enabled: true,
    testMode: true,
    keyId: "",
    keySecret: "",
    webhookSecret: "",
  };

  try {
    if (db) {
      const docRef = doc(db, "settings", "site_settings");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const rzp = data?.razorpay || {};
        const decryptedSecret = decrypt(rzp.encryptedKeySecret || "");
        const decryptedWebhook = decrypt(rzp.encryptedWebhookSecret || "");
        dbConfig = {
          enabled: rzp.enabled !== undefined ? !!rzp.enabled : true,
          testMode: rzp.testMode !== undefined ? !!rzp.testMode : true,
          keyId: rzp.keyId || "",
          keySecret: decryptedSecret,
          webhookSecret: decryptedWebhook,
        };
      }
    }
  } catch (err) {
    console.error("Failed to read Firebase config in function, using env overrides:", err);
  }

  const envKeyId = process.env.RAZORPAY_KEY_ID;
  const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const envWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const envTestMode = process.env.RAZORPAY_TEST_MODE;

  if (envKeyId) {
    dbConfig.keyId = envKeyId;
    dbConfig.enabled = true;
    if (envKeyId.startsWith("rzp_live_")) {
      dbConfig.testMode = false;
    } else if (envKeyId.startsWith("rzp_test_")) {
      dbConfig.testMode = true;
    }
  }
  if (envKeySecret) {
    dbConfig.keySecret = envKeySecret;
  }
  if (envWebhookSecret) {
    dbConfig.webhookSecret = envWebhookSecret;
  }
  if (envTestMode !== undefined) {
    dbConfig.testMode = envTestMode === "true" || envTestMode === "1";
  }

  if (dbConfig.keyId && dbConfig.keyId.startsWith("rzp_live_")) {
    dbConfig.testMode = false;
  }

  return dbConfig;
}

export {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
};

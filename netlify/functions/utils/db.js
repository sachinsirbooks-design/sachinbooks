import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get standard ESM __dirname and __filename equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve firebase-applet-config.json path dynamically across fallback locations
let rawConfig = "";
const pathsToTry = [
  path.resolve(process.cwd(), "firebase-applet-config.json"),
  path.join(__dirname, "../../../firebase-applet-config.json"),
  path.join(__dirname, "../../firebase-applet-config.json"),
  path.join(__dirname, "firebase-applet-config.json"),
];

for (const p of pathsToTry) {
  try {
    if (fs.existsSync(p)) {
      rawConfig = fs.readFileSync(p, "utf-8");
      break;
    }
  } catch (e) {
    // Try the next path search path
  }
}

if (!rawConfig) {
  // Try directly searching process.env for standard firebase-applet-config items
  const firebaseConfigEnv = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "(default)"
  };

  if (firebaseConfigEnv.apiKey && firebaseConfigEnv.projectId) {
    rawConfig = JSON.stringify(firebaseConfigEnv);
  } else {
    // If not found in env, let's look for a generic firebase-applet-config inside of current directory or default placeholder
    console.error("CRITICAL: firebase-applet-config.json not found and no environment variables available.");
  }
}

const firebaseConfig = rawConfig ? JSON.parse(rawConfig) : null;
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const db = firebaseConfig ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId) : null;

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

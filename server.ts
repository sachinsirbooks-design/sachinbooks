import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import fs from "fs";

dotenv.config();

// Initialize Firebase
const rawConfig = fs.readFileSync("./firebase-applet-config.json", "utf-8");
const firebaseConfig = JSON.parse(rawConfig);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Cryptographic Encryption Helpers for secure configurations
const ENCRYPTION_KEY_RAW = process.env.RAZORPAY_ENCRYPTION_KEY || "sachinsir_razorpay_default_secure_key_129#";
const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY_RAW).digest();

function encrypt(text: string): string {
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

function decrypt(text: string): string {
  try {
    if (!text) return "";
    const parts = text.split(":");
    if (parts.length !== 2) return text; // fallback to plaintext if not encrypted
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

async function getDecryptedRazorpayConfig() {
  let dbConfig = {
    enabled: true,
    testMode: true,
    keyId: "",
    keySecret: "",
    webhookSecret: "",
  };

  try {
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
  } catch (err) {
    console.error("Failed to read Firebase config, falling back strictly to env variables:", err);
  }

  // Override or fallback to process.env keys (e.g. Vercel environment variables)
  const envKeyId = process.env.RAZORPAY_KEY_ID;
  const envKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const envWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const envTestMode = process.env.RAZORPAY_TEST_MODE;

  if (envKeyId) {
    dbConfig.keyId = envKeyId;
    dbConfig.enabled = true; // Force enabled if key exists in env
    
    // Auto-detect live mode vs test mode based on key prefix
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

  // Also catch direct DB-stored key detection (if database has rzp_live_ keys, make sure it honors live mode)
  if (dbConfig.keyId && dbConfig.keyId.startsWith("rzp_live_")) {
    dbConfig.testMode = false;
  }

  return dbConfig;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware that reads the raw body buffer for secure signature validations (e.g. webhooks)
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Direct mapping aliases for standard Razorpay checkout triggers
  app.post("/api/create-order", async (req, res, next) => {
    req.url = "/api/razorpay/create-order";
    next();
  });
  app.post("/api/verify-payment", async (req, res, next) => {
    req.url = "/api/razorpay/verify-payment";
    next();
  });
  app.post("/api/record-failed-payment", async (req, res, next) => {
    req.url = "/api/razorpay/record-failed-payment";
    next();
  });
  app.post("/api/refund", async (req, res, next) => {
    req.url = "/api/razorpay/refund";
    next();
  });
  app.post("/api/test-connection", async (req, res, next) => {
    req.url = "/api/razorpay/test-connection";
    next();
  });
  app.post("/api/save-settings", async (req, res, next) => {
    req.url = "/api/razorpay/save-settings";
    next();
  });

  // Create Razorpay Order
  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, currency, receipt } = req.body;
      
      const config = await getDecryptedRazorpayConfig();

      if (!config.enabled) {
        return res.status(400).json({ error: "Razorpay integration is currently disabled." });
      }

      if (!config.keyId || !config.keySecret) {
        return res.status(400).json({ error: "Razorpay keys are not fully configured in the admin dashboard." });
      }

      const razorpay = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });

      const options = {
        amount: Math.round(amount * 100), // convert rupees to paise
        currency: currency || "INR",
        receipt: receipt || `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      
      // Admin dashboard payment logs audit
      try {
        await addDoc(collection(db, "payment_logs"), {
          type: "order_created",
          orderId: receipt || null,
          razorpayOrderId: order.id,
          amount: amount,
          status: "pending",
          createdAt: new Date().toISOString()
        });
      } catch (logErr) {
        console.error("Error creating payment log:", logErr);
      }

      res.json({
        ...order,
        keyId: config.keyId
      });
    } catch (error: any) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: error.message || "Failed to create Razorpay order" });
    }
  });

  // Verify Payment Signature
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required verification properties." });
      }

      const config = await getDecryptedRazorpayConfig();

      if (!config.keySecret) {
        return res.status(500).json({ error: "Payment verification keys are missing from settings." });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", config.keySecret)
        .update(body.toString())
        .digest("hex");

      const isValid = expectedSignature === razorpay_signature;

      // Log Payment Verification Trace
      try {
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
      } catch (logErr) {
        console.error("Error creating verification payment log:", logErr);
      }

      if (isValid) {
        let orderData: any = null;
        if (orderId) {
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

          /*
          await addDoc(collection(db, "invoices"), {
            orderId: orderId,
            invoiceNo: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            amount: orderData?.total || 0,
            customerName: orderData?.address?.fullName || "Customer",
            createdAt: new Date().toISOString()
          });
          */
        }
        res.json({ status: "success" });
      } else {
        if (orderId) {
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
        res.status(400).json({ status: "failure", error: "Authentication signature verification failed." });
      }
    } catch (error: any) {
      console.error("Razorpay Verification Error:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });



  // Record Failed Payment (Popup dismissed or manual fail)
  app.post("/api/razorpay/record-failed-payment", async (req, res) => {
    try {
      const { orderId, errorReason, razorpayOrderId, razorpayPaymentId } = req.body;
      if (orderId) {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { paymentStatus: "failed" });
      }
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
      res.json({ success: true });
    } catch (error: any) {
      console.error("Record failed payment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Refund API
  app.post("/api/razorpay/refund", async (req, res) => {
    try {
      const { paymentId, orderId, amount } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "Missing required razorpay payment id for refund." });
      }

      const config = await getDecryptedRazorpayConfig();
      const razorpay = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });

      const refundOptions: any = {
        payment_id: paymentId,
      };
      if (amount) {
        refundOptions.amount = Math.round(amount * 100);
      }

      const refund = await razorpay.payments.refund(paymentId, refundOptions);

      if (orderId) {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          status: "cancelled",
          paymentStatus: "refunded",
          refundId: refund.id
        });
      }

      await addDoc(collection(db, "paymentLogs"), {
        type: "refund_success",
        orderId: orderId || null,
        paymentId: paymentId,
        refundId: refund.id,
        amount: amount || null,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, refund });
    } catch (err: any) {
      console.error("Refund error:", err);
      res.status(500).json({ error: err.message || "Failed to issue refund with Razorpay" });
    }
  });

  // Test API credentials connection
  app.post("/api/razorpay/test-connection", async (req, res) => {
    try {
      let { keyId, keySecret } = req.body;
      
      if (!keyId || !keySecret) {
        return res.status(400).json({ error: "Credentials input fields cannot be empty." });
      }

      // If keySecret has masked format, load actual secret configured on server
      if (/^•+$/.test(keySecret)) {
        const config = await getDecryptedRazorpayConfig();
        if (config.keyId === keyId) {
          keySecret = config.keySecret;
        } else {
          return res.status(400).json({ error: "Secret key belongs to a different Key ID." });
        }
      }

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      // Simple call to fetch orders with count 1 to check valid auth
      await razorpay.orders.all({ count: 1 });
      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Test connection verification failed:", error);
      res.status(401).json({ error: error.message || "Invalid Razorpay Key ID or Key Secret" });
    }
  });

  // Securely encrypt and save Razorpay Settings from administrator
  app.post("/api/razorpay/save-settings", async (req, res) => {
    try {
      const { enabled, testMode, keyId, keySecret, webhookSecret } = req.body;
      
      const docRef = doc(db, "settings", "site_settings");
      const snapshot = await getDoc(docRef);
      let currentRazorpay = {};
      if (snapshot.exists()) {
        const d = snapshot.data();
        currentRazorpay = d.razorpay || {};
      }

      let encryptedKeySecret = "";
      // Check keySecret block: if not the placeholder bullets, encrypt it!
      if (keySecret && !/^•+$/.test(keySecret)) {
        encryptedKeySecret = encrypt(keySecret);
      } else if (currentRazorpay && (currentRazorpay as any).encryptedKeySecret) {
        encryptedKeySecret = (currentRazorpay as any).encryptedKeySecret;
      }

      let encryptedWebhookSecret = "";
      // Check webhookSecret block: if not the placeholders, encrypt it!
      if (webhookSecret && !/^•+$/.test(webhookSecret)) {
        encryptedWebhookSecret = encrypt(webhookSecret);
      } else if (currentRazorpay && (currentRazorpay as any).encryptedWebhookSecret) {
        encryptedWebhookSecret = (currentRazorpay as any).encryptedWebhookSecret;
      }

      res.json({ 
        success: true, 
        encryptedKeySecret,
        encryptedWebhookSecret
      });
    } catch (error: any) {
      console.error("Save settings error:", error);
      res.status(500).json({ error: error.message || "Failed to secure Razorpay settings" });
    }
  });

  // Webhook Receiver with signature verification and auto status upgrades
  app.post("/api/razorpay/webhook", async (req: any, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      if (!signature) {
        return res.status(400).json({ error: "Missing x-razorpay-signature header" });
      }

      const config = await getDecryptedRazorpayConfig();

      if (!config.webhookSecret) {
        return res.status(500).json({ error: "Webhook secret key is not configured in settings." });
      }

      // Verify authentic payload signature
      const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", config.webhookSecret)
        .update(rawPayload)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.warn("Razorpay Webhook verification mismatch occurred.");
        // Log mismatch for audit security detection
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
        return res.status(400).json({ error: "Invalid Webhook Signature." });
      }

      const event = req.body;
      console.log(`Razorpay Webhook authenticated perfectly: event=${event.event}`);

      // Log webhook action
      await addDoc(collection(db, "paymentLogs"), {
        type: "webhook_received",
        event: event.event,
        payload: {
          id: event.payload?.payment?.entity?.id || null,
          order_id: event.payload?.payment?.entity?.order_id || null,
          amount: event.payload?.payment?.entity?.amount ? event.payload.payment.entity.amount / 100 : null
        },
        createdAt: new Date().toISOString()
      });
      await addDoc(collection(db, "payment_logs"), {
        type: "webhook_received",
        event: event.event,
        payload: {
          id: event.payload?.payment?.entity?.id || null,
          order_id: event.payload?.payment?.entity?.order_id || null,
          amount: event.payload?.payment?.entity?.amount ? event.payload.payment.entity.amount / 100 : null
        },
        createdAt: new Date().toISOString()
      });

      // Handle successful captures/payments
      if (event.event === "payment.captured" || event.event === "order.paid") {
        const paymentEntity = event.payload?.payment?.entity || {};
        const rzpOrderId = paymentEntity.order_id;
        const rzpPaymentId = paymentEntity.id;
        const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0;
        const userEmail = paymentEntity.email || "webhook@test.com";

        let matchedOrderId = "";
        let matchedOrderData: any = null;

        if (rzpOrderId) {
          // 1. Trace by Razorpay Order ID (paymentOrderId)
          const ordersRef = collection(db, "orders");
          const q = query(ordersRef, where("paymentOrderId", "==", rzpOrderId));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            matchedOrderId = docSnap.id;
            matchedOrderData = docSnap.data();
          } else {
            // 2. Trace by receipt ID (Firestore Order ID!)
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

        if (matchedOrderId && matchedOrderData) {
          if (matchedOrderData.paymentStatus !== "success") {
            const orderDocRef = doc(db, "orders", matchedOrderId);
            await updateDoc(orderDocRef, {
              status: "processing",
              paymentId: rzpPaymentId,
              paymentOrderId: rzpOrderId,
              paymentStatus: "success"
            });

            // Write Payments document
            await addDoc(collection(db, "payments"), {
              paymentId: rzpPaymentId,
              orderId: matchedOrderId,
              amount: matchedOrderData.total || amount,
              userEmail: matchedOrderData.address?.fullName ? `${matchedOrderData.address.fullName} (${matchedOrderData.address?.phone || ""})` : userEmail,
              userId: matchedOrderData.userId || null,
              timestamp: new Date().toISOString()
            });

            // Write Invoices document
            /*
            await addDoc(collection(db, "invoices"), {
              orderId: matchedOrderId,
              invoiceNo: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              amount: matchedOrderData.total || amount,
              customerName: matchedOrderData.address?.fullName || "Customer",
              createdAt: new Date().toISOString()
            });
            */

            // Save log in paymentLogs
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
      } 
      // Handle failed payments
      else if (event.event === "payment.failed") {
        const paymentEntity = event.payload?.payment?.entity || {};
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

      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Razorpay Webhook handler error:", error);
      res.status(500).json({ error: error.message || "Webhook handling failed." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// 1. SlipOK Validation
exports.verifySlipBackend = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).json({ success: false, message: "Method not allowed" });
        }

        const { logId, amount: expectedAmount } = req.body;
        if (!logId) {
            return res.status(400).json({ success: false, message: "Missing logId" });
        }

        // Production should use functions.config() or Secrets Manager, but hardcoding for now based on previous frontend logic
        const SLIPOK_BRANCH_ID = "21650";
        const SLIPOK_API_KEY = "sl-rWqjPz1I-b6e3f4bf-79e7-4089-9b98-500b3e51d9e2";

        try {
            const response = await axios.get(`https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}/${logId}`, {
                headers: {
                    'x-authorization': SLIPOK_API_KEY
                }
            });

            if (response.data && response.data.success) {
                const amount = response.data.data.amount;

                // Add security check here if amount is valid
                if (expectedAmount && amount < expectedAmount) {
                    return res.status(400).json({ success: false, message: `ยอดเงินไม่ถูกต้อง (ต้องการ ${expectedAmount} แต่โอนมา ${amount})` });
                }

                return res.status(200).json({ success: true, data: response.data.data });
            } else {
                return res.status(400).json({ success: false, message: "Slip validation failed" });
            }

        } catch (error) {
            console.error("Slip validation error:", error);
            return res.status(500).json({ success: false, message: "Error contacting SlipOK API" });
        }
    });
});

// 2. Brute-Force Login Attempt Tracker
exports.trackLoginAttempt = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).json({ success: false, message: "Method not allowed" });
        }

        const { email, success, checkOnly } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Missing email" });
        }

        try {
            // Document ID cannot contain slashes, but emails don't. Still, good to be safe.
            const safeEmail = email.toLowerCase().trim();
            const attemptRef = db.collection('loginAttempts').doc(safeEmail);
            const doc = await attemptRef.get();

            if (checkOnly) {
                if (doc.exists) {
                    const data = doc.data();
                    if (data.lockedUntil && data.lockedUntil.toDate() > new Date()) {
                        return res.status(403).json({ success: false, locked: true, lockedUntil: data.lockedUntil.toDate().toISOString() });
                    }
                }
                return res.status(200).json({ success: true, locked: false });
            }

            if (success) {
                // Reset on success
                await attemptRef.set({ attempts: 0, lastAttempt: admin.firestore.FieldValue.serverTimestamp(), lockedUntil: null });
                return res.status(200).json({ success: true, locked: false });
            } else {
                let attempts = 1;
                let lockedUntil = null;

                if (doc.exists) {
                    const data = doc.data();
                    // Check if already locked
                    if (data.lockedUntil && data.lockedUntil.toDate() > new Date()) {
                        return res.status(403).json({ success: false, locked: true, lockedUntil: data.lockedUntil.toDate().toISOString() });
                    }

                    attempts = (data.attempts || 0) + 1;
                    if (attempts >= 5) {
                        // Lock for 15 minutes
                        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                    }
                }

                await attemptRef.set({
                    attempts,
                    lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
                    lockedUntil: lockedUntil ? admin.firestore.Timestamp.fromDate(lockedUntil) : null
                });

                return res.status(200).json({
                    success: false,
                    attempts,
                    locked: !!lockedUntil,
                    lockedUntil: lockedUntil ? lockedUntil.toISOString() : null
                });
            }
        } catch (error) {
            console.error("Login attempt tracking error:", error);
            return res.status(500).json({ success: false, message: "Error tracking login" });
        }
    });
});

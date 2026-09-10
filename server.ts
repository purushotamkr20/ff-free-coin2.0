import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Tesseract from "tesseract.js";

// --- Types (Synced with App.tsx) ---
interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface UserData {
  mobile: string;
  password: string;
  gmail?: string;
  username?: string;
  coins: number;
  photo?: string;
  joinedAt: number;
  notifications: Notification[];
}

interface FinancialRequest {
  id: string;
  userMobile: string;
  username: string;
  amount: number;
  type: "deposit" | "withdraw";
  status: "pending" | "completed";
  timestamp: number;
  utr?: string;
}

interface JoinedUser {
  id: string;
  name: string;
  mobile: string;
  slot: number;
  status?: "win" | "loss" | "pending";
  prizeEarned?: number;
  kills?: number;
}

interface Match {
  id: string;
  title: string;
  prizePool: number;
  perKill: number;
  entryFee: number;
  maxPlayers: number;
  joinedPlayers: number;
  time: string;
  image: string;
  boxNumber?: string;
  joinedUserList: JoinedUser[];
}

interface Game {
  title: string;
  subtitle: string;
  image: string;
  boxNumber?: string;
  matches: Match[];
}

interface EarnLink {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  iconType: "telegram" | "youtube" | "instagram" | "whatsapp";
}

// --- Shared State (Server-Side) ---
// Note: In a production app, this would be a database like Firestore or Cloud SQL.
// Using memory for now to fulfill the requirement of shared state across users.
let users: UserData[] = [
  {
    mobile: "9693908559",
    password: "admin",
    gmail: "purushotamkumar0896@gmail.com",
    username: "SYSTEM_ROOT",
    coins: 0,
    joinedAt: Date.now() - 172800000,
    notifications: []
  }
];

let financialRequests: FinancialRequest[] = [];

let games: Game[] = [
  { title: "Aviator", subtitle: "", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "Mines", subtitle: "Mines Jackpot", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "LOSS/HEAL LW", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "CS/LW 1V1", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "CS/LW 2V2", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "ONLY HEAD 1V1", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "LOW MIX 2V2", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "GUN PRO ??", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "₹10 ONLY", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", matches: [] },
  { title: "FREE MATCH", subtitle: "Free Fire", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop", matches: [] },
];

let earnLinks: EarnLink[] = [
  { id: "1", name: "Join Telegram", subtitle: "Official Channel", url: "https://t.me/purushotamkumar201120", iconType: "telegram" },
  { id: "2", name: "Subscribe YouTube", subtitle: "GT Clash Official", url: "https://youtube.com/@ng_gaming20?si=0A7dD1PWvqM826Yo", iconType: "youtube" },
  { id: "3", name: "Follow Instagram", subtitle: "@gtclash_pro", url: "https://www.instagram.com/purushotam_kr_20?igsh=MWtqMHo1aXBua3UxYQ==", iconType: "instagram" },
  { id: "4", name: "Follow WhatsApp", subtitle: "Latest Updates", url: "https://whatsapp.com/channel/0029Vb8FPCh0AgWEhG9ESl3R", iconType: "whatsapp" },
];

let appSettings = {
  qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=purushotamkumar0896@paytm",
  upiId: "purushotamkumar0896@paytm"
};

const activeOtps = new Map<string, string>();

import fs from "fs";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc
} from "firebase/firestore";

const DB_PATH = path.join(process.cwd(), "database.json");

// Define operation types for the Firestore error structure
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error Exception: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Read and bootstrap Firebase configuration setup
let db: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "remixed-project-id") {
      const fbApp = initializeApp(firebaseConfig);
      db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);
      console.log("Firebase App & Firestore successfully initialized with DB ID:", firebaseConfig.firestoreDatabaseId);
    } else {
      console.warn("Firebase config is placeholder (remixed). Running in local-fallback mode.");
    }
  } else {
    console.warn("firebase-applet-config.json not found. Firestore features will run in local-fallback mode.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase SDK:", err);
}

// Direct saving helpers for Firestore mirroring
async function saveUserToFirestore(user: UserData) {
  if (!db) return;
  try {
    await setDoc(doc(db, "users", user.mobile), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.mobile}`);
  }
}

async function saveGameToFirestore(game: Game, gameId: string) {
  if (!db) return;
  try {
    await setDoc(doc(db, "games", gameId), { ...game, id: gameId });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `games/${gameId}`);
  }
}

async function deleteGameFromFirestore(gameId: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "games", gameId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `games/${gameId}`);
  }
}

async function saveFinancialRequestToFirestore(request: FinancialRequest) {
  if (!db) return;
  try {
    await setDoc(doc(db, "financialRequests", request.id), request);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `financialRequests/${request.id}`);
  }
}

async function saveSettingsToFirestore() {
  if (!db) return;
  try {
    await setDoc(doc(db, "settings", "appSettings"), appSettings);
    await setDoc(doc(db, "settings", "earnLinks"), { links: earnLinks });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `settings/configs`);
  }
}

// Primary async sync on bootstrap
async function initFirestoreAndLoad() {
  // 1. Initial load from local backup JSON if available
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      users = data.users || users;
      financialRequests = data.financialRequests || financialRequests;
      games = data.games || games;
      appSettings = data.appSettings || appSettings;
      earnLinks = data.earnLinks || earnLinks;
      console.log("Local database fallback loaded cleanly.");
    } catch (e) {
      console.error("Failed to parse local backup json:", e);
    }
  }

  if (!db) return;

  try {
    // 2. Query collections from Firestore. If Firestore has data, we sync memory to that instead.
    // Otherwise we auto-migrate local memory into empty Firestore fields.
    const usersSnap = await getDocs(collection(db, "users"));
    if (!usersSnap.empty) {
      const dbUsers: UserData[] = [];
      usersSnap.forEach(snap => {
        dbUsers.push(snap.data() as UserData);
      });
      users = dbUsers;
      console.log(`Synced ${users.length} users directly from Cloud Firestore.`);
    } else {
      console.log("Cloud users collection is empty. Populating with local master user...");
      for (const u of users) {
        await saveUserToFirestore(u);
      }
    }

    const gamesSnap = await getDocs(collection(db, "games"));
    if (!gamesSnap.empty) {
      const dbGames: Game[] = [];
      // Pull by key and sort or arrange appropriately
      gamesSnap.forEach(snap => {
        dbGames.push(snap.data() as Game);
      });
      games = dbGames;
      console.log(`Synced ${games.length} games directly from Cloud Firestore.`);
    } else {
      console.log("Cloud games collection is empty. Migrating local templates to Firestore...");
      for (let i = 0; i < games.length; i++) {
        await saveGameToFirestore(games[i], `game_${i}`);
      }
    }

    const finSnap = await getDocs(collection(db, "financialRequests"));
    if (!finSnap.empty) {
      const dbFin: FinancialRequest[] = [];
      finSnap.forEach(snap => {
        dbFin.push(snap.data() as FinancialRequest);
      });
      financialRequests = dbFin.sort((a, b) => b.timestamp - a.timestamp);
      console.log(`Synced ${financialRequests.length} financial transactions directly from Cloud Firestore.`);
    } else {
      console.log("Cloud financial transactions collection is empty. Mirroring local entries to Firestore...");
      for (const req of financialRequests) {
        await saveFinancialRequestToFirestore(req);
      }
    }

    const settingsDocSnap = await getDoc(doc(db, "settings", "appSettings"));
    if (settingsDocSnap.exists()) {
      appSettings = settingsDocSnap.data() as typeof appSettings;
      console.log("Synced appSettings directly from Cloud Firestore.");
    } else {
      await setDoc(doc(db, "settings", "appSettings"), appSettings);
    }

    const earnDocSnap = await getDoc(doc(db, "settings", "earnLinks"));
    if (earnDocSnap.exists()) {
      const eData = earnDocSnap.data();
      earnLinks = eData.links || earnLinks;
      console.log("Synced earnLinks directly from Cloud Firestore.");
    } else {
      await setDoc(doc(db, "settings", "earnLinks"), { links: earnLinks });
    }
    
    // Finalize first local backup snapshot
    fs.writeFileSync(DB_PATH, JSON.stringify({ users, financialRequests, games, appSettings, earnLinks }, null, 2));

  } catch (err) {
    console.error("Critical error performing Firestore data initialization and syncing:", err);
  }
}

// Save trigger that maintains Cloud Firestore & local JSON backup in perfect synchronicity
async function saveDb() {
  try {
    // Save to backup file synchronously
    fs.writeFileSync(DB_PATH, JSON.stringify({ users, financialRequests, games, appSettings, earnLinks }, null, 2));

    if (!db) return;

    // Push async updates to cloud Firestore
    await saveSettingsToFirestore();

    for (const u of users) {
      await saveUserToFirestore(u);
    }

    for (const req of financialRequests) {
      await saveFinancialRequestToFirestore(req);
    }

    const activeIds = new Set<string>();
    for (let i = 0; i < games.length; i++) {
      const gameId = `game_${i}`;
      activeIds.add(gameId);
      await saveGameToFirestore(games[i], gameId);
    }

    // Drop clean deleted matches/games documents from Cloud as well
    const gamesSnap = await getDocs(collection(db, "games"));
    gamesSnap.forEach(async docSnap => {
      if (!activeIds.has(docSnap.id)) {
        await deleteGameFromFirestore(docSnap.id);
      }
    });

  } catch (e) {
    console.error("Failed to commit synchronized database update to Firestore/Json:", e);
  }
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  // Perform dynamic initial database load and synchronization as a non-blocking background process
  initFirestoreAndLoad().catch((err) => {
    console.error("Non-blocking background Firestore sync failed:", err);
  });

  app.use(express.json({ limit: '10mb' }));

  // --- API Endpoints ---

  app.get("/api/data", (req, res) => {
    res.json({ users, financialRequests, games, appSettings, earnLinks });
  });

  app.post("/api/save-earn-link", (req, res) => {
    const { link, index } = req.body;
    if (index !== null && index !== undefined) {
      earnLinks[index] = link;
    } else {
      earnLinks.push({...link, id: Math.random().toString(36).substr(2, 9)});
    }
    saveDb();
    res.json({ success: true, earnLinks });
  });

  app.post("/api/delete-earn-link", (req, res) => {
    const { index } = req.body;
    earnLinks.splice(index, 1);
    saveDb();
    res.json({ success: true, earnLinks });
  });

  app.post("/api/update-settings", (req, res) => {
    const { qrCode, upiId } = req.body;
    if (qrCode) appSettings.qrCode = qrCode;
    if (upiId) appSettings.upiId = upiId;
    saveDb();
    res.json({ success: true, settings: appSettings });
  });

  app.post("/api/login", (req, res) => {
    const { mobile, password } = req.body;
    const user = users.find(u => u.mobile === mobile && u.password === password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { mobile, gmail, username, password } = req.body;
    if (users.find(u => u.mobile === mobile)) {
      return res.status(400).json({ success: false, message: "Mobile already exists" });
    }
    const newUser: UserData = {
      mobile,
      password,
      gmail,
      username,
      coins: 0,
      joinedAt: Date.now(),
      notifications: []
    };
    users.push(newUser);
    saveDb();
    res.json({ success: true, user: newUser });
  });

  app.post("/api/forgot-password/request-otp", (req, res) => {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: "Mobile number is required" });
    }
    const userExists = users.find(u => u.mobile === mobile);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User with this mobile number does not exist" });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    activeOtps.set(mobile, otp);
    
    console.log(`[Forgot Password] Generated OTP for ${mobile}: ${otp}`);
    res.json({ success: true, otp, message: "OTP generated successfully!" });
  });

  app.post("/api/forgot-password/reset", (req, res) => {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Mobile, OTP and new password are required" });
    }
    
    const cachedOtp = activeOtps.get(mobile);
    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }
    
    const userIndex = users.findIndex(u => u.mobile === mobile);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    users[userIndex].password = newPassword;
    activeOtps.delete(mobile);
    saveDb();
    
    res.json({ success: true, message: "Password updated successfully!" });
  });

  app.post("/api/save-game", (req, res) => {
    const { game, index } = req.body;
    if (index !== null && index !== undefined) {
      games[index] = { ...game, matches: games[index].matches || [] };
    } else {
      games.push({ ...game, matches: [] });
    }
    saveDb();
    res.json({ success: true, games });
  });

  app.post("/api/save-match", (req, res) => {
    const { match, gameIndex, matchIndex } = req.body;
    if (games[gameIndex]) {
      if (!games[gameIndex].matches) games[gameIndex].matches = [];
      if (matchIndex !== null && matchIndex !== undefined) {
        games[gameIndex].matches[matchIndex] = { 
          ...match, 
          joinedUserList: games[gameIndex].matches[matchIndex].joinedUserList || [] 
        };
      } else {
        games[gameIndex].matches.push({ 
          ...match, 
          id: Math.random().toString(36).substr(2, 9),
          joinedUserList: []
        });
      }
      saveDb();
      res.json({ success: true, games });
    } else {
      res.status(404).json({ success: false, message: "Game not found" });
    }
  });

  app.post("/api/join-match", (req, res) => {
    const { gameIndex, matchIndex, userId, userName, userMobile, slot } = req.body;
    const game = games[gameIndex];
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });
    
    const match = game.matches[matchIndex];
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    // Check if match is full
    if (match.joinedPlayers >= match.maxPlayers) {
      return res.status(400).json({ success: false, message: "This match is already FULL FILLED (20/20 reached)" });
    }

    // Check if slot already taken
    if (match.joinedUserList && match.joinedUserList.find(u => u.slot === slot)) {
      return res.status(400).json({ success: false, message: "Slot already taken" });
    }

    // Check if user already joined
    if (match.joinedUserList && match.joinedUserList.find(u => u.mobile === userMobile)) {
      return res.status(400).json({ success: false, message: "You have already joined this match" });
    }

    // Deduct coins from user
    const userIndex = users.findIndex(u => u.mobile === userMobile);
    if (userIndex === -1) return res.status(404).json({ success: false, message: "User not found" });
    
    if (users[userIndex].coins < match.entryFee) {
      return res.status(400).json({ success: false, message: "Insufficient coins" });
    }

    users[userIndex].coins -= match.entryFee;

    // Add to joined list
    if (!match.joinedUserList) match.joinedUserList = [];
    match.joinedUserList.push({ id: userId, name: userName, mobile: userMobile, slot });
    match.joinedPlayers = match.joinedUserList.length;

    saveDb();
    res.json({ success: true, games, user: users[userIndex] });
  });

  app.post("/api/delete-match", (req, res) => {
    const { gameIndex, matchIndex } = req.body;
    if (games[gameIndex] && games[gameIndex].matches) {
      games[gameIndex].matches.splice(matchIndex, 1);
      saveDb();
      res.json({ success: true, games });
    } else {
      res.status(404).json({ success: false, message: "Not found" });
    }
  });

  app.post("/api/delete-game", (req, res) => {
    const { index } = req.body;
    games.splice(index, 1);
    saveDb();
    res.json({ success: true, games });
  });

  app.post("/api/financial-request", (req, res) => {
    const { request } = req.body;
    financialRequests.unshift(request);
    
    // If it's a withdrawal, deduct coins immediately (just like in App.tsx)
    if (request.type === "withdraw") {
      const userIndex = users.findIndex(u => u.mobile === request.userMobile);
      if (userIndex !== -1) {
        users[userIndex].coins -= request.amount;
      }
    } else if (request.type === "deposit") {
      // Per user request: deposit adds coins to wallet immediately
      const userIndex = users.findIndex(u => u.mobile === request.userMobile);
      if (userIndex !== -1) {
        users[userIndex].coins += request.amount;
        
        // Notify user immediately
        const newNotif: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          message: `Your deposit of ₹${request.amount} with UTR ${request.utr} has been successful`,
          timestamp: Date.now(),
          read: false
        };
        users[userIndex].notifications.unshift(newNotif);
      }
    }
    
    saveDb();
    res.json({ success: true, financialRequests, users });
  });

  app.post("/api/verify-deposit-screenshot", async (req, res) => {
    const { userMobile, amount, screenshotBase64, clientTimestamp } = req.body;
    const requestedAmount = parseInt(amount);

    if (!userMobile || !requestedAmount || !screenshotBase64) {
      return res.status(400).json({ success: false, message: "Invalid deposit verification payload" });
    }

    const userIndex = users.findIndex(u => u.mobile === userMobile);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    let mimeType = "image/jpeg";
    let base64Data = screenshotBase64;
    if (screenshotBase64.startsWith("data:")) {
      const parts = screenshotBase64.split(";base64,");
      const header = parts[0];
      mimeType = header.replace("data:", "");
      base64Data = parts[1];
    }

    const now = new Date(clientTimestamp || Date.now());
    const currentTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const currentDateStr = now.toLocaleDateString('en-US');

    let verificationResult = {
      isValid: false,
      reason: "Deposit verification failed. Invalid or unreadable payment screenshot.",
      detectedAmount: 0,
      isWithin5Minutes: false,
      isAmountMatching: false
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyConfigured = apiKey && apiKey.trim() !== "" && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "undefined";

    let geminiAttempted = false;

    if (isKeyConfigured) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a strict automated payment verification AI for a mobile gaming app in India.
Analyze this payment receipt or UPI transaction screenshot (PhonePe, Google Pay, Paytm, BHIM, Cred, Bank App, etc.).

Current Server/Client Time: ${currentTimeStr}, Date: ${currentDateStr}
Expected Payment Amount: ₹${requestedAmount}

CRITICAL MANDATORY RULES:
1. Is this a genuine payment receipt/confirmation screenshot showing a SUCCESSFUL payment or transfer? (If it is a random photo, meme, avatar, document, blank image, or non-payment image, set isValid to false).
2. Look at the payment amount in the image. Does it EXACTLY equal ₹${requestedAmount}? (e.g. ₹${requestedAmount}, Rs ${requestedAmount}, ${requestedAmount}.00). If the amount differs or cannot be found, set isAmountMatching to false and isValid to false.
3. Check payment timestamp in the screenshot:
   - Calculate if payment was completed WITHIN THE LAST 5 MINUTES of current time (${currentTimeStr}).
   - If payment timestamp is older than 5 minutes (e.g. 5 minutes 1 sec ago, 6 minutes ago, hours ago, or yesterday), set isWithin5Minutes to false and isValid to false.
4. Set isValid: true ONLY IF ALL THREE ARE STICKLY SATISFIED:
   a) It is a genuine payment receipt screenshot.
   b) Paid amount matches ₹${requestedAmount}.
   c) Payment time is strictly within the last 5 minutes.

Respond ONLY with raw JSON format (no markdown codeblock markers):
{
  "isValid": boolean,
  "detectedAmount": number,
  "isWithin5Minutes": boolean,
  "isAmountMatching": boolean,
  "reason": "Clear explanation in English why payment was accepted or rejected"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: base64Data
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });

        const responseText = response.text || "";
        const cleanJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJsonStr);
        if (parsed && typeof parsed.isValid === 'boolean') {
          verificationResult = parsed;
          geminiAttempted = true;
        }
      } catch (err: any) {
        console.warn("Gemini API Verification Error/Fallback:", err?.message || err);
      }
    }

    // If Gemini was not configured or threw error, run Tesseract OCR engine
    if (!geminiAttempted) {
      try {
        const imgBuffer = Buffer.from(base64Data, 'base64');
        const ocrResult = await Tesseract.recognize(imgBuffer, 'eng');
        const rawOcrText = (ocrResult?.data?.text || "").toLowerCase();

        // 1. Check for payment receipt keywords
        const paymentKeywords = [
          "successful", "success", "paid", "sent", "completed", "transferred", 
          "payment successful", "credited", "debited", "upi ref", "transaction id", 
          "phonepe", "gpay", "google pay", "paytm", "bhim", "utr", "bank", "receipt", "transfer"
        ];
        const isPaymentReceipt = paymentKeywords.some(kw => rawOcrText.includes(kw));

        // 2. Check for requested amount in extracted text
        const amountRegex = new RegExp(`(?:₹|rs\\.?|inr|paid|sent|amount|\\b)${requestedAmount}(?:\\.00|\\b)`, 'i');
        const isAmountMatching = amountRegex.test(rawOcrText) || rawOcrText.includes(`${requestedAmount}`);

        if (!isPaymentReceipt) {
          verificationResult = {
            isValid: false,
            reason: "Invalid Screenshot: Photo does not appear to be a UPI or bank payment receipt.",
            detectedAmount: 0,
            isWithin5Minutes: false,
            isAmountMatching: false
          };
        } else if (!isAmountMatching) {
          verificationResult = {
            isValid: false,
            reason: `Amount Mismatch: Payment of ₹${requestedAmount} was not found in the uploaded screenshot.`,
            detectedAmount: 0,
            isWithin5Minutes: true,
            isAmountMatching: false
          };
        } else {
          // Check for time strings in OCR text to verify 5-minute window
          const timeMatches = rawOcrText.match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/g);
          let isWithin5 = true;
          if (timeMatches && timeMatches.length > 0) {
            const nowTime = new Date(clientTimestamp || Date.now());
            const currentTotalMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();
            
            for (const tMatch of timeMatches) {
              const cleanT = tMatch.replace(/\s+/g, '');
              const parts = cleanT.match(/(\d{1,2})[:.](\d{2})(am|pm)?/);
              if (parts) {
                let h = parseInt(parts[1]);
                const m = parseInt(parts[2]);
                const ampm = parts[3];
                if (ampm === 'pm' && h < 12) h += 12;
                if (ampm === 'am' && h === 12) h = 0;
                const matchTotalMinutes = h * 60 + m;
                const diff = Math.abs(currentTotalMinutes - matchTotalMinutes);
                const minDiff = Math.min(diff, 1440 - diff);
                if (minDiff > 5) {
                  isWithin5 = false;
                }
              }
            }
          }

          if (!isWithin5) {
            verificationResult = {
              isValid: false,
              reason: "Payment Expired: Payment time in the screenshot is older than 5 minutes.",
              detectedAmount: requestedAmount,
              isWithin5Minutes: false,
              isAmountMatching: true
            };
          } else {
            verificationResult = {
              isValid: true,
              reason: `Payment screenshot verified successfully! ₹${requestedAmount} added to wallet.`,
              detectedAmount: requestedAmount,
              isWithin5Minutes: true,
              isAmountMatching: true
            };
          }
        }
      } catch (ocrErr: any) {
        console.error("Tesseract OCR error:", ocrErr);
        verificationResult = {
          isValid: false,
          reason: "Unreadable Screenshot: Please upload a clear PhonePe, Google Pay, or Paytm receipt screenshot.",
          detectedAmount: 0,
          isWithin5Minutes: false,
          isAmountMatching: false
        };
      }
    }

    if (verificationResult.isValid) {
      users[userIndex].coins += requestedAmount;

      const reqId = Math.random().toString(36).substr(2, 9);
      const newRequest: FinancialRequest = {
        id: reqId,
        userMobile,
        username: users[userIndex].username || "Unknown",
        amount: requestedAmount,
        type: "deposit",
        status: "completed",
        timestamp: Date.now(),
        utr: `SCREENSHOT-VERIFIED-${reqId}`
      };

      financialRequests.unshift(newRequest);

      const newNotif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        message: `Deposit of ₹${requestedAmount} successfully verified and credited to your wallet!`,
        timestamp: Date.now(),
        read: false
      };
      users[userIndex].notifications.unshift(newNotif);

      saveDb();

      return res.json({
        success: true,
        user: users[userIndex],
        financialRequests,
        users,
        message: `₹${requestedAmount} verified and added to your wallet!`
      });
    } else {
      return res.status(400).json({
        success: false,
        message: verificationResult.reason || "Payment screenshot is older than 5 minutes or amount does not match."
      });
    }
  });

  app.post("/api/complete-request", (req, res) => {
    const { requestId } = req.body;
    const reqIndex = financialRequests.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      const fr = financialRequests[reqIndex];
      fr.status = "completed";
      
      // Notify user
      const userIndex = users.findIndex(u => u.mobile === fr.userMobile);
      if (userIndex !== -1) {
        const newNotif: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          message: `Your ${fr.type} of ₹${fr.amount} has been successful`,
          timestamp: Date.now(),
          read: false
        };
        users[userIndex].notifications.unshift(newNotif);
        
        // Coins are already added/deducted at the time of request creation as per previous requirements
        // No need to add/deduct again here.
      }
    }
    saveDb();
    res.json({ success: true, financialRequests, users });
  });

  app.post("/api/add-coins", (req, res) => {
    const { mobile, amount } = req.body;
    const userIndex = users.findIndex(u => u.mobile === mobile);
    if (userIndex !== -1) {
      users[userIndex].coins += parseInt(amount);
      saveDb();
      res.json({ success: true, users });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  });

  app.post("/api/update-profile", (req, res) => {
    const { mobile, username, photo, password } = req.body;
    const userIndex = users.findIndex(u => u.mobile === mobile);
    if (userIndex !== -1) {
      if (username) users[userIndex].username = username;
      if (photo) users[userIndex].photo = photo;
      if (password) users[userIndex].password = password;
      saveDb();
      res.json({ success: true, user: users[userIndex] });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  });

  app.post("/api/clear-notifications", (req, res) => {
    const { mobile } = req.body;
    const userIndex = users.findIndex(u => u.mobile === mobile);
    if (userIndex !== -1) {
      users[userIndex].notifications = users[userIndex].notifications.map(n => ({...n, read: true}));
      saveDb();
      res.json({ success: true, user: users[userIndex] });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  });

  app.post("/api/delete-user", (req, res) => {
    const { mobile } = req.body;
    const initialCount = users.length;
    users = users.filter(u => u.mobile !== mobile);
    if (users.length < initialCount) {
      saveDb();
      res.json({ success: true, users, message: "User account removed" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  });

  app.post("/api/resolve-participant", (req, res) => {
    const { gameIndex, matchIndex, participantMobile, status, kills, prizeEarned } = req.body;
    
    const game = games[gameIndex];
    if (!game) return res.status(404).json({ success: false, message: "Game not found" });
    
    const match = game.matches[matchIndex];
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    if (!match.joinedUserList) match.joinedUserList = [];
    const participant = match.joinedUserList.find(u => u.mobile === participantMobile);
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    const oldStatus = participant.status || "pending";
    const oldPrize = participant.prizeEarned || 0;

    // Update details
    participant.status = status; // "win" | "loss" | "pending"
    participant.kills = parseInt(kills) || 0;
    participant.prizeEarned = parseInt(prizeEarned) || 0;

    // Direct balance sync with user balance
    const userIndex = users.findIndex(u => u.mobile === participantMobile);
    if (userIndex !== -1) {
      const diff = participant.prizeEarned - oldPrize;
      users[userIndex].coins += diff;

      // Add a live real-time notification
      const outcomeMsg = status === "win" 
        ? `🏆 You WON the match "${match.title}"! Earned ₹${participant.prizeEarned} (Kills: ${participant.kills})` 
        : status === "loss"
        ? `⚔️ Match "${match.title}" finished. Earned ₹${participant.prizeEarned} (Kills: ${participant.kills})`
        : `⏳ Match "${match.title}" status changed back to Pending`;

      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        message: outcomeMsg,
        timestamp: Date.now(),
        read: false
      };
      
      if (!users[userIndex].notifications) users[userIndex].notifications = [];
      users[userIndex].notifications.unshift(newNotif);
    }

    saveDb();
    res.json({ success: true, games, users });
  });

  // --- PWA Asset Endpoints ---
  const fallbackPngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  app.get("/user-logo.png", (req, res) => {
    try {
      const dirPath = path.join(process.cwd(), "src", "assets", "images");
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const logoFile = files.find(f => f.includes("user_logo") && f.endsWith(".png")) ||
                         files.find(f => f.includes("sasuke") && f.endsWith(".png")) || 
                         files.find(f => f.startsWith("admin_logo") && f.endsWith(".png"));
        if (logoFile) {
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Cache-Control", "public, max-age=31536000");
          return res.sendFile(path.join(dirPath, logoFile));
        }
      }
      res.setHeader("Content-Type", "image/png");
      res.send(fallbackPngBuffer);
    } catch (e) {
      res.setHeader("Content-Type", "image/png");
      res.send(fallbackPngBuffer);
    }
  });

  app.get("/admin-logo.png", (req, res) => {
    try {
      const dirPath = path.join(process.cwd(), "src", "assets", "images");
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const logoFile = files.find(f => f.includes("sasuke") && f.endsWith(".png")) || 
                         files.find(f => f.startsWith("admin_logo") && f.endsWith(".png"));
        if (logoFile) {
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Cache-Control", "public, max-age=31536000");
          return res.sendFile(path.join(dirPath, logoFile));
        }
      }
      res.setHeader("Content-Type", "image/png");
      res.send(fallbackPngBuffer);
    } catch (e) {
      res.setHeader("Content-Type", "image/png");
      res.send(fallbackPngBuffer);
    }
  });

  // User App Manifest
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(JSON.stringify({
      name: "GT Clash",
      short_name: "GT Clash",
      description: "GT Clash - Supercharge your Tournaments & Secure Games!",
      start_url: "/",
      id: "/",
      display: "standalone",
      background_color: "#0a0a0c",
      theme_color: "#a855f7",
      orientation: "portrait",
      icons: [
        {
          src: "/user-logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/user-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/user-logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        },
        {
          src: "/user-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    }));
  });

  // Admin App Manifest
  app.get("/manifest-admin.json", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(JSON.stringify({
      name: "GT Clash Admin App",
      short_name: "GT Admin",
      description: "GT Clash Admin Management Control Center PWA",
      start_url: "/?admin=PURUSHOTAM_KR_20",
      id: "/?admin=PURUSHOTAM_KR_20",
      display: "standalone",
      background_color: "#0a0a0c",
      theme_color: "#cca43b",
      orientation: "portrait",
      icons: [
        {
          src: "/admin-logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/admin-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/admin-logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        },
        {
          src: "/admin-logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    }));
  });

  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(`
      const CACHE_NAME = 'gtclash-v20';
      const ASSETS_TO_CACHE = [
        '/',
        '/manifest.json',
        '/manifest-admin.json'
      ];

      self.addEventListener('install', (e) => {
        self.skipWaiting();
        e.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
              ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => {}))
            );
          })
        );
      });

      self.addEventListener('activate', (e) => {
        e.waitUntil(
          caches.keys().then((keys) => {
            return Promise.all(
              keys.map((key) => caches.delete(key))
            );
          }).then(() => self.clients.claim())
        );
      });

      self.addEventListener('fetch', (e) => {
        if (e.request.method !== 'GET') return;

        const url = new URL(e.request.url);
        if (url.pathname.startsWith('/api/') || !url.protocol.startsWith('http')) {
          return;
        }

        // Network-first for navigation requests to ensure published updates load immediately without 404s
        if (e.request.mode === 'navigate') {
          e.respondWith(
            fetch(e.request).catch(() => caches.match('/') || caches.match(e.request))
          );
          return;
        }

        e.respondWith(
          fetch(e.request).catch(() => caches.match(e.request))
        );
      });
    `);
  });

  // --- Vite & Production Setup ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const publicPath = path.join(process.cwd(), "public");
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        }
      }));
    }
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const distIndex = path.join(distPath, "index.html");
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.sendFile(path.join(process.cwd(), "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middleware/authMiddleware.js";
import { generateFormula, cleanData, getInsights } from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);

// har user ke liye 1 minute mein max 15 AI requests
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user._id),
    message: { message: "Too many AI requests, please wait a minute" },
  })
);

router.post("/formula", generateFormula);
router.post("/clean", cleanData);
router.post("/insights", getInsights);

export default router;
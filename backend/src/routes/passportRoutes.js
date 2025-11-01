// src/routes/passportRoutes.js
import express from "express";
import { mintSkillPassport } from "../services/blockchainService.js";
import { getUserProfile } from "../services/supabaseService.js";

const router = express.Router();

/**
 * POST /api/passport/mint
 * Body: { userId: string, metadata: { name, description, image } }
 */
router.post("/mint", async (req, res, next) => {
  try {
    const { userId, metadata } = req.body;
    if (!userId || !metadata)
      return res.status(400).json({ error: "userId and metadata required" });

    // get user's wallet address from profiles table (assume field wallet_address)
    const profile = await getUserProfile(userId);
    if (!profile || !profile.wallet_address)
      return res.status(400).json({ error: "User wallet not found" });

    // Mint NFT
    const result = await mintSkillPassport(profile.wallet_address, metadata);

    return res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

export default router;

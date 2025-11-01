// src/routes/userRoutes.js
import express from "express";
import { getUserProfile } from "../services/supabaseService.js";

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.params.id);
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;

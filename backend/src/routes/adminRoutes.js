// src/routes/adminRoutes.js
import express from "express";
import { supabaseAdmin } from "../services/supabaseService.js";

const router = express.Router();

router.get("/stats", async (req, res, next) => {
  try {
    // Example: count users and certificates
    const [{ count: userCount }, { count: certCount }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("certificates")
        .select("id", { count: "exact", head: true }),
    ]);

    res.json({ users: userCount, certificates: certCount });
  } catch (err) {
    next(err);
  }
});

export default router;

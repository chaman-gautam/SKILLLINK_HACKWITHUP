// src/routes/recruiterRoutes.js
import express from "express";
import { listStudents } from "../services/supabaseService.js";

const router = express.Router();

router.get("/students", async (req, res, next) => {
  try {
    const students = await listStudents(200);
    // Optionally join with certificates table via supabase service
    res.json({ students });
  } catch (err) {
    next(err);
  }
});

export default router;

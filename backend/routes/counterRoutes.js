import express from "express";
import protect from "../middleware/authMiddleware.js";
import { callNextCustomer, markDone } from "../controllers/counterController.js";

const router = express.Router();

router.get("/next", protect, callNextCustomer);
router.put("/:id/done", protect, markDone);

export default router;

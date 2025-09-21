import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  joinQueue,
  getQueueStatus,
  serveCustomer,
  getAllQueue,
} from "../controllers/queueController.js";

const router = express.Router();

// Customer routes
router.post("/join", protect, joinQueue);
router.get("/status", protect, getQueueStatus);

// Employee/Admin routes
router.get("/all", getAllQueue); // show full queue
router.post("/serve/:token", serveCustomer); // serve a customer

export default router;

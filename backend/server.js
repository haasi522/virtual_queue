import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// -------------------
// MONGODB CONNECTION
// -------------------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// -------------------
// MODELS
// -------------------

// User Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["customer", "employee", "admin"],
    default: "customer",
  },
  queueToken: Number, // 👈 Store token assigned
});
const User = mongoose.model("User", userSchema);

// Queue Model
const queueSchema = new mongoose.Schema(
  {
    token: Number,
    email: String,
    name: String,
    status: { type: String, enum: ["Pending", "Served"], default: "Pending" },
    servedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // employee
  },
  { timestamps: true }
);
const Queue = mongoose.model("Queue", queueSchema);

// -------------------
// ROUTES
// -------------------

// Test
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// -------------------
// AUTH
// -------------------

// Register
app.post("/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// -------------------
// QUEUE
// -------------------

// Take token
app.post("/queue/take-token", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user already has a token pending
    let queueItem = await Queue.findOne({ email, status: "Pending" });

    if (!queueItem) {
      // Assign next token
      const lastToken = await Queue.findOne().sort({ token: -1 });
      const nextToken = lastToken ? lastToken.token + 1 : 1;

      queueItem = await Queue.create({
        token: nextToken,
        email: user.email,
        name: user.name,
      });

      // Save token to user
      user.queueToken = nextToken;
      await user.save();
    }

    // Count customers ahead
    const customersAhead = await Queue.countDocuments({
      status: "Pending",
      token: { $lt: queueItem.token },
    });

    // Estimate waiting time (5 min per customer)
    const estWaitingTime = customersAhead * 5;

    res.json({
      name: queueItem.name,
      queueToken: queueItem.token,
      customersAhead,
      estWaitingTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to take token" });
  }
});

// Get full queue with pendingAhead & estimated time
app.get("/queue/all", async (req, res) => {
  try {
    const queue = await Queue.find().sort({ createdAt: 1 });

    const updatedQueue = queue.map((q) => {
      const pendingAhead = queue.filter(
        (item) => item.status === "Pending" && item.token < q.token
      ).length;
      const estimatedTime = pendingAhead * 5; // 5 min per customer
      return { ...q._doc, pendingAhead, estimatedTime };
    });

    res.json(updatedQueue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching queue" });
  }
});

// Serve token
app.post("/queue/serve/:token", async (req, res) => {
  const tokenNumber = req.params.token;
  try {
    const updated = await Queue.findOneAndUpdate(
      { token: tokenNumber },
      { status: "Served" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error serving token" });
  }
});

// -------------------
// ADMIN
// -------------------

// Get all employees with served count
app.get("/admin/employees", async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const employeesWithCount = await Promise.all(
      employees.map(async (emp) => {
        const servedToday = await Queue.countDocuments({
          servedBy: emp._id,
          status: "Served",
          createdAt: { $gte: today, $lt: tomorrow },
        });
        return { ...emp._doc, servedToday };
      })
    );

    res.json(employeesWithCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching employees" });
  }
});

// Remove employee
app.delete("/admin/employees/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting employee" });
  }
});

// Queue analytics
app.get("/admin/analytics", async (req, res) => {
  try {
    const totalCustomers = await Queue.countDocuments();
    const served = await Queue.countDocuments({ status: "Served" });
    const pending = await Queue.countDocuments({ status: "Pending" });
    const avgServiceTime = 5;
    const estTimeRemaining = pending * avgServiceTime;

    // daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dailyStats = await Queue.aggregate([
      {
        $match: { createdAt: { $gte: today, $lt: tomorrow } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          served: { $sum: { $cond: [{ $eq: ["$status", "Served"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalCustomers,
      served,
      pending,
      avgServiceTime,
      estTimeRemaining,
      dailyStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// Get today's customers
app.get("/admin/customers/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const customers = await Queue.find({
      createdAt: { $gte: today, $lt: tomorrow },
    }).select("email token status");

    res.json({ customers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching today's customers" });
  }
});

// -------------------
// START SERVER
// -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

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
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["customer", "employee", "admin"], default: "customer" },
  queueToken: Number,
});
const User = mongoose.model("User", userSchema);

const queueSchema = new mongoose.Schema(
  {
    token: Number,
    email: String,
    name: String,
    status: { type: String, enum: ["Pending", "Served"], default: "Pending" },
    servedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Queue = mongoose.model("Queue", queueSchema);

// -------------------
// ROUTES
// -------------------
app.get("/", (req, res) => res.send("Backend running 🚀"));

// -------------------
// AUTH
// -------------------

// Register
app.post("/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    if (!password || password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login with role check
app.post("/auth/login", async (req, res) => {
  const { email, password, role } = req.body; // role sent from frontend dropdown
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.role !== role) return res.status(400).json({ message: `User is not a ${role}` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// -------------------
// QUEUE
// -------------------

// Take token – ensures token is generated only once per pending customer
app.post("/queue/take-token", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "customer") return res.status(400).json({ message: "Only customers can take tokens" });

    // Delete previous day's queue automatically
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    await Queue.deleteMany({ createdAt: { $lt: startOfToday } });

    // Check if customer already has a pending token
    let queueItem = await Queue.findOne({ email, status: "Pending" });

    if (!queueItem) {
      const todayQueueCount = await Queue.countDocuments({ createdAt: { $gte: startOfToday } });
      const nextToken = todayQueueCount + 1;

      queueItem = await Queue.create({
        token: nextToken,
        email: user.email,
        name: user.name,
      });

      user.queueToken = nextToken;
      await user.save();
    }

    const customersAhead = await Queue.countDocuments({
      status: "Pending",
      token: { $lt: queueItem.token },
    });

    const estWaitingTime = customersAhead * 5; // 5 minutes per customer

    res.json({
      name: queueItem.name,
      queueToken: queueItem.token,
      customersAhead,
      estWaitingTime,
    });
  } catch (err) {
    console.error("Take token error:", err);
    res.status(500).json({ message: "Failed to take token" });
  }
});

// Get all queue items
app.get("/queue/all", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Only fetch today's queue
    const queue = await Queue.find({ createdAt: { $gte: startOfToday } }).sort({ createdAt: 1 });

    const updatedQueue = queue.map((q, index) => {
      const pendingAhead = queue.filter(
        (item) => item.status === "Pending" && item.createdAt < q.createdAt
      ).length;
      const estimatedTime = pendingAhead * 5;
      return { ...q._doc, token: index + 1, pendingAhead, estimatedTime }; // daily-reset token
    });

    res.json(updatedQueue);
  } catch (err) {
    console.error("Fetch queue error:", err);
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
    console.error("Serve token error:", err);
    res.status(500).json({ message: "Error serving token" });
  }
});

// -------------------
// ADMIN
// -------------------
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
    console.error("Fetch employees error:", err);
    res.status(500).json({ message: "Error fetching employees" });
  }
});

app.delete("/admin/employees/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee removed" });
  } catch (err) {
    console.error("Delete employee error:", err);
    res.status(500).json({ message: "Error deleting employee" });
  }
});

app.get("/admin/analytics", async (req, res) => {
  try {
    const totalCustomers = await Queue.countDocuments();
    const served = await Queue.countDocuments({ status: "Served" });
    const pending = await Queue.countDocuments({ status: "Pending" });
    const avgServiceTime = 5;
    const estTimeRemaining = pending * avgServiceTime;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dailyStats = await Queue.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          served: { $sum: { $cond: [{ $eq: ["$status", "Served"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ totalCustomers, served, pending, avgServiceTime, estTimeRemaining, dailyStats });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

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
    console.error("Customers today error:", err);
    res.status(500).json({ message: "Error fetching today's customers" });
  }
});

// -------------------
// START SERVER
// -------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

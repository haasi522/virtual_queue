import Queue from "../models/Queue.js";

let tokenCounter = 1;

export const joinQueue = async (req, res) => {
  try {
    const queue = await Queue.create({
      customer: req.user._id,
      tokenNumber: tokenCounter++
    });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: "Error joining queue", error: err.message });
  }
};

export const getQueueStatus = async (req, res) => {
  try {
    const queue = await Queue.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: "Error fetching queue", error: err.message });
  }
};

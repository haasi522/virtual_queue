import Queue from "../models/Queue.js";

export const callNextCustomer = async (req, res) => {
  try {
    const next = await Queue.findOne({ status: "waiting" }).sort({ createdAt: 1 });
    if (!next) return res.json({ message: "No customers in queue" });

    next.status = "serving";
    next.counter = req.user._id;
    await next.save();

    res.json(next);
  } catch (err) {
    res.status(500).json({ message: "Error fetching next customer", error: err.message });
  }
};

export const markDone = async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);
    queue.status = "done";
    await queue.save();
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: "Error updating queue", error: err.message });
  }
};

import Spreadsheet from "../models/Spreadsheet.js";
import User from "../models/User.js";

// Helper: kya ye user owner ya collaborator hai?
const hasAccess = (sheet, userId) =>
  sheet.owner.equals(userId) ||
  sheet.collaborators.some((c) => c.equals(userId));

// POST /api/spreadsheets
export const createSpreadsheet = async (req, res) => {
  try {
    const sheet = await Spreadsheet.create({
      title: req.body.title,
      owner: req.user._id,
    });
    res.status(201).json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/spreadsheets
export const getSpreadsheets = async (req, res) => {
  try {
    const sheets = await Spreadsheet.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .select("-cells")
      .sort({ updatedAt: -1 });
    res.json(sheets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/spreadsheets/:id
export const getSpreadsheetById = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: "Spreadsheet not found" });
    }
    if (!hasAccess(sheet, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    await sheet.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators", select: "name email" },
    ]);
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/spreadsheets/:id
export const updateSpreadsheet = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: "Spreadsheet not found" });
    }
    if (!hasAccess(sheet, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    sheet.title = req.body.title || sheet.title;
    await sheet.save();
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/spreadsheets/:id
export const deleteSpreadsheet = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: "Spreadsheet not found" });
    }
    if (!sheet.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Only owner can delete" });
    }
    await sheet.deleteOne();
    res.json({ message: "Spreadsheet deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/spreadsheets/:id/collaborators
export const addCollaborator = async (req, res) => {
  try {
    const sheet = await Spreadsheet.findById(req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: "Spreadsheet not found" });
    }
    if (!sheet.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Only owner can add collaborators" });
    }

    const userToAdd = await User.findOne({ email: req.body.email });
    if (!userToAdd) {
      return res.status(404).json({ message: "No user with this email" });
    }
    if (sheet.owner.equals(userToAdd._id)) {
      return res.status(400).json({ message: "Owner is already part of the sheet" });
    }

    sheet.collaborators.addToSet(userToAdd._id);
    await sheet.save();
    res.json({ message: "Collaborator added", collaborators: sheet.collaborators });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
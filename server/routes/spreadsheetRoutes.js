import express from "express";
import {
  createSpreadsheet,
  getSpreadsheets,
  getSpreadsheetById,
  updateSpreadsheet,
  deleteSpreadsheet,
  addCollaborator,
} from "../controllers/spreadsheetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createSpreadsheet).get(getSpreadsheets);
router.route("/:id").get(getSpreadsheetById).put(updateSpreadsheet).delete(deleteSpreadsheet);
router.post("/:id/collaborators", addCollaborator);

export default router;
import mongoose from "mongoose";

const spreadsheetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "Untitled Spreadsheet",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    cells: {
      type: Map,
      of: String,
      default: {},
    },
    rows: { type: Number, default: 50 },
    cols: { type: Number, default: 26 },
  },
  { timestamps: true , toJSON: { flattenMaps: true }}
);

const Spreadsheet = mongoose.model("Spreadsheet", spreadsheetSchema);

export default Spreadsheet;
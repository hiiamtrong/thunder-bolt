import mongoose from 'mongoose';
const { Schema } = mongoose;
const ListSchema = Schema(
  {
    idList: {
      type: String,
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model('List', ListSchema);

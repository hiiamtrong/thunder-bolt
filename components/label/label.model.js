import mongoose from 'mongoose'
const { Schema } = mongoose
const LabelSchema = Schema(
  {
    idLabel: {
      type: String,
      required: true,
      unique: true,
    },
    name: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model('Label', LabelSchema)

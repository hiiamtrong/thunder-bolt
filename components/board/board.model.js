import mongoose from 'mongoose'
const { Schema } = mongoose
const BoardSchema = Schema(
  {
    idBoard: {
      type: String,
      required: true,
      unique: true,
    },
    code: { type: String, required: true },
    defaultList: {
      type: Schema.Types.ObjectId,
      ref: 'List'
    }
  },
  { timestamps: true }
)
BoardSchema.index({ cardId: 1 }, { unique: true })

export default mongoose.model('Board', BoardSchema)

import mongoose from 'mongoose'
const { Schema } = mongoose
const CardSchema = Schema(
  {
    cardId: {
      type: String,
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    threadTs: { type: String, required: true },
    url: { type: String },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
    },
    description: String,
    done: Date,
  },
  { timestamps: true }
)
CardSchema.index({ cardId: 1 }, { unique: true })

export default mongoose.model('Card', CardSchema)

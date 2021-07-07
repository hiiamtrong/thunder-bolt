import mongoose from 'mongoose'
const { Schema } = mongoose
const UserSchema = Schema(
  {
    displayName: { type: String, required: true },
    idSlack: { type: String, required: true },
    idTrello: { type: String, required: true },
  },
  { timestamps: true }
)

export default mongoose.model('User', UserSchema)

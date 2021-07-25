import mongoose from 'mongoose';
const { Schema } = mongoose;
const UserSchema = Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true },
    idSlack: { type: String },
    idTrello: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model('User', UserSchema);

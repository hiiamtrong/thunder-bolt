import mongoose from 'mongoose';
const { Schema } = mongoose;
const WebhookSchema = Schema(
  {
    idWebhook: { type: String, uniq: true, required: true },
    type: {
      type: String,
      enum: ['trello', 'gitlab', 'slack'],
      default: 'trello',
    },
    description: { type: String, required: true },
    idModel: { type: String, required: true },
    callbackURL: { type: String, required: true },
    active: Boolean,
    consecutiveFailures: Boolean,
    firstConsecutiveFailDate: Date,
  },
  { timestamps: true },
);

export default mongoose.model('Webhook', WebhookSchema);

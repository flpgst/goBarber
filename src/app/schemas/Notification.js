import Mongoose from 'mongoose'

const NotificationsSchema = new Mongoose.Schema(
  {
    content: {
      type: String,
      required: true
    },
    user: {
      type: Number,
      required: true
    },
    read: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true
  }
)

export default Mongoose.model('Notifications', NotificationsSchema)

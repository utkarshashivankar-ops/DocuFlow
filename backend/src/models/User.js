const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // role-based access control
    preferences: {
      inAppNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      expiryWarningDays: { type: Number, default: 30, min: 1, max: 365 },
      reminderDays: { type: [Number], default: [90, 30, 7, 1] },
    },
    pushToken: { type: String, default: null },
    resetCodeHash: { type: String, select: false },
    resetCodeExpires: { type: Date, select: false },
    resetCodeAttempts: { type: Number, default: 0, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 12);
userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetCodeHash;
    delete ret.resetCodeExpires;
    delete ret.resetCodeAttempts;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

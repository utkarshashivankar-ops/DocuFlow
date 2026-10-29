const asyncHandler = require('../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, pushToken, preferences } = req.body;
  const user = req.user;
  if (name !== undefined) user.name = name;
  if (pushToken !== undefined) user.pushToken = pushToken;
  if (preferences) {
    Object.entries(preferences).forEach(([k, v]) => {
      if (v !== undefined) user.set(`preferences.${k}`, v);
    });
  }
  await user.save();
  res.json({ success: true, user });
});

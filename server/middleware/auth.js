const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Read token from httpOnly cookie
  const token = req.cookies?.token;

  if (!token)
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    return res.status(401).json({ message: 'Invalid session.' });
  }
};
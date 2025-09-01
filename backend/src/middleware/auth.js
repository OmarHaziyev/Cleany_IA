import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  // Get the token from the Authorization header
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to the request object
    req.user = decoded;  // This will include the user id, role, etc.
    next();  // Proceed to the next middleware/route handler
  } catch (err) {
    console.error('JWT verification failed', err);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const roleProtect = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden, insufficient permissions' });
    }
    next();  // Proceed if the role matches
  };
};

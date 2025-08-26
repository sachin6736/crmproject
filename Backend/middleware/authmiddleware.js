import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ;

export const protect = async (req, res, next) => {
    const token = req.cookies.token;
    console.log('Cookies received:', req.cookies); // Log all cookies
    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ message: 'Access denied' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('Decoded user:', req.user);
      next();
    } catch (error) {
      console.log('Token verification error:', error);
      return res.status(403).json({ message: 'Invalid token', error });
    }
  };
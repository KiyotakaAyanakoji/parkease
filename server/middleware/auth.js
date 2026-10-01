export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Unauthorized: No active session' });
  }
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: 'Unauthorized: No active session' });
    }
    
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    
    next();
  };
};

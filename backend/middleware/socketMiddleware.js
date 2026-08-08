const jwt = require("jsonwebtoken");

const socketMiddleware = (socket, next) => {
  try {
    // Extract token from auth handshake or headers
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(" ");
      if (parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    // Verify token using JWT secret
    jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret", (err, decoded) => {
      if (err) {
        return next(new Error("Authentication failed: Invalid token"));
      }

      // Store user details in the socket object
      socket.userId = decoded.userId || decoded.id;
      next();
    });
  } catch (error) {
    next(new Error("Authentication error in socket middleware"));
  }
};

module.exports = socketMiddleware;

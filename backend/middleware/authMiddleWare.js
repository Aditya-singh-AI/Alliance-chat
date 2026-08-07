const jwt = require("jsonwebtoken")
const response = require("../utils/responseHandler");



const authMiddleware = async (req,res,next) => {
    // Accept token from cookie OR Authorization: Bearer <token> header
    const token = req.cookies.authToken || 
                  (req.headers.authorization?.startsWith('Bearer ') 
                    ? req.headers.authorization.split(' ')[1] 
                    : null);

    if(!token){
        return response(res, 401, 'Unauthorized');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error(error);
        return response(res, 401, 'Invalid Or Expired token');
    }
}

module.exports = authMiddleware;
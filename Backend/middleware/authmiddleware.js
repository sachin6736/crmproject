import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ;

export const protect = async(req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message :"Access denied"})
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log("req.user",req.user)
        next();
    } catch (error) {
        return res.status(403).json({message: "invalid token",error})
    }
}
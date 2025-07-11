import jwt from "jsonwebtoken";

export default (req, res, next) => {
  try {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = decoded;
    next();
  } catch (_) {
    res.status(401).end();
  }
};

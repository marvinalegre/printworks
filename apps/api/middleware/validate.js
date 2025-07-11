export default (schema) => (req, res, next) => {
  try {
    req.validatedData = schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).end();
  }
};

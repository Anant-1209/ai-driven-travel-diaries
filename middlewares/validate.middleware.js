export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const errorMessages = err.errors.map((e) => e.message).join('. ');
    return res.status(400).json({
      success: false,
      message: errorMessages || 'Invalid input data',
    });
  }
};

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const issues = err.issues || err.errors || [];
    const errorMessages =
      issues.length > 0
        ? issues.map((e) => e.message).join('. ')
        : err.message || 'Invalid input data';

    return res.status(400).json({
      success: false,
      message: errorMessages,
    });
  }
};

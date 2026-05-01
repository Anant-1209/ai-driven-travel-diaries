export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const message = err.errors 
      ? err.errors.map((e) => e.message).join(', ') 
      : (err.message || 'Validation failed');
      
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

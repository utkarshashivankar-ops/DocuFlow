const ApiError = require('../utils/ApiError');

// validate(schema, 'body'|'query'|'params') - replaces the property with the parsed (trimmed/coerced) value
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = {};
    result.error.issues.forEach((i) => {
      const key = i.path.join('.') || 'value';
      if (!details[key]) details[key] = i.message;
    });
    const first = Object.values(details)[0];
    return next(new ApiError(400, first || 'Invalid input.', 'VALIDATION_ERROR', details));
  }
  req[source] = result.data;
  return next();
};

module.exports = validate;

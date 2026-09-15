/**
 * Validates and coerces req.body / req.query / req.params against zod schemas.
 * Parsed values replace the originals so controllers only see clean data.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key] ?? {});
    }
    next();
  } catch (err) {
    next(err);
  }
};

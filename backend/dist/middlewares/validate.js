"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Replace original request values with validated/coerced ones
            req.body = parsed.body;
            req.query = parsed.query;
            req.params = parsed.params;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;

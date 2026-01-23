import { validationErrorResponse } from '../utils/response.util.js';

/**
 * Middleware de validation générique utilisant Joi
 * @param {Object} schema - Schéma de validation Joi
 * @param {String} property - Propriété à valider (body, query, params)
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retourner toutes les erreurs
      stripUnknown: true // Supprimer les champs non définis dans le schéma
    });

    if (error) {
      // Formater les erreurs de validation
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));

      return validationErrorResponse(res, errors);
    }

    // Remplacer req[property] par les valeurs validées et nettoyées
    // Pour query params, on doit utiliser Object.assign au lieu d'assignation directe
    if (property === 'query') {
      Object.keys(req.query).forEach(key => delete req.query[key]);
      Object.assign(req.query, value);
    } else {
      req[property] = value;
    }

    next();
  };
};

/**
 * Middleware pour valider plusieurs propriétés à la fois
 * @param {Object} schemas - Object contenant les schémas pour body, query, params
 * Exemple: { body: bodySchema, query: querySchema }
 */
export const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const allErrors = [];

    // Valider chaque propriété
    Object.entries(schemas).forEach(([property, schema]) => {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: `${property}.${detail.path.join('.')}`,
          message: detail.message.replace(/"/g, '')
        }));
        allErrors.push(...errors);
      } else {
        // Pour query params, on doit utiliser Object.assign au lieu d'assignation directe
        if (property === 'query') {
          Object.keys(req.query).forEach(key => delete req.query[key]);
          Object.assign(req.query, value);
        } else {
          req[property] = value;
        }
      }
    });

    if (allErrors.length > 0) {
      return validationErrorResponse(res, allErrors);
    }

    next();
  };
};

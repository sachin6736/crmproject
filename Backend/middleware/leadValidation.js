import { body } from 'express-validator';

export const validateLead = [
  body('clientName').notEmpty().withMessage('Client name is required'),
  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('zip')
    .notEmpty().withMessage('Zip code is required')
    .isPostalCode('any').withMessage('Invalid zip code'),
  body('partRequested').notEmpty().withMessage('Part requested is required'),
  body('make').notEmpty().withMessage('Make is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid year'),
  body('trim').notEmpty().withMessage('Trim is required'),
];

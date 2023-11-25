"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserValidation = exports.setBannedValidation = exports.deleteUserValidation = exports.createUserValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Used for user registration, creation, & authentication.
 */
exports.createUserValidation = [
    (0, express_validator_1.check)('email').isEmail().withMessage('Invalid user email'),
    (0, express_validator_1.check)('password').notEmpty().withMessage('Password is required'),
];
/**
 * Used for user deletion
 */
exports.deleteUserValidation = [
    (0, express_validator_1.check)('email').isEmail().withMessage("Invalid user email"),
];
/**
 * Used for banning user validation
 */
exports.setBannedValidation = [
    (0, express_validator_1.check)('email').isEmail().withMessage("Invalid user email"),
    (0, express_validator_1.check)('isBanned').isBoolean().withMessage("Invalid ban status"),
];
/**
 * Used for user update
 */
exports.updateUserValidation = [
    (0, express_validator_1.check)('newPassword').notEmpty().withMessage('New password is required'),
    (0, express_validator_1.check)('email').isEmail().withMessage("Invalid user email"),
];

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = void 0;
const Response_1 = __importDefault(require("./Response"));
const sequelize_1 = require("sequelize");
/**
 * @param e generated error.
 * @returns a proper response for the error.
 */
function handleError(e) {
    if (e instanceof sequelize_1.ValidationError) {
        return {
            err: e,
            response: Response_1.default.INVALID_IN
        };
    }
    else if (e instanceof sequelize_1.ExclusionConstraintError) {
        return {
            err: e,
            response: Response_1.default.NOT_EXIST
        };
    }
    else if (e instanceof sequelize_1.ForeignKeyConstraintError) {
        return {
            err: e,
            response: Response_1.default.INVALID_IN
        };
    }
    else if (e instanceof sequelize_1.UnknownConstraintError) {
        return {
            err: e,
            response: Response_1.default.INVALID_IN
        };
    }
    else if (e instanceof sequelize_1.UniqueConstraintError) {
        return {
            err: e,
            response: Response_1.default.ALREADY_EXISTS
        };
    }
    else {
        console.error(e);
        return {
            err: e,
            response: Response_1.default.INTERNAL
        };
    }
}
exports.handleError = handleError;

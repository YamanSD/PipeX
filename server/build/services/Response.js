"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum class for the types of service responses.
 *
 * >- SUCCESS: operation successful.
 * >- INVALID_IN: invalid input.
 * >- ALREADY_EXISTS: entity already exists.
 * >- INTERNAL: internal error.
 * >- NOT_EXIST: entity does not exist.
 */
var Response;
(function (Response) {
    Response["SUCCESS"] = "SUCCESS";
    Response["INVALID_IN"] = "INVALID INPUT";
    Response["ALREADY_EXISTS"] = "ALREADY EXISTS";
    Response["INTERNAL"] = "INTERNAL SERVER ERROR";
    Response["NOT_EXIST"] = "DOES NOT EXIST";
})(Response || (Response = {}));
exports.default = Response;

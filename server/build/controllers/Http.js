"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum class for the response codes.
 * Provides additional context for consistency and maintenance.
 */
var Http;
(function (Http) {
    Http[Http["OK"] = 200] = "OK";
    Http[Http["BAD"] = 400] = "BAD";
    Http[Http["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    Http[Http["NOT_FOUND"] = 404] = "NOT_FOUND";
    Http[Http["TIMEOUT"] = 408] = "TIMEOUT";
    Http[Http["ALREADY_EXISTS"] = 409] = "ALREADY_EXISTS";
    Http[Http["GONE"] = 410] = "GONE";
    Http[Http["INTERNAL"] = 500] = "INTERNAL";
    Http[Http["INSUFFICENT_RESOURCES"] = 507] = "INSUFFICENT_RESOURCES";
})(Http || (Http = {}));
exports.default = Http;

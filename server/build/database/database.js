"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDatabase = void 0;
const sequelize_1 = require("sequelize");
require("dotenv/config");
const config_1 = __importDefault(require("./config"));
/**
 * Checks the database if it exists.
 */
function syncDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        /*
         * Remove database name from config, to prevent it from being
         * used by the sequelize instance and causing errors.
         * The job of this connection is to create the database if it does
         * not exist.
         * */
        const _a = Object.assign({}, config_1.default), { database } = _a, noDbConfig = __rest(_a, ["database"]);
        /* sequelize instance to communicate create the database */
        const sequelize = new sequelize_1.Sequelize(noDbConfig);
        /* Open connection with server */
        yield sequelize.authenticate();
        /* create table encase it does not exist */
        yield sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
        /* Close connection */
        yield sequelize.close();
    });
}
exports.syncDatabase = syncDatabase;
exports.default = new sequelize_1.Sequelize(config_1.default);

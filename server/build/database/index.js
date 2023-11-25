"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDatabase = exports.database = void 0;
var database_1 = require("./database");
Object.defineProperty(exports, "database", { enumerable: true, get: function () { return __importDefault(database_1).default; } });
var database_2 = require("./database");
Object.defineProperty(exports, "syncDatabase", { enumerable: true, get: function () { return database_2.syncDatabase; } });

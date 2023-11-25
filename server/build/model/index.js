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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendee = exports.Chat = exports.Session = exports.User = void 0;
const database_1 = require("../database");
/* check all model tables */
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.syncDatabase)();
    yield database_1.database.sync();
}))();
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return __importDefault(User_1).default; } });
var Session_1 = require("./Session");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return __importDefault(Session_1).default; } });
var Chat_1 = require("./Chat");
Object.defineProperty(exports, "Chat", { enumerable: true, get: function () { return __importDefault(Chat_1).default; } });
var SessionAttendee_1 = require("./SessionAttendee");
Object.defineProperty(exports, "Attendee", { enumerable: true, get: function () { return __importDefault(SessionAttendee_1).default; } });

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("../controllers");
const express_1 = __importDefault(require("express"));
/* router instance for the SessionController */
const sessionRouter = express_1.default.Router();
sessionRouter.post('/sessionInfo', controllers_1.SessionController.getSession);
sessionRouter.post('/userSessions', controllers_1.SessionController.getUserSessions);
exports.default = sessionRouter;

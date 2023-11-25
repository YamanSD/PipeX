"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("../controllers");
const validations_1 = require("../validations");
/* router instance for the StatisticController */
const userRouter = express_1.default.Router();
/* parent path for admin API calls */
const adminPath = '/admin';
userRouter.post('/authenticate', validations_1.UserValidator.createUserValidation, controllers_1.UserController.authenticate);
userRouter.post(`${adminPath}/allUsers`, controllers_1.UserController.getAllUsers);
userRouter.post('/userData', controllers_1.UserController.getUser);
userRouter.post('/register', validations_1.UserValidator.createUserValidation, (req, res) => controllers_1.UserController.register(req, res, false));
userRouter.post(`${adminPath}/createUser`, validations_1.UserValidator.createUserValidation, controllers_1.UserController.createUser);
userRouter.delete(`${adminPath}/deleteUser`, validations_1.UserValidator.deleteUserValidation, controllers_1.UserController.deleteUser);
userRouter.post(`${adminPath}/setUserBanStatus`, validations_1.UserValidator.setBannedValidation, controllers_1.UserController.setBanUser);
userRouter.post(`/updateUser`, validations_1.UserValidator.updateUserValidation, controllers_1.UserController.updateUser);
exports.default = userRouter;

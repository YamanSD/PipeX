import {SessionController} from '../controllers';
import express from "express";

/* router instance for the SessionController */
const sessionRouter = express.Router();

sessionRouter.post('/sessionInfo', SessionController.getSession);
sessionRouter.post('/userSessions', SessionController.getUserSessions);

export default sessionRouter;


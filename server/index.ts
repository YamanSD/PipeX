import express from "express";
import cors from "cors";
import {Server} from 'socket.io';
import {createServer} from "https";
import bodyParser from "body-parser";
import {SessionRouter, UserRouter} from "./routes";
import {SessionController} from "./controllers";
import {SocketEvent} from "./sockets";
import 'dotenv';
import {TokenValidator} from "./validations";
import {PeerServer} from "peer";
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './swaggerConfig.json';
import * as fs from "fs";


/* application port */
const port = Number(process.env.APP_PORT);

/* main parent URI for the API calls */
const apiParent = '/api';

/* SSL params */
const privateKey = fs.readFileSync(`${__dirname}/../cert.key`).toString();
const certificate = fs.readFileSync(`${__dirname}/../cert.crt`).toString();

/* express API instance */
const app = express();

/* create an HTTP server */
const server = createServer({
    key: privateKey,
    cert: certificate
}, app);

/* create a PeerJS server instance */
PeerServer({
    port: Number(process.env.PEER_PORT),
    ssl: {
        key: privateKey,
        cert: certificate
    }
});

/*
 * listens for incoming connection event.
 * https://socket.io/docs/v4/ for further documentation.
 */
const io = new Server(server, {
    connectionStateRecovery: {},
});

/*
 * sets up middleware to parse URL-encoded data in HTTP requests.
 * The bodyParser middleware is used to parse the request body
 * when data is sent in the form of x-www-form-urlencoded.
 * The {extended: true} option indicates that the query string values can be of any data type
 */
app.use(bodyParser.urlencoded({extended: true}));

/*
 * sets up middleware to parse JSON data in HTTP requests.
 * The bodyParser middleware is used to parse the request
 * body when data is sent in JSON format.
 * It will convert the JSON data into a JavaScript object
 */
app.use(bodyParser.json());

/*
 * sets up middleware for handling Cross-Origin Resource Sharing (CORS).
 *  CORS is a security feature that controls which origins
 * (i.e., websites or domains) are allowed to access resources on
 * your server.
 * In this line, you're configuring CORS to allow requests from any origin
 */
app.use(cors({
    origin: '*',
}));

/* map routes */
app.use(`${apiParent}/users`, UserRouter);
app.use(`${apiParent}/sessions`, SessionRouter);

/* token validator middleware */
io.use(TokenValidator);

/* on user connection listener */
io.on(SocketEvent.CONNECT, (socket) => {
    SessionController.attachListeners(io, socket);

    /* for debugging only */
    socket.onAny((...args: any[]) => {
        console.log("\n<<<\n", args, "\n:>>>");
    });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/* for testing purposes */
server.listen(port, () => {
    console.log(`Listening on https://localhost:${port}/`);
});

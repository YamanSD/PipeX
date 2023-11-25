"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = require("./routes");
const controllers_1 = require("./controllers");
const sockets_1 = require("./sockets");
require("dotenv");
const validations_1 = require("./validations");
/* application port */
const port = Number(process.env.APP_PORT);
/* main parent URI for the API calls */
const apiParent = '/api';
/* express API instance */
const app = (0, express_1.default)();
/* create an HTTP server */
const server = (0, http_1.createServer)(app);
/* Redirect to https */
// app.get('*', (req, res, next) => {
//     if (req.headers['x-forwarded-proto'] !== 'https' && process.env.APP_DEV) {
//         return res.redirect(['https://', req.get('Host'), req.url].join(''));
//     }
//     next();
// });
/*
 * listens for incoming connection event.
 * https://socket.io/docs/v4/ for further documentation.
 */
const io = new socket_io_1.Server(server, {
    connectionStateRecovery: {}
});
/*
 * sets up middleware to parse URL-encoded data in HTTP requests.
 * The bodyParser middleware is used to parse the request body
 * when data is sent in the form of x-www-form-urlencoded.
 * The {extended: true} option indicates that the query string values can be of any data type
 */
app.use(body_parser_1.default.urlencoded({ extended: true }));
/*
 * sets up middleware to parse JSON data in HTTP requests.
 * The bodyParser middleware is used to parse the request
 * body when data is sent in JSON format.
 * It will convert the JSON data into a JavaScript object
 */
app.use(body_parser_1.default.json());
/*
 * sets up middleware for handling Cross-Origin Resource Sharing (CORS).
 *  CORS is a security feature that controls which origins
 * (i.e., websites or domains) are allowed to access resources on
 * your server.
 * In this line, you're configuring CORS to allow requests from any origin
 */
app.use((0, cors_1.default)({
    origin: '*',
}));
/* map routes */
app.use(`${apiParent}/users`, routes_1.UserRouter);
app.use(`${apiParent}/sessions`, routes_1.SessionRouter);
/* token validator middleware */
io.use(validations_1.TokenValidator);
/* on user connection listener */
io.on(sockets_1.SocketEvent.CONNECT, (socket) => {
    controllers_1.SessionController.attachListeners(io, socket);
    /* for debugging only */
    socket.onAny((...args) => {
        console.log("\n<<<\n", args, "\n:>>>");
    });
});
/* for testing purposes */
server.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});

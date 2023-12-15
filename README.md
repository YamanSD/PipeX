# PipeX

PipeX is an online conferencing web application, based on a mesh WebRTC architecture.

## Table of Contents

- [Technologies Used](#technologies-used)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Socket Endpoints](#socket-endpoints)
- [Setup](#setup)
- [License](#license)

## Technologies Used

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

- **Node.js**: The server-side runtime environment.
- **React**: To build the web UI for the users.
- **Socket.io**: To facilitate the communication.
- **Express.js**: Web application framework for Node.js.
- **MySQL**: SQL database for storing user execution statistics.
- **Sequelize**: ORM for the MySQL database.
- **JWT**: To provide secure transmission of information.
- **BCrypt**: To store user data securely in the database.
- **Typescript**: To provide early error detection, while writing the code.

## Database Schema

PipeX utilizes MySQL to store user info, chat logs, & session information. Below is a representation of the database schema:

![schema](./screenshots/schema.png)

## API Endpoints

PipeX exposes the following API endpoints for interaction:

- Note that the absence of a response implies the return of a HTTP response code only.

- `/`
  - **Method**: GET
  - **Description**: Used to check connection to server. 

- `/api/users/authenticate`
  - **Method**: POST
  - **Description**: Authenticates the user, returns a token if successful.
  - **Parameters**: 
    - `email`: User email.
    - `password`: User password.
  - **Response**:
    - `token`: JWT token valid for 24h.  

- `/api/users/admin/allUsers`
  - **Method**: POST
  - **Description**: Returns a list of all users in the database.
  - **Parameters**:
    - `Authorization header`: having the a valid admin token.  
  - **Response**:
    - `users`: List of all user emails.  

- `/api/users/userData`
  - **Method**: POST
  - **Description**: Returns user data and statistics.
  - **Parameters**:
    - `Authorization header`: having the a valid user token.  
  - **Response**:
    - `user`: user data.
    - `statistics`: user statistics.  

- `/api/users/register`
  - **Method**: POST
  - **Description**: Creates a new user, returns a token if successful.
  - **Parameters**: 
    - `email`: User email.
    - `password`: User password.
  - **Response**:
    - `token`: JWT token valid for 24h.  

- `/api/users/admin/createUser`
  - **Method**: POST
  - **Description**: Creates a new user. User can be an admin.
  - **Parameters**:
    - `Authorization header`: having the a valid admin token.
    - `email`: user email.
    - `password`: user password.
    - `isAdmin`: true the new user is an admin.
  - **Response**:
    - `token`: JWT token valid for 24h.

- `/api/users/admin/deleteUser`
  - **Method**: DELETE
  - **Description**: Deletes a user, along with its statistics.
  - **Parameters**:
    - `Authorization header`: having the a valid admin token.
    - `email`: email of user to delete.
   
- `/api/users/admin/setUserBanStatus`
  - **Method**: POST
  - **Description**: Bans/unbans a user.
  - **Parameters**:
    - `Authorization header`: having the a valid admin token.
    - `email`: email of user to ban/unban.
    - `isBanned`: true bans user, false unbannes user if banned.
   
- `/api/users/updateUser`
  - **Method**: POST
  - **Description**: Updates the user.
  - **Parameters**:
    - `Authorization header`: having the user token.
    - `newEmail`: new email of the user, optional.
    - `newPassword`: new password of the user, optional.
   
- `/api/sessions/sessionInfo`
  - **Method**: POST
  - **Description**: Returns the session information.
  - **Parameters**:
    - `Authorization header`: having the user token.
    - `sessionToken`: ID of the session, or a valid session token.
  - **Response**:
    - `session`: Infomration about the session.
    - `chat`: Session chat log.
    - `attendees`: Users that attended the session.

 - `/api/sessions/sessionInfo`
  - **Method**: POST
  - **Description**: Returns list of session IDs belonging to the user.
  - **Parameters**:
    - `Authorization header`: having the user token.
  - **Response**:
    - `sessionIds`: List of integers, each representing a session ID.

## Socket Endpoints

These socket events are used to perform the signaling and events.
In addition to the resulting data (if available), the callback function takes a HTTP response code and a potential error reason. 
Therefore, a callback function has the following form:
```
type callback = ({
  response: Integer representing a HTTP response code.
  result?: Potential result.
  err?: Potential error.
}) => any;
```
A callback function is called after the emit process either fails or succeeds.
For detailed usage, check [RoomHandle](./server/sockets/RoomHandle.ts) & [SessionController](./server/controllers/SessionController.ts).
The events are:

- `create`:
  - **Description**: Emitted by the user when they want to create a session. Upon success, a session token is returned.
 
- `join`:
  - **Description**: Emitted by a user when they want to join a session. Upon success, a list of users and their media status are returned, along with the session creator, & the type of the session.
  
- `terminate`:
  - **Description**: Emitted by the session creator when they want to terminate the session. Upon success, session is terminated and all users leave the session. 

- `leave`:
  - **Description**: Emitted by a user when they want to leave the session, to inform other users of them leavning. 

- `mute`: 
  - **Description**: Emitted by a user when they want to mute/unmute. 

- `hide`:
  - **Description**: Emitted by a user when they want to hide/show their camera.

- `message`:
  - **Description**: Emitted by a user when they want to send a message to another user, or to their group.

- `send_signal`:
  - **Description**: Emitted by Simple-Peer when a signal a user joins a Conference.

- `return_signal`:
  - **Description**: Emitted by Simple-Peer when a signal from another user is received. 

## Setup

1. Clone the repository: `git clone https://github.com/YamanSD/PipeX.git`
2. Run server: `cd server` -> `npm install` -> `npm start`.
3. Set up the MySQL connection in the [.env](./.env) configuration file. **ALL** parameters must be filled.
4. Start the React application: `cd client`-> `yarn install` -> `yarn start`

## License

This project is licensed under the [MIT License](LICENSE).

"use strict";
// import app from '../../index';
// import {describe, expect, it, jest} from "@jest/globals";
// import {Http} from "../../controllers";
// import request from 'supertest';
// import 'dotenv/config';
//
// /* mocks out setTimeout and other timer functions with mock functions */
// jest.useFakeTimers();
//
// describe("basic checks", () => {
//     it(
//         "check test success",
//         () => {
//             expect(true).toEqual(true);
//         }
//     );
//
//     it(
//         "check listener",
//     async () => {
//             const response = await request(app).get('/');
//
//             /* check response code */
//             expect(response.statusCode).toEqual(Http.OK);
//
//             /* check response content-type */
//             expect(response.headers["content-type"]).toContain("application/json");
//
//             /* check body content */
//             expect(response.body).toEqual({
//                 test_n: 1,
//                 test_s: "TESTER"
//             });
//         }
//     );
//
//     it(
//       "check invalid path",
//       async () => {
//             const response = await request(app).get("/not_exist");
//
//             /* check response code */
//             expect(response.statusCode).toEqual(Http.NOT_FOUND);
//       }
//     );
// });
//
// describe("/users", () => {
//     it(
//         "/register",
//         async () => {
//             const response = await request(app)
//                 .post('/users/register')
//                 .send({
//                     email: process.env.MOCK_USER as string,
//                     password: process.env.MOCK_PASS as string
//                 });
//
//         }
//     );
// });

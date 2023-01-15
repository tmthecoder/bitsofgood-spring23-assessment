import app from "../api/endpoints"
import request from 'supertest'

describe("POST - /api/user", () => {
    test("Create with no body", async () => {
        const result = await request(app).post("/api/user").send({});
        expect(result.statusCode).toEqual(400)
    })

    test("Create with malformed body", async () => {
        const result = await request(app).post("/api/user").send({
            "firstName": "Tejas",
            "lastName": "Mehta",
            "email": "malformed email",
            "password": "some-password",
        });
        expect(result.statusCode).toEqual(400)
    })
    
    test("Create with correct body", async () => {
        const result = await request(app).post("/api/user").send({
            "firstName": "Tejas",
            "lastName": "Mehta",
            "email": "tejas@tmthecoder.dev",
            "password": "some-password",
        });
        expect(result.statusCode).toEqual(200)
    })

})

describe("POST - /api/user/login", () => {
    test("Login with incorrect credentials", async () => {
        const result = await request(app).post('/api/user/login').send({
            "email": "tejas@tmthecoder.dev",
            "password": "some-incorrect-password"
        })
        expect(result.statusCode).toEqual(403)
    })

    test("Login with previous credentials", async () => {
        const result = await request(app).post('/api/user/login').send({
            "email": "tejas@tmthecoder.dev",
            "password": "some-password"
        })
        expect(result.statusCode).toEqual(200)
    })
})

describe("POST - /api/user/verify", () => {
    test("Verify with incorrect credentials", async () => {
        const result = await request(app).post('/api/user/verify').send({
            "email": "tejas@tmthecoder.dev",
            "password": "some-incorrect-password"
        })
        expect(result.statusCode).toEqual(403)
    })

    test("Verify with previous credentials", async () => {
        const result = await request(app).post('/api/user/verify').send({
            "email": "tejas@tmthecoder.dev",
            "password": "some-password"
        })
        expect(result.statusCode).toEqual(200)
        expect(result.body["token"]).toBeDefined()
    })
})

describe("GET - /api/admin/users", () => {
    let token: string | undefined;
    const userArray: any[] = [];
    // Setup a bunch of users
    beforeAll(async () => {
        for(let i = 0; i < 50; i++) {
            userArray.push(
                {
                    "firstName": `Tejas ${i}`,
                    "lastName": "Mehta",
                    "email": `tejas${i}@tmthecoder.dev`,
                    "password": "some-password",
                }
            );
        }
        for(let i = 0; i < 50; i++) {
            await request(app).post("/api/user").send(userArray[i]);
        }
        // Get a token
        const result = await request(app).post('/api/user/verify').send({
            "email": "tejas1@tmthecoder.dev",
            "password": "some-password"
        })
        token = result.body["token"];
    })
    let lastId: string | undefined;
    test("Check if api returns 1st 10 users", async () => {
        const page = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`).send()
        expect(page.statusCode).toEqual(200)
        for(let i = 0; i <= 8; i++) {
            expect(page.body['data'][i+1]['email']).toEqual(userArray[i]['email'])
        }
        lastId = page.body['lastId'];
    })
    test("Check the next page to test pagination", async () => {
        const page = await request(app).get(`/api/admin/users?lastId=${lastId}`).set('Authorization', `Bearer ${token}`).send()
        expect(page.statusCode).toEqual(200);
        for(let i = 9; i < 19; i++) {
            expect(page.body['data'][i-9]['email']).toEqual(userArray[i]['email'])
        }
    })
    test("Check passing in a larger page size", async () => {
        const page = await request(app).get(`/api/admin/users?lastId=${lastId}&size=20`).set('Authorization', `Bearer ${token}`).send()
        expect(page.statusCode).toEqual(200);
        for(let i = 9; i < 29; i++) {
            expect(page.body['data'][i-9]['email']).toEqual(userArray[i]['email'])
        }
    })
})

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

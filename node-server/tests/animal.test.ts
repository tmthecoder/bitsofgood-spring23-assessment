import app from "../api/endpoints"
import request from 'supertest'

let token: string | undefined

beforeAll(async () => {
    const result = await request(app).post('/api/user/verify').send({
        "email": "tejas@tmthecoder.dev",
        "password": "some-password"
    })
    token = result.body["token"];
})

describe("POST - /api/animal", () => {

    test("Unauthorized creation", async () => {
        const result = await request(app).post("/api/animal").send({});
        expect(result.statusCode).toEqual(401)
    })


    test("Create with no body", async () => {
        const result = await request(app).post("/api/animal").set("Authorization", `Bearer ${token}`).send({});
        expect(result.statusCode).toEqual(400)
    })

    test("Create with malformed body", async () => {
        const result = await request(app).post("/api/animal").set("Authorization", `Bearer ${token}`).send({
            name: "Animal1",
            hoursTrained: 10,
            dateOfBirth: "incorrect-dob"
        })
        expect(result.statusCode).toEqual(400)
        console.log(result.body)
    })

    test("Create with correct body", async () => {
        const result = await request(app).post("/api/animal").set("Authorization", `Bearer ${token}`).send({
            name: "Animal1",
            hoursTrained: 10,
            dateOfBirth: "2023-01-10"
        });
        console.log(result.body)
        expect(result.statusCode).toEqual(200)
    })

})

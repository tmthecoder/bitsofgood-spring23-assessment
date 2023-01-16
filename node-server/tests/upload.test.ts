import app from "../api/endpoints"
import request from 'supertest'

describe("POST - /api/file/upload", () => {
    let token: string | undefined;
    let userId: string | undefined;
    let animalId: string | undefined;
    let trainingLogId: string | undefined;

    beforeAll(async () => {
        const accountInfo = await request(app).post('/api/user').send({
            "firstName": "Tejas",
            "lastName": "Mehta",
            "email": "upload@tmthecoder.dev",
            "password": "some-password",
        })
        userId = accountInfo.body["_id"]

        const result = await request(app).post('/api/user/verify').send({
            "email": "upload@tmthecoder.dev",
            "password": "some-password"
        })
        token = result.body["token"];

        const animalResult = await request(app).post('/api/animal').set('Authorization', `Bearer ${token}`).send({
            name: "Test Animal for Uploads",
            dateOfBirth: "2023-01-10"
        })
        animalId = animalResult.body["_id"]

        const trainingResult = await request(app).post("/api/training").set("Authorization", `Bearer ${token}`).send({
            date: "2023-01-10",
            description: "some description 0",
            hours: 10,
            animal: animalId,
        });
        trainingLogId = trainingResult.body["_id"]
    })

    test("Upload profile picture", async () => {
        const result = await request(app).post('/api/file/upload').set('Authorization', `Bearer ${token}`).attach("file", "./tests/assets/user.jpg", {
            filename: "pic.jpg"
        }).field("type", "user")
        expect(result.statusCode).toEqual(200);
        const imgCheck = await fetch(`${process.env.STORAGE_BUCKET_URL}/user/${userId}`);
        expect(imgCheck.status).toEqual(200) // Image is on Cloudflare R2
    })

    test("Upload animal picture", async () => {
        const result = await request(app).post('/api/file/upload').set('Authorization', `Bearer ${token}`).attach("file", "./tests/assets/animal.webp", {
            filename: "pic.jpg"
        }).field("type", "animal").field("id", animalId!)
        expect(result.statusCode).toEqual(200);
        const imgCheck = await fetch(`${process.env.STORAGE_BUCKET_URL}/animal/${animalId}`);
        expect(imgCheck.status).toEqual(200) // Image is on Cloudflare R2
    })

    test("Upload training log", async () => {
        const result = await request(app).post('/api/file/upload').set('Authorization', `Bearer ${token}`).attach("file", "./tests/assets/trainingLog.mp4", {
            filename: "pic.jpg"
        }).field("type", "training").field("id", trainingLogId!)
        expect(result.statusCode).toEqual(200);
        const imgCheck = await fetch(`${process.env.STORAGE_BUCKET_URL}/training/${trainingLogId}`);
        expect(imgCheck.status).toEqual(200) // Image is on Cloudflare R2
    })
})

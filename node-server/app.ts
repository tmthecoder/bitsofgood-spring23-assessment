import express, { Request } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { animalSchema, fileUploadBodySchema, loginRequestBodySchema, trainingLogSchema, userSchema, UserWithId } from './types';
import { genericAPIAdd, updateWithURL, URLWithPath } from './api/addItem';
import { getAnimalWithId, getListOfTrainingLogs, getListOfUsers, getListOfAnimals, getUserWithId } from './api/getItems';
import { validateUser } from './api/validation';
import jwt from 'jsonwebtoken'
import multer from 'multer';
import { createReadStream, unlink } from 'fs';
import fetch from 'node-fetch';

interface AdminQueryParams {
    size?: number,
    lastId?: string
}

type AdminRequest = Request<{}, {}, {}, AdminQueryParams>

interface UserPayload {
    user: UserWithId
}

const SECRET_KEY = "some secret key";
const STORAGE_BUCKET_URL = "https://pub-9079cd5b378f4bb8ac6a3a322bc9258c.r2.dev"
const STORAGE_WORKER_URL = "https://bitsofgood-spring23-assessment-uploader.tmthecoder.workers.dev"

dotenv.config();
const app = express();
const APP_PORT = 5000;
app.use(cors({ origin: true }));

app.get('/api/health', (_, res) => {
    res.json({ "healthy": true })
});

app.post('/api/user/login', async (req, res) => {
    const result = loginRequestBodySchema.safeParse(await req.body.json());
    if (!result.success) {
        res.status(403).send("Invalid email & password combination.");
        return;
    }
    const validationResult = await validateUser(result.data.email, result.data.password);
    if (validationResult.status == "invalid") {
        res.status(403).send("Invalid email & password combination.");
    } else {
        res.send()
    }
});

app.post('/api/user/verify', async (req, res) => {
    const result = loginRequestBodySchema.safeParse(await req.body.json());
    if (!result.success) {
        res.status(403).send("Invalid email & password combination.");
        return;
    }
    const validationResult = await validateUser(result.data.email, result.data.password);
    if (validationResult.status == "invalid") {
        res.status(403).send("Invalid email & password combination.");
        return
    }

    const token = jwt.sign(validationResult.user, SECRET_KEY);
    res.send(token)
});

app.post('/api/user', async (req, res) => {
    const result = userSchema.safeParse(await req.body.json())
    if (!result.success) {
        res.status(400).send(result.error.format()._errors.toString());
        return;
    }
    const user = result.data;
    await genericAPIAdd(res, {
        path: 'users',
        data: user
    })
});

app.use((req, res, next) => {
    try {
        const authToken = req.header('Authorization')?.replace("Bearer ", "");
        if (!authToken) {
            res.status(401).send("No token set")
            return
        }

        const decoded = jwt.verify(authToken, SECRET_KEY) as UserPayload;

        req.user = decoded.user
        next()
    } catch {
        res.status(401).send("Invalid token")
    }
})

app.post('/api/animal', async (req, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const body = await req.body.json();
    const animalBody = {
        ...body,
        owner: req.user._id
    }
    const result = animalSchema.safeParse(animalBody)
    if (!result.success) {
        res.status(400).send(result.error.format()._errors.toString());
        return;
    }
    const animals = result.data;
    await genericAPIAdd(res, {
        path: 'animals',
        data: animals
    })
});

app.post('/api/training', async (req, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const body = await req.body.json();
    const trainingLogBody = {
        ...body,
        user: req.user._id
    }
    const result = trainingLogSchema.safeParse(trainingLogBody)
    if (!result.success) {
        res.status(400).send(result.error.format()._errors.toString());
        return;
    }
    const trainingLog = result.data;

    const associatedUser = await getUserWithId(trainingLog.user);
    const associatedAnimal = await getAnimalWithId(trainingLog.animal);
    if (!associatedUser || !associatedAnimal) {
        res.status(400).send("The animal or user associated with the log does not exist");
        return;
    }

    if (associatedAnimal.owner != associatedUser._id) {
        res.status(400).send("The animal is not owned by the user associated with the log")
    }

    await genericAPIAdd(res, {
        path: 'trainingLogs',
        data: trainingLog
    })
});

app.get('/api/admin/users', async (req: AdminRequest, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const size = req.query.size ?? 10;
    const lastId = req.query.lastId;
    const list = await getListOfUsers(size, lastId)
    res.json({
        data: list,
        lastId: list.at(list.length - 1)
    }).send()
});
app.get('/api/admin/animals', async (req: AdminRequest, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const size = req.query.size ?? 10;
    const lastId = req.query.lastId;
    const list = await getListOfAnimals(size, lastId)
    res.json({
        data: list,
        lastId: list.at(list.length - 1)
    }).send()
});
app.get('/api/admin/training', async (req: AdminRequest, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const size = req.query.size ?? 10;
    const lastId = req.query.lastId;
    const list = await getListOfTrainingLogs(size, lastId);
    res.json({
        data: list,
        lastId: list.at(list.length - 1)
    }).send()
});

const upload = multer()
app.post('/api/file/upload', upload.single('file'), async (req, res) => {
    const parseResult = fileUploadBodySchema.safeParse(await req.body.json());
    const file = req.file;
    if (!file || !parseResult.success) {
        res.status(500).send("An internal error occurred")
        return
    }
    const readStream = createReadStream(file.path);
    const response = await fetch(`${STORAGE_WORKER_URL}/${parseResult.data.type}/${parseResult.data.id}`, {
        method: "POST",
        body: readStream
    })
    if (response.status != 200) {
        res.status(500).send("An internal error occurred");
        return;
    }
    unlink(file.path, () => {});
    let urlData: URLWithPath;
    const url = `${STORAGE_BUCKET_URL}/${await response.text()}`
    switch (parseResult.data.type) {
        case "user":
            urlData = { path: "users", data: { profilePicture: url }}
            break;
        case "animal":
            urlData = { path: "animals", data: { profilePicture: url }}
            break;
        case "training":
            urlData = { path: "trainingLogs", data: { trainingLogVideo: url }}
            break;
    }
    await updateWithURL(parseResult.data.id, urlData);
    res.send();
})

app.listen(APP_PORT, () => {
    console.log(`api listening at http://localhost:${APP_PORT}`)
})

declare module "express-serve-static-core" {
    interface Request {
        user?: UserWithId;
    }
}

import express from 'express';
import 'dotenv/config'
import cors from 'cors';
import { AdminRequest, animalSchema, fileUploadBodySchema, loginRequestBodySchema, trainingLogSchema, userSchema, UserWithId } from '../types';
import { genericAPIAdd, updateAnimalHoursTrained, updateWithURL, URLWithPath } from './addItem';
import { getAnimalWithId, getListOfTrainingLogs, getListOfUsers, getListOfAnimals, getUserWithId, getTrainingLogWithId } from './getItems';
import { validateUser } from './validation';
import jwt from 'jsonwebtoken'
import multer, { memoryStorage } from 'multer';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json())

app.get('/api/health', (_, res) => {
    res.json({ "healthy": true })
});

app.post('/api/user/login', async (req, res) => {
    const result = loginRequestBodySchema.safeParse(await req.body);
    if (!result.success) {
        res.status(403).send({ error: "Invalid email & password combination." });
        return;
    }
    const validationResult = await validateUser(result.data.email, result.data.password);
    if (validationResult.status == "invalid") {
        res.status(403).send({ error: "Invalid email & password combination." });
    } else {
        res.send()
    }
});

app.post('/api/user/verify', async (req, res) => {
    const result = loginRequestBodySchema.safeParse(await req.body);
    if (!result.success) {
        res.status(403).send({ error: "Invalid email & password combination." });
        return;
    }
    const validationResult = await validateUser(result.data.email, result.data.password);
    if (validationResult.status == "invalid") {
        res.status(403).send({ error: "Invalid email & password combination." });
        return
    }

    const token = jwt.sign(validationResult.user, process.env.SECRET_KEY!);
    res.send({ token: token })
});

app.post('/api/user', async (req, res) => {
    const result = await userSchema.safeParseAsync(await req.body)
    if (!result.success) {
        res.status(400).send(result.error.flatten().fieldErrors);
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
            res.status(401).send({ error: "No token set" })
            return
        }

        const decoded = jwt.verify(authToken, process.env.SECRET_KEY!) as UserWithId;
        req.user = decoded
        next()
    } catch (error) {
        res.status(401).send({ error: "Invalid token" })
    }
})

app.post('/api/animal', async (req, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const body = await req.body;
    const animalBody = {
        ...body,
        owner: req.user._id,
        hoursTrained: 0,
    }
    const result = animalSchema.safeParse(animalBody)
    if (!result.success) {
        res.status(400).send(result.error.flatten().fieldErrors);
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
    const body = req.body;
    const trainingLogBody = {
        ...body,
        user: req.user._id
    }
    const result = trainingLogSchema.safeParse(trainingLogBody)
    if (!result.success) {
        res.status(400).send(result.error.flatten().fieldErrors);
        return;
    }
    const trainingLog = result.data;

    const associatedUser = await getUserWithId(trainingLog.user);
    const associatedAnimal = await getAnimalWithId(trainingLog.animal);
    if (!associatedUser || !associatedAnimal) {
        res.status(400).send({ error: "The animal or user associated with the log does not exist" });
        return;
    }

    if (associatedAnimal.owner != associatedUser._id) {
        res.status(400).send({ error: "The animal is not owned by the user associated with the log" })
        return;
    }
    await updateAnimalHoursTrained(associatedAnimal._id, associatedAnimal.hoursTrained + trainingLog.hours)
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
    const size = parseInt(req.query.size ?? "10");
    const lastId = req.query.lastId;
    const list = await getListOfUsers(size, lastId)
    res.json({
        data: list,
        lastId: list.at(list.length - 1)?._id
    }).send()
});

app.get('/api/admin/animals', async (req: AdminRequest, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const size = parseInt(req.query.size ?? "10");
    const lastId = req.query.lastId;
    const list = await getListOfAnimals(size, lastId)
    res.json({
        data: list,
        lastId: list.at(list.length - 1)?._id
    }).send()
});

app.get('/api/admin/training', async (req: AdminRequest, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const size = parseInt(req.query.size ?? "10");
    const lastId = req.query.lastId;
    const list = await getListOfTrainingLogs(size, lastId);
    res.json({
        data: list,
        lastId: list.at(list.length - 1)?._id
    }).send()
});

const upload = multer({ storage: memoryStorage() })
app.post('/api/file/upload', upload.single('file'), async (req, res) => {
    if (!req.user) {
        res.status(401).send()
        return;
    }
    const uploadRequestBody = {
        ...req.body,
    }
    if (req.body["type"] == "user") {
        uploadRequestBody["id"] = req.user._id
    }
    const parseResult = fileUploadBodySchema.safeParse(uploadRequestBody);
    const file = req.file;
    if (!file || !parseResult.success) {
        res.status(400).send({ error: "Parameters and/or file not given" })
        return
    }
    if (parseResult.data.type == "animal") {
        const animal = await getAnimalWithId(parseResult.data.id);
        if (animal?.owner != req.user._id) {
            res.status(400).send({ error: "The animal is not associated with the user calling the request" })
            return;
        }
    }

    if (parseResult.data.type == "training") {
        const animal = await getTrainingLogWithId(parseResult.data.id);
        if (animal?.user != req.user._id) {
            res.status(400).send({ error: "The training log is not associated with the user calling the request" })
            return;
        }
    }
    const response = await fetch(`${process.env.STORAGE_WORKER_URL}/${parseResult.data.type}/${parseResult.data.id}`, {
        method: "POST",
        body: file.buffer
    })
    if (response.status != 200) {
        res.status(500).send({ error: "An internal error occurred" });
        return;
    }
    let urlData: URLWithPath;
    const url = `${process.env.STORAGE_BUCKET_URL}/${await response.text()}`
    switch (parseResult.data.type) {
        case "user":
            urlData = { path: "users", data: { profilePicture: url } }
            break;
        case "animal":
            urlData = { path: "animals", data: { profilePicture: url } }
            break;
        case "training":
            urlData = { path: "trainingLogs", data: { trainingLogVideo: url } }
            break;
    }
    await updateWithURL(parseResult.data.id, urlData);
    res.send();
})

export default app

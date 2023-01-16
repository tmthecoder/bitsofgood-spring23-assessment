import { ObjectID } from "bson";
import { Response } from "express";
import { Animal, TrainingLog, User } from "../types"
import { getConnection } from "./dbConnector";

type ItemWithPath =
    | { path: 'animals'; data: Animal }
    | { path: 'users'; data: User }
    | { path: 'trainingLogs'; data: TrainingLog }

export async function genericAPIAdd(res: Response, item: ItemWithPath) {
    try {
        const userWithId = await addItem(item)
        res.json(userWithId).send()
    } catch (error) {
        res.status(500).send(`Internal error: ${error}`)
    }
}

export type URLWithPath =
    | { path: 'animals'; data: Pick<Animal, 'profilePicture'> }
    | { path: 'users'; data: Pick<User, 'profilePicture'> }
    | { path: 'trainingLogs'; data: Pick<TrainingLog, 'trainingLogVideo'> }

export async function updateWithURL(id: ObjectID, urlData: URLWithPath) {
    const db = await getConnection()
    if (!db) throw new Error("Database connection failed");
    await db.collection(urlData.path).updateOne({ '_id': id }, { $set: urlData.data })
}

export async function updateAnimalHoursTrained(id: ObjectID, hours: number) {
    const db = await getConnection()
    if (!db) throw new Error("Database connection failed");
    await db.collection('animals').updateOne({ '_id': id }, { $set: { hoursTrained: hours }} )
}

async function addItem(item: ItemWithPath) {
    const db = await getConnection()
    if (!db) throw new Error("Database connection failed");
    const result = await db.collection(item.path).insertOne(item.data)
    return {
        _id: result.insertedId,
        ...item.data,
    }
}

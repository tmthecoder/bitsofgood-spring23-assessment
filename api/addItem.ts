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

async function addItem(item: ItemWithPath) {
    const db = await getConnection()
    if (!db) throw new Error("Database connection failed");
    const result = await db.collection(item.path).insertOne(item.data)
    return {
        _id: result.insertedId,
        ...item.data,
    }
}

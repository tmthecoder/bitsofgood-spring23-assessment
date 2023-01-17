import { Request, Response } from "express";
import "../types";
import { Animal, fileUploadBodySchema, TrainingLog, User } from "../types";
import { getConnection } from "./dbConnector";
import { getAnimalWithId, getTrainingLogWithId } from "./getItems";

export async function handleUploadRequest(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).send();
    return;
  }
  const uploadRequestBody = {
    ...req.body,
  };
  if (req.body["type"] == "user") {
    uploadRequestBody["id"] = req.user._id;
  }
  const parseResult = fileUploadBodySchema.safeParse(uploadRequestBody);
  const file = req.file;
  if (!file || !parseResult.success) {
    res.status(400).send({ error: "Parameters and/or file not given" });
    return;
  }
  if (parseResult.data.type == "animal") {
    const animal = await getAnimalWithId(parseResult.data.id);
    if (animal?.owner != req.user._id) {
      res.status(400).send({
        error: "The animal is not associated with the user calling the request",
      });
      return;
    }
  }

  if (parseResult.data.type == "training") {
    const animal = await getTrainingLogWithId(parseResult.data.id);
    if (animal?.user != req.user._id) {
      res.status(400).send({
        error:
          "The training log is not associated with the user calling the request",
      });
      return;
    }
  }
  const response = await fetch(
    `${process.env.STORAGE_WORKER_URL}/${parseResult.data.type}/${parseResult.data.id}`,
    {
      method: "POST",
      body: file.buffer,
    }
  );
  if (response.status != 200) {
    res.status(500).send({ error: "An internal error occurred" });
    return;
  }
  let urlData: URLWithPath;
  const url = `${process.env.STORAGE_BUCKET_URL}/${await response.text()}`;
  switch (parseResult.data.type) {
    case "user":
      urlData = { path: "users", data: { profilePicture: url } };
      break;
    case "animal":
      urlData = { path: "animals", data: { profilePicture: url } };
      break;
    case "training":
      urlData = { path: "trainingLogs", data: { trainingLogVideo: url } };
      break;
  }
  await updateWithURL(parseResult.data.id, urlData);
  res.send();
}

type URLWithPath =
  | { path: "animals"; data: Pick<Animal, "profilePicture"> }
  | { path: "users"; data: Pick<User, "profilePicture"> }
  | { path: "trainingLogs"; data: Pick<TrainingLog, "trainingLogVideo"> };

async function updateWithURL(id: Object, urlData: URLWithPath) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  await db
    .collection(urlData.path)
    .updateOne({ _id: id }, { $set: urlData.data });
}

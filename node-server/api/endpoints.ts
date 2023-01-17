import express from "express";
import "dotenv/config";
import cors from "cors";
import {
  handleAddAnimalRequest,
  handleAddTrainingLogRequest,
  handleAddUserRequest,
} from "./addItem";
import {
  handleAdminGetUsers,
  handleAdminGetAnimals,
  handleAdminGetTrainingLogs,
} from "./getItems";
import multer, { memoryStorage } from "multer";
import { handleUploadRequest } from "./uploader";
import {
  handleUserLoginRequest,
  handleUserVerifyRequest,
  verifyUserJWT,
} from "./validation";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.json({ healthy: true });
});

app.post("/api/user/login", handleUserLoginRequest);
app.post("/api/user/verify", handleUserVerifyRequest);

app.post("/api/user", handleAddUserRequest);

app.use(verifyUserJWT);

app.post("/api/animal", handleAddAnimalRequest);
app.post("/api/training", handleAddTrainingLogRequest);

app.get("/api/admin/users", handleAdminGetUsers);
app.get("/api/admin/animals", handleAdminGetAnimals);
app.get("/api/admin/training", handleAdminGetTrainingLogs);

const upload = multer({ storage: memoryStorage() });
app.post("/api/file/upload", upload.single("file"), handleUploadRequest);

export default app;

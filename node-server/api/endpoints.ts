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

// Health endpoint
app.get("/api/health", (_, res) => {
  res.json({ healthy: true });
});

// User login and verification endpoints
app.post("/api/user/login", handleUserLoginRequest);
app.post("/api/user/verify", handleUserVerifyRequest);

// User addition endpoint
app.post("/api/user", handleAddUserRequest);

// Middleware for user JWT verification (all endpoints under will use)
app.use(verifyUserJWT);

// Animal and training log addition endpoints
app.post("/api/animal", handleAddAnimalRequest);
app.post("/api/training", handleAddTrainingLogRequest);

// Admin lookup endpoints
app.get("/api/admin/users", handleAdminGetUsers);
app.get("/api/admin/animals", handleAdminGetAnimals);
app.get("/api/admin/training", handleAdminGetTrainingLogs);

// Upload middleware & endpoint
const upload = multer({ storage: memoryStorage() });
app.post("/api/file/upload", upload.single("file"), handleUploadRequest);

export default app;

import { compare } from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { loginRequestBodySchema, User, UserWithId } from "../types";
import jwt from "jsonwebtoken";
import { getConnection } from "./dbConnector";

type ValidationResponse =
  | { status: "valid"; user: User }
  | { status: "invalid" };

export async function handleUserLoginRequest(req: Request, res: Response) {
  const result = loginRequestBodySchema.safeParse(await req.body);
  if (!result.success) {
    res.status(403).send({ error: "Invalid email & password combination." });
    return;
  }
  const validationResult = await validateUser(
    result.data.email,
    result.data.password
  );
  if (validationResult.status == "invalid") {
    res.status(403).send({ error: "Invalid email & password combination." });
  } else {
    res.send();
  }
}

export async function handleUserVerifyRequest(req: Request, res: Response) {
  const result = loginRequestBodySchema.safeParse(await req.body);
  if (!result.success) {
    res.status(403).send({ error: "Invalid email & password combination." });
    return;
  }
  const validationResult = await validateUser(
    result.data.email,
    result.data.password
  );
  if (validationResult.status == "invalid") {
    res.status(403).send({ error: "Invalid email & password combination." });
    return;
  }

  const token = jwt.sign(validationResult.user, process.env.SECRET_KEY!);
  res.send({ token: token });
}

export async function verifyUserJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Verify the JWT and continue to the actual request (exit of not valid)
  try {
    const authToken = req.header("Authorization")?.replace("Bearer ", "");
    if (!authToken) {
      res.status(401).send({ error: "No token set" });
      return;
    }

    const decoded = jwt.verify(
      authToken,
      process.env.SECRET_KEY!
    ) as UserWithId;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send({ error: "Invalid token" });
  }
}

async function validateUser(
  email: string,
  password: string
): Promise<ValidationResponse> {
  const user = await getUserWithEmail(email);
  if (!user) {
    return { status: "invalid" };
  }
  const result = await compare(password, user.password);
  if (!result) {
    return { status: "invalid" };
  } else {
    return { status: "valid", user: user };
  }
}

// Utility function to get a user from their email
async function getUserWithEmail(email: string) {
  const db = await getConnection();
  if (!db) throw new Error("Database connection failed");
  const result = await db.collection("users").findOne({ email: email });
  return result as UserWithId | null;
}

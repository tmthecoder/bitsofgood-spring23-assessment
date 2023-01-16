import { genSalt, hash } from "bcrypt";
import { Request } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";

const zodOidType = z.custom<ObjectId>((item) => String(item).length == 24)

export const userSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    password: z.string().transform(async (plaintext) => {
        const salt = await genSalt(10);
        return hash(plaintext, salt);
    }),
    profilePicture: z.string().optional()
});

export const animalSchema = z.object({
    name: z.string(),
    hoursTrained: z.number(),
    owner: zodOidType,
    dateOfBirth: z.coerce.date().optional(),
    profilePicture: z.string().optional()
})

export const trainingLogSchema = z.object({
    date: z.coerce.date(),
    description: z.string(),
    hours: z.number(),
    animal: zodOidType,
    user: zodOidType,
    trainingLogVideo: z.string().optional()
})

export const loginRequestBodySchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export const fileUploadBodySchema = z.object({
    type: z.literal('user').or(z.literal('animal')).or(z.literal('training')),
    id: zodOidType,
})

export type User = z.infer<typeof userSchema>;
export type Animal = z.infer<typeof animalSchema>;
export type TrainingLog = z.infer<typeof trainingLogSchema>;
export type LoginRequestBody = z.infer<typeof loginRequestBodySchema>;

export type UserWithId = User & { _id: ObjectId }
export type AnimalWithID = Animal & { _id: ObjectId }
export type TrainingLogWithID = TrainingLog & { _id: ObjectId }

export interface AdminQueryParams {
    size?: string,
    lastId?: string
}

export type AdminRequest = Request<{}, {}, {}, AdminQueryParams>

declare module "express-serve-static-core" {
    interface Request {
        user?: UserWithId;
    }
}

import { compare, hash } from "bcrypt";
import { User, UserWithId } from "../types";
import { getUserWithEmail } from "./getItems";

type ValidationResponse =
  | { status: "valid"; user: User }
  | { status: "invalid" };

export async function validateUser(
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

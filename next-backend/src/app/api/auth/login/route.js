import bcrypt from "bcrypt";
import { getDb } from "@/lib/mongodb";
import { signJWT, cookieOptions } from "@/lib/auth";
import { endpoint, ApiError, publicUser, options } from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const runtime = "nodejs";
export const OPTIONS = options;
export const POST = endpoint(async (request) => {
  const body = await request.json();
  const identifier = body?.identifier || body?.email || body?.username;
  if (
    typeof identifier !== "string" ||
    typeof body?.password !== "string" ||
    identifier.length > 254 ||
    body.password.length > 200
  )
    throw new ApiError("Enter your username/email and password.");
  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({
      $or: [
        { email: identifier.trim().toLowerCase() },
        { username: identifier.trim() },
      ],
    });
  if (!user || !(await bcrypt.compare(body.password, user.password)))
    throw new ApiError("Invalid username/email or password.", 401);
  const token = signJWT(user);
  const response = successResponse({ user: publicUser(user), token }, 200);
  response.cookies.set("token", token, cookieOptions());
  return response;
});

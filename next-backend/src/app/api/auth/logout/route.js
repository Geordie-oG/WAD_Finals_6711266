import { successResponse } from "@/lib/utils";
import { cookieOptions } from "@/lib/auth";
import { options } from "@/lib/api";
export const OPTIONS = options;
export async function POST() {
  const response = successResponse({ message: "Signed out." }, 200);
  response.cookies.set("token", "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

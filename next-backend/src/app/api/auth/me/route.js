import { endpoint, requireUser, publicUser, options } from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const OPTIONS = options;
export const GET = endpoint(async (request) =>
  successResponse({ user: publicUser(await requireUser(request)) }, 200),
);

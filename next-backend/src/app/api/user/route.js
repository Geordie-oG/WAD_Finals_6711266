import { endpoint, requireUser, publicUser, options } from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const OPTIONS = options;
// Account data is private: list only the current authenticated account.
export const GET = endpoint(async (request) =>
  successResponse({ users: [publicUser(await requireUser(request))] }, 200),
);

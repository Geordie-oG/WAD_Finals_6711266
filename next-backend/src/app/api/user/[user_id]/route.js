import {
  endpoint,
  requireUser,
  publicUser,
  objectId,
  ApiError,
  options,
} from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const OPTIONS = options;
export const GET = endpoint(async (request, context) => {
  const user = await requireUser(request);
  const id = objectId((await context.params).user_id);
  if (!user._id.equals(id))
    throw new ApiError("You can only view your own account.", 403);
  return successResponse({ user: publicUser(user) }, 200);
});

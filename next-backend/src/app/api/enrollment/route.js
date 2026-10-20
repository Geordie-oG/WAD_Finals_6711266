import { getDb } from "@/lib/mongodb";
import { endpoint, requireUser, serializeCourses, options } from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const OPTIONS = options;
export const GET = endpoint(async (request) => {
  const user = await requireUser(request, "Student");
  const db = await getDb();
  const courses = await db
    .collection("courses")
    .find({ studentIds: user._id, status: { $ne: "Cancel" } })
    .sort({ updatedAt: -1 })
    .toArray();
  return successResponse(
    { courses: await serializeCourses(db, courses, user) },
    200,
  );
});

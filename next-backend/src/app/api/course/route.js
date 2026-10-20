import { getDb } from "@/lib/mongodb";
import {
  endpoint,
  requireUser,
  validateCourse,
  serializeCourses,
  ApiError,
  options,
} from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const runtime = "nodejs";
export const OPTIONS = options;
export const GET = endpoint(async (request) => {
  const user = await requireUser(request);
  const db = await getDb();
  const query =
    user.role === "Teacher"
      ? { teacherId: user._id }
      : { status: { $ne: "Cancel" } };
  const search = (new URL(request.url).searchParams.get("q") || "").trim();
  if (search.length > 120)
    throw new ApiError("Search must be at most 120 characters.");
  // User text is literal, never interpreted as a regular expression.
  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (search) {
    const teachers = await db
      .collection("users")
      .find({ role: "Teacher", username: regex }, { projection: { _id: 1 } })
      .toArray();
    query.$or = [
      { name: regex },
      { teacherId: { $in: teachers.map((t) => t._id) } },
    ];
  }
  const courses = await db
    .collection("courses")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  return successResponse(
    { courses: await serializeCourses(db, courses, user) },
    200,
  );
});
export const POST = endpoint(async (request) => {
  const user = await requireUser(request, "Teacher");
  const data = validateCourse(await request.json());
  const db = await getDb();
  const course = {
    ...data,
    teacherId: user._id,
    studentIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection("courses").insertOne(course);
  course._id = result.insertedId;
  return successResponse(
    { course: (await serializeCourses(db, [course], user))[0] },
    201,
  );
});

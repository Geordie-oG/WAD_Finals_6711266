import { getDb } from "@/lib/mongodb";
import {
  endpoint,
  requireUser,
  validateCourse,
  serializeCourses,
  objectId,
  ownCourse,
  publicUser,
  ApiError,
  options,
} from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const runtime = "nodejs";
export const OPTIONS = options;
export const GET = endpoint(async (request, context) => {
  const user = await requireUser(request);
  const id = objectId((await context.params).course_id);
  const db = await getDb();
  const query = { _id: id };
  if (user.role === "Teacher") query.teacherId = user._id;
  else query.status = { $ne: "Cancel" };
  const course = await db.collection("courses").findOne(query);
  if (!course) throw new ApiError("Course not found.", 404);
  const data = (await serializeCourses(db, [course], user))[0];
  if (user.role === "Teacher") {
    const students = await db
      .collection("users")
      .find({ _id: { $in: course.studentIds || [] } })
      .toArray();
    data.enrolledStudents = students.map(publicUser);
  }
  return successResponse({ course: data }, 200);
});
export const PUT = endpoint(async (request, context) => {
  const user = await requireUser(request, "Teacher");
  const id = objectId((await context.params).course_id);
  const data = validateCourse(await request.json());
  const db = await getDb();
  await ownCourse(db, id, user);
  // Atomic capacity predicate also protects against enrollment racing a capacity reduction.
  const course = await db
    .collection("courses")
    .findOneAndUpdate(
      {
        _id: id,
        teacherId: user._id,
        $expr: { $lte: [{ $size: "$studentIds" }, data.maxStudent] },
      },
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after", includeResultMetadata: false },
    );
  if (!course)
    throw new ApiError(
      "Max Student cannot be below the current enrollment count.",
      409,
    );
  return successResponse(
    { course: (await serializeCourses(db, [course], user))[0] },
    200,
  );
});
export const DELETE = endpoint(async (request, context) => {
  const user = await requireUser(request, "Teacher");
  const id = objectId((await context.params).course_id);
  const db = await getDb();
  await ownCourse(db, id, user);
  const result = await db
    .collection("courses")
    .deleteOne({ _id: id, teacherId: user._id, studentIds: { $size: 0 } });
  if (!result.deletedCount)
    throw new ApiError(
      "A course with enrolled students cannot be deleted.",
      409,
    );
  return successResponse({ message: "Course deleted." }, 200);
});

import { getDb } from "@/lib/mongodb";
import { endpoint, requireUser, objectId, ApiError, options } from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const runtime = "nodejs";
export const OPTIONS = options;
export const POST = endpoint(async (request, context) => {
  const user = await requireUser(request, "Student");
  const id = objectId((await context.params).course_id);
  const db = await getDb();
  // A single document update serializes status, duplicate and capacity checks.
  const result = await db
    .collection("courses")
    .findOneAndUpdate(
      {
        _id: id,
        status: "Open",
        studentIds: { $ne: user._id },
        $expr: { $lt: [{ $size: "$studentIds" }, "$maxStudent"] },
      },
      { $addToSet: { studentIds: user._id }, $set: { updatedAt: new Date() } },
      { returnDocument: "after", includeResultMetadata: false },
    );
  if (!result) {
    const course = await db.collection("courses").findOne({ _id: id });
    if (!course || course.status === "Cancel")
      throw new ApiError("Course not found.", 404);
    if (course.studentIds.some((id) => id.equals(user._id)))
      throw new ApiError("You are already enrolled in this course.", 409);
    if (course.status !== "Open")
      throw new ApiError("This course is not open for enrollment.", 409);
    throw new ApiError("This course has no seats remaining.", 409);
  }
  return successResponse(
    { message: "Enrollment successful.", courseId: id.toString() },
    201,
  );
});

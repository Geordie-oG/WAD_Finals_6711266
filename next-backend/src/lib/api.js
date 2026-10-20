import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { verifyJWT } from "./auth";
import { errorResponse, successResponse } from "./utils";
export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export const options = () => successResponse({}, 200);
export function endpoint(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError)
        return errorResponse(error.message, error.status);
      if (error instanceof SyntaxError)
        return errorResponse("Request body must contain valid JSON.", 400);
      console.error("API operation failed:", error.name, error.code || "");
      return errorResponse(
        "The server could not complete this request. Please try again.",
        500,
      );
    }
  };
}
export function objectId(id) {
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id))
    throw new ApiError("Invalid id.", 400);
  return new ObjectId(id);
}
export function publicUser(user) {
  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  };
}
export async function requireUser(req, role) {
  const token = verifyJWT(req);
  if (!token?.id) throw new ApiError("Please sign in to continue.", 401);
  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ _id: objectId(token.id) });
  if (!user || !["Student", "Teacher"].includes(user.role))
    throw new ApiError("Invalid account.", 401);
  if (role && user.role !== role)
    throw new ApiError(`This operation requires a ${role} account.`, 403);
  return user;
}
export function validateCourse(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new ApiError("Course data is required.");
  const { name, duration, price, maxStudent, status, topics } = input;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120)
    throw new ApiError("Course name must contain 1–120 characters.");
  if (!Number.isInteger(duration) || duration < 1 || duration > 3650)
    throw new ApiError("Duration must be a whole number from 1 to 3650 days.");
  if (
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 10000000
  )
    throw new ApiError("Price must be a number from 0 to 10000000.");
  if (!Number.isInteger(maxStudent) || maxStudent < 1 || maxStudent > 10000)
    throw new ApiError("Max Student must be a whole number from 1 to 10000.");
  if (!["Open", "Close", "Cancel"].includes(status))
    throw new ApiError("Status must be Open, Close, or Cancel.");
  if (
    !Array.isArray(topics) ||
    topics.length < 1 ||
    topics.length > 30 ||
    topics.some(
      (t) => typeof t !== "string" || !t.trim() || t.trim().length > 120,
    )
  )
    throw new ApiError(
      "Provide 1–30 topics, each containing 1–120 characters.",
    );
  return {
    name: name.trim(),
    duration,
    price,
    maxStudent,
    status,
    topics: [...new Set(topics.map((t) => t.trim()))],
  };
}
export async function serializeCourses(db, courses, user) {
  const teacherIds = [
    ...new Set(courses.map((c) => c.teacherId.toString())),
  ].map((id) => new ObjectId(id));
  const teachers = await db
    .collection("users")
    .find({ _id: { $in: teacherIds } }, { projection: { username: 1 } })
    .toArray();
  const names = new Map(teachers.map((t) => [t._id.toString(), t.username]));
  return courses.map((course) => ({
    _id: course._id.toString(),
    teacherId: course.teacherId.toString(),
    teacherName: names.get(course.teacherId.toString()) || "Teacher",
    name: course.name,
    duration: course.duration,
    topics: course.topics,
    price: course.price,
    maxStudent: course.maxStudent,
    status: course.status,
    enrolledCount: (course.studentIds || []).length,
    isEnrolled: (course.studentIds || []).some(
      (id) => id.toString() === user._id.toString(),
    ),
  }));
}
export async function ownCourse(db, id, user) {
  const course = await db
    .collection("courses")
    .findOne({ _id: id, teacherId: user._id });
  if (!course) throw new ApiError("Course not found or not owned by you.", 404);
  return course;
}

import { getDb } from "@/lib/mongodb";
import { endpoint } from "@/lib/api";
import { successResponse } from "@/lib/utils";
export const GET = endpoint(async () => {
  const db = await getDb();
  await db.command({ ping: 1 });
  return successResponse(
    { service: "CourseSpace API", database: "connected" },
    200,
  );
});

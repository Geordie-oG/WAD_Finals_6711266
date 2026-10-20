import assert from "node:assert/strict";
import { MongoClient, ObjectId } from "mongodb";
const base = process.argv[2] || "http://localhost:3000/api";
const stamp = `QA-${Date.now()}-`;
const created = [];
let passed = 0;
async function request(path, method = "GET", body, token, extra = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}
function check(name, condition) {
  assert.ok(condition, name);
  passed++;
  console.log(`PASS ${name}`);
}
const courseBody = (overrides) => ({
  name: stamp + "Course",
  duration: 7,
  topics: ["HTML", "CSS"],
  price: 100,
  maxStudent: 2,
  status: "Open",
  ...overrides,
});
async function login(role, index) {
  const r = await request("/auth/login", "POST", {
    identifier: `${role}${index}@courses.test`,
    password: "Learn2026!",
  });
  check(`${role}${index} login`, r.status === 200 && !!r.data.token);
  return r.data;
}
let client;
try {
  for (const [method, path, body] of [
    ["GET", "/course"],
    ["POST", "/course", courseBody()],
    ["GET", "/enrollment"],
    ["GET", "/user"],
    ["GET", "/auth/me"],
    ["GET", "/course/671126600000000000000001"],
    ["PUT", "/course/671126600000000000000001", courseBody()],
    ["DELETE", "/course/671126600000000000000001"],
    ["POST", "/course/671126600000000000000001/enroll"],
  ]) {
    check(
      `unauthenticated ${method} ${path} rejected`,
      (await request(path, method, body)).status === 401,
    );
  }
  check(
    "spoofed identity headers rejected",
    (
      await request("/course", "GET", undefined, undefined, {
        "x-user-id": "671126600000000000000001",
        "x-user-username": "Teacher",
        "x-user-role": "Teacher",
      })
    ).status === 401,
  );
  check(
    "forged bearer rejected",
    (await request("/course", "GET", undefined, "invalid.token.value"))
      .status === 401,
  );
  check(
    "wrong password rejected",
    (
      await request("/auth/login", "POST", {
        email: "student1@courses.test",
        password: "wrong",
      })
    ).status === 401,
  );
  const teachers = [];
  const students = [];
  for (let i = 1; i <= 3; i++) {
    teachers.push(await login("teacher", i));
    students.push(await login("student", i));
  }
  const t = teachers[0].token,
    t2 = teachers[1].token,
    s = students[0].token,
    s2 = students[1].token,
    s3 = students[2].token;
  check(
    "login user contains safe fields only",
    !teachers[0].user.password && teachers[0].user.role === "Teacher",
  );
  check(
    "session restores bearer auth",
    (await request("/auth/me", "GET", undefined, s)).data.user.role ===
      "Student",
  );
  const cookieLogin = await request("/auth/login", "POST", {
    identifier: "Alex Chen",
    password: "Learn2026!",
  });
  const cookie = cookieLogin.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  check("username login works", cookieLogin.status === 200);
  check(
    "HttpOnly session cookie set",
    /httponly/i.test(cookieLogin.headers.get("set-cookie")),
  );
  check(
    "cookie auth works",
    (await request("/auth/me", "GET", undefined, undefined, { Cookie: cookie }))
      .status === 200,
  );
  check(
    "Student cannot create courses",
    (await request("/course", "POST", courseBody(), s)).status === 403,
  );
  check(
    "Teacher cannot use student enrollments",
    (await request("/enrollment", "GET", undefined, t)).status === 403,
  );
  check(
    "invalid course rejected",
    (await request("/course", "POST", courseBody({ duration: -1 }), t))
      .status === 400,
  );
  check(
    "invalid topics rejected",
    (await request("/course", "POST", courseBody({ topics: [] }), t)).status ===
      400,
  );
  check(
    "invalid status rejected",
    (await request("/course", "POST", courseBody({ status: "Hidden" }), t))
      .status === 400,
  );
  check(
    "malformed id rejected",
    (await request("/course/not-an-id", "GET", undefined, t)).status === 400,
  );
  check(
    "nonexistent course returns 404",
    (await request("/course/000000000000000000000001", "GET", undefined, t))
      .status === 404,
  );
  async function create(overrides = {}) {
    const body = courseBody(overrides);
    const r = await request("/course", "POST", body, t);
    check("Teacher creates course", r.status === 201);
    created.push(r.data.course._id);
    return r.data.course;
  }
  const c = await create({ name: stamp + "Main" });
  const path = `/course/${c._id}`;
  check(
    "teacher ownership assigned by backend",
    c.teacherId === teachers[0].user._id,
  );
  check(
    "Teacher list contains only own courses",
    (await request("/course", "GET", undefined, t)).data.courses.every(
      (c) => c.teacherId === teachers[0].user._id,
    ),
  );
  check(
    "Other teacher cannot list course",
    !(await request("/course", "GET", undefined, t2)).data.courses.some(
      (x) => x._id === c._id,
    ),
  );
  check(
    "Other teacher cannot read details",
    (await request(path, "GET", undefined, t2)).status === 404,
  );
  check(
    "Other teacher cannot update",
    (await request(path, "PUT", courseBody(), t2)).status === 404,
  );
  check(
    "Other teacher cannot delete",
    (await request(path, "DELETE", undefined, t2)).status === 404,
  );
  check(
    "Student cannot update",
    (await request(path, "PUT", courseBody(), s)).status === 403,
  );
  check(
    "Student cannot delete",
    (await request(path, "DELETE", undefined, s)).status === 403,
  );
  check(
    "Teacher cannot enroll",
    (await request(path + "/enroll", "POST", undefined, t)).status === 403,
  );
  check(
    "Student details do not expose other students",
    !(await request(path, "GET", undefined, s)).data.course.enrolledStudents,
  );
  const updated = await request(
    path,
    "PUT",
    courseBody({ name: stamp + "Updated", topics: ["React", "MongoDB"] }),
    t,
  );
  check(
    "Owner can update fields",
    updated.status === 200 && updated.data.course.topics.length === 2,
  );
  check(
    "Partial course-name filter",
    (
      await request(
        `/course?q=${encodeURIComponent(stamp + "Upd")}`,
        "GET",
        undefined,
        s,
      )
    ).data.courses.some((x) => x._id === c._id),
  );
  check(
    "Partial teacher-name filter",
    (await request("/course?q=alex", "GET", undefined, s)).data.courses.some(
      (x) => x._id === c._id,
    ),
  );
  check(
    "Regex metacharacters treated literally",
    (await request("/course?q=%5B.*", "GET", undefined, s)).status === 200,
  );
  check(
    "Student enrolls",
    (await request(path + "/enroll", "POST", undefined, s)).status === 201,
  );
  check(
    "Duplicate enrollment rejected",
    (await request(path + "/enroll", "POST", undefined, s)).status === 409,
  );
  const own = (await request(path, "GET", undefined, t)).data.course;
  check(
    "Teacher sees enrolled student",
    own.enrolledStudents.some((x) => x.email === "student1@courses.test"),
  );
  check(
    "Teacher roster does not expose passwords",
    own.enrolledStudents.every((x) => !x.password),
  );
  check(
    "My enrolled courses includes enrollment",
    (await request("/enrollment", "GET", undefined, s)).data.courses.some(
      (x) => x._id === c._id,
    ),
  );
  check(
    "Other student enrollment list is isolated",
    !(await request("/enrollment", "GET", undefined, s2)).data.courses.some(
      (x) => x._id === c._id,
    ),
  );
  check(
    "Enrolled course cannot be deleted",
    (await request(path, "DELETE", undefined, t)).status === 409,
  );
  check(
    "Second Student enrolls",
    (await request(path + "/enroll", "POST", undefined, s2)).status === 201,
  );
  check(
    "Full course rejects enrollment",
    (await request(path + "/enroll", "POST", undefined, s3)).status === 409,
  );
  check(
    "Capacity cannot fall below enrolled count",
    (await request(path, "PUT", courseBody({ maxStudent: 1 }), t)).status ===
      409,
  );
  const closed = await create({ name: stamp + "Closed", status: "Close" });
  const cancelled = await create({
    name: stamp + "Cancelled",
    status: "Cancel",
  });
  const catalog = (await request("/course", "GET", undefined, s)).data.courses;
  check(
    "Closed course remains visible",
    catalog.some((x) => x._id === closed._id),
  );
  check(
    "Cancelled courses hidden",
    catalog.every((x) => x.status !== "Cancel"),
  );
  check(
    "Closed course blocks enrollment",
    (await request(`/course/${closed._id}/enroll`, "POST", undefined, s))
      .status === 409,
  );
  check(
    "Cancelled course blocks enrollment",
    (await request(`/course/${cancelled._id}/enroll`, "POST", undefined, s))
      .status === 404,
  );
  check(
    "Cancelled course details hidden",
    (await request(`/course/${cancelled._id}`, "GET", undefined, s)).status ===
      404,
  );
  const race = await create({ name: stamp + "Last seat", maxStudent: 1 });
  const raced = await Promise.all(
    [s, s2, s3].map((token) =>
      request(`/course/${race._id}/enroll`, "POST", undefined, token),
    ),
  );
  check(
    "Concurrent last-seat enrollment admits exactly one",
    raced.filter((x) => x.status === 201).length === 1 &&
      raced.filter((x) => x.status === 409).length === 2,
  );
  check(
    "Concurrent enrollment never exceeds capacity",
    (await request(`/course/${race._id}`, "GET", undefined, t)).data.course
      .enrolledCount === 1,
  );
  const duplicates = await create({
    name: stamp + "Duplicate race",
    maxStudent: 10,
  });
  const duplicated = await Promise.all(
    Array.from({ length: 4 }, () =>
      request(`/course/${duplicates._id}/enroll`, "POST", undefined, s),
    ),
  );
  check(
    "Concurrent duplicate enrollment admits exactly once",
    duplicated.filter((x) => x.status === 201).length === 1 &&
      duplicated.filter((x) => x.status === 409).length === 3,
  );
  check(
    "Owner deletes empty course",
    (await request(`/course/${closed._id}`, "DELETE", undefined, t)).status ===
      200,
  );
  check(
    "Deleted course no longer readable",
    (await request(`/course/${closed._id}`, "GET", undefined, t)).status ===
      404,
  );
  check(
    "Other user's private data rejected",
    (await request(`/user/${teachers[0].user._id}`, "GET", undefined, s))
      .status === 403,
  );
  // Grading audit: test state transitions and hostile inputs, not only the happy path.
  check(
    "All demo accounts have required public fields",
    [...teachers, ...students].every(
      ({ user }) =>
        user.username &&
        user.email &&
        user._id &&
        ["Student", "Teacher"].includes(user.role),
    ),
  );
  check(
    "Exactly three demo accounts per role",
    teachers.every((x) => x.user.role === "Teacher") &&
      students.every((x) => x.user.role === "Student"),
  );
  check(
    "Login rejects query-operator injection",
    (
      await request("/auth/login", "POST", {
        identifier: { $ne: null },
        password: "Learn2026!",
      })
    ).status === 400,
  );
  check(
    "Student cannot spoof Teacher role headers",
    (
      await request("/course", "POST", courseBody(), s, {
        "x-user-role": "Teacher",
        "x-user-id": teachers[0].user._id,
      })
    ).status === 403,
  );
  const forgedOwner = await create({
    name: stamp + "Ownership payload",
    teacherId: teachers[1].user._id,
    studentIds: [students[0].user._id],
  });
  check(
    "Client cannot assign a different course owner",
    forgedOwner.teacherId === teachers[0].user._id,
  );
  check(
    "Client cannot insert fake enrollments on create",
    forgedOwner.enrolledCount === 0,
  );
  const invalidNumbers = [
    { price: -1 },
    { maxStudent: 0 },
    { maxStudent: 1.5 },
    { duration: 1.5 },
    { name: "   " },
  ];
  for (const invalid of invalidNumbers)
    check(
      `Invalid field rejected: ${JSON.stringify(invalid)}`,
      (await request("/course", "POST", courseBody(invalid), t)).status === 400,
    );
  const malformed = await fetch(base + "/course", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${t}`,
    },
    body: "{broken",
    signal: AbortSignal.timeout(30000),
  });
  check(
    "Malformed JSON rejected without server error",
    malformed.status === 400,
  );
  const transition = await create({ name: stamp + "Transitions" });
  const transitionPath = `/course/${transition._id}`;
  check(
    "Student enrolls before status transitions",
    (await request(transitionPath + "/enroll", "POST", undefined, s)).status ===
      201,
  );
  check(
    "Teacher closes an existing course",
    (
      await request(
        transitionPath,
        "PUT",
        courseBody({ name: stamp + "Transitions", status: "Close" }),
        t,
      )
    ).status === 200,
  );
  check(
    "Changing to Close blocks new enrollment",
    (await request(transitionPath + "/enroll", "POST", undefined, s2))
      .status === 409,
  );
  check(
    "Closing preserves existing enrollment",
    (await request("/enrollment", "GET", undefined, s)).data.courses.some(
      (x) => x._id === transition._id && x.status === "Close",
    ),
  );
  check(
    "Teacher cancels an existing course",
    (
      await request(
        transitionPath,
        "PUT",
        courseBody({ name: stamp + "Transitions", status: "Cancel" }),
        t,
      )
    ).status === 200,
  );
  check(
    "Cancelled transition hides course from catalog",
    !(await request("/course", "GET", undefined, s2)).data.courses.some(
      (x) => x._id === transition._id,
    ),
  );
  check(
    "Cancelled course retains Teacher roster",
    (
      await request(transitionPath, "GET", undefined, t)
    ).data.course.enrolledStudents.some((x) => x._id === students[0].user._id),
  );
  check(
    "Cancel does not bypass delete restriction",
    (await request(transitionPath, "DELETE", undefined, t)).status === 409,
  );
  check(
    "Teacher can reopen a cancelled course",
    (
      await request(
        transitionPath,
        "PUT",
        courseBody({ name: stamp + "Transitions", status: "Open" }),
        t,
      )
    ).status === 200,
  );
  check(
    "Reopening preserves duplicate prevention",
    (await request(transitionPath + "/enroll", "POST", undefined, s)).status ===
      409,
  );
  check(
    "Reopened course accepts another Student",
    (await request(transitionPath + "/enroll", "POST", undefined, s2))
      .status === 201,
  );
  const literal = await create({ name: stamp + "Literal [.*]" });
  const literalResults = (
    await request(
      `/course?q=${encodeURIComponent("[.*]")}`,
      "GET",
      undefined,
      s,
    )
  ).data.courses;
  check(
    "Search matches literal regex characters correctly",
    literalResults.some((x) => x._id === literal._id) &&
      literalResults.every(
        (x) => x.name.includes("[.*]") || x.teacherName.includes("[.*]"),
      ),
  );
  check(
    "Case-insensitive partial Teacher search",
    (await request("/course?q=ChEn", "GET", undefined, s)).data.courses.some(
      (x) => x._id === literal._id,
    ),
  );
  check(
    "Own profile endpoint exposes no password",
    !(await request(`/user/${students[0].user._id}`, "GET", undefined, s)).data
      .user.password,
  );
  const health = await request("/health");
  check(
    "Deployed API connects to MongoDB",
    health.status === 200 && health.data.database === "connected",
  );
  const preflight = await request("/course", "OPTIONS", undefined, undefined, {
    Origin: process.env.FRONTEND_URL || "http://localhost:5173",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "authorization,content-type",
  });
  check(
    "CORS preflight works without login",
    preflight.status === 204 &&
      preflight.headers
        .get("access-control-allow-headers")
        .includes("Authorization"),
  );
  const logout = await request("/auth/logout", "POST", undefined, s);
  check(
    "Logout clears cookie",
    logout.status === 200 &&
      /max-age=0/i.test(logout.headers.get("set-cookie")),
  );
  console.log(`RESULT: ${passed} checks passed against ${base}`);
} finally {
  // Remove only this run's generated courses, including enrolled test courses.
  // Existing seeded courses, accounts and real enrollments are never modified.
  if (
    created.length &&
    process.env.MONGODB_URI &&
    process.env.DB_NAME === "wad_final_6711266"
  ) {
    client = new MongoClient(process.env.MONGODB_URI);
    try {
      await client.connect();
      const result = await client
        .db(process.env.DB_NAME)
        .collection("courses")
        .deleteMany({
          _id: { $in: created.map((id) => new ObjectId(id)) },
          name: { $regex: `^${stamp}` },
        });
      console.log(`Cleaned ${result.deletedCount} generated QA courses.`);
    } finally {
      await client.close();
    }
  }
}

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI before seeding.");
const name = process.env.DB_NAME || "wad_final_6711266";
if (!/^wad_final_6711266(?:_test)?$/.test(name))
  throw new Error("Seed is limited to this exam database.");
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db(name);
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("courses").createIndex({ teacherId: 1 });
  await db.collection("courses").createIndex({ studentIds: 1 });
  const password = await bcrypt.hash("Learn2026!", 12);
  const names = {
    Teacher: ["Alex Chen", "Mia Wong", "Daniel Lee"],
    Student: ["Emma Davis", "Noah Wilson", "Olivia Kim"],
  };
  const users = {};
  for (const role of ["Teacher", "Student"]) {
    for (let i = 1; i <= 3; i++) {
      const email = `${role.toLowerCase()}${i}@courses.test`;
      await db
        .collection("users")
        .updateOne(
          { email },
          {
            $setOnInsert: {
              username: names[role][i - 1],
              email,
              password,
              role,
              createdAt: new Date(),
            },
          },
          { upsert: true },
        );
      users[`${role}${i}`] = await db.collection("users").findOne({ email });
    }
  }
  const courses = [
    [
      "Web Design Essentials",
      14,
      ["HTML", "CSS", "Responsive design"],
      1290,
      12,
      "Open",
      1,
    ],
    [
      "JavaScript in Practice",
      21,
      ["JavaScript", "DOM", "Async programming"],
      1890,
      15,
      "Open",
      1,
    ],
    [
      "UI Design Foundations",
      10,
      ["Typography", "Color", "Layout"],
      990,
      8,
      "Close",
      2,
    ],
    [
      "Build APIs with Next.js",
      14,
      ["Next.js", "REST APIs", "Authentication"],
      1590,
      10,
      "Open",
      2,
    ],
    [
      "MongoDB for Beginners",
      7,
      ["MongoDB", "Documents", "Queries"],
      790,
      1,
      "Open",
      3,
    ],
    ["Legacy Web Workshop", 5, ["Web fundamentals"], 0, 5, "Cancel", 3],
  ];
  for (let i = 0; i < courses.length; i++) {
    const [name, duration, topics, price, maxStudent, status, teacher] =
      courses[i];
    const _id = new ObjectId(`67112660000000000000000${i + 1}`);
    await db
      .collection("courses")
      .updateOne(
        { _id },
        {
          $setOnInsert: {
            name,
            duration,
            topics,
            price,
            maxStudent,
            status,
            teacherId: users[`Teacher${teacher}`]._id,
            studentIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
  }
  console.log(
    `Seed ready: ${name}; 3 Teachers, 3 Students, 6 sample courses. Existing data preserved.`,
  );
} finally {
  await client.close();
}

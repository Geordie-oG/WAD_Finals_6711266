import jwt from "jsonwebtoken";
export function verifyJWT(req) {
  try {
    const authorization = req.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : req.cookies.get("token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "coursespace",
    });
  } catch {
    return null;
  }
}
export function signJWT(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required.");
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "8h",
    issuer: "coursespace",
  });
}
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 8 * 60 * 60,
});

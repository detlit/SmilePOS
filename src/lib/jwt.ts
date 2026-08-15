import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "MY_SECRET";

export function signToken(payload: any) {
  return jwt.sign(payload, SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
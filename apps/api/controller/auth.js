import zxcvbn from "zxcvbn";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import jwt from "jsonwebtoken";

import reservedUsernames from "../misc/reserved-usernames.js";
import db from "../db/db.js";

const nanoid = customAlphabet(
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
);

export async function getUser(req, res) {
  const user = db
    .prepare("SELECT username FROM users WHERE jwt_sub = ?")
    .get(req.user.sub);

  res.json(user);
}

export async function logUserIn(req, res) {
  const { username, password } = req.validatedData;

  const existingUser = db
    .prepare("SELECT password_hash, jwt_sub FROM users WHERE username = ?")
    .get(username);
  if (existingUser) {
    if (await bcrypt.compare(password, existingUser.password_hash)) {
      const token = jwt.sign(
        { sub: existingUser.jwt_sub },
        process.env.JWT_SECRET,
        {
          algorithm: "HS256",
        },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: "Strict",
        maxAge: 2592000000, // one month
      });

      res.status(200).end();
    } else {
      res.status(401).end();
    }
  } else {
    res.status(401).end();
  }
}

export async function logUserOut(_, res) {
  res.clearCookie("token");
  res.status(204).end();
}

export async function registerUser(req, res) {
  const { username, password } = req.validatedData;
  if (reservedUsernames.includes(username)) {
    return res.status(409).end();
  }

  const existingUser = db
    .prepare("SELECT 1 FROM users WHERE username = ?")
    .get(username);
  if (existingUser) {
    return res.status(409).end();
  }

  const zxcvbnResult = zxcvbn(password);
  if (zxcvbnResult.score < 3) {
    let message = "The password is weak.";
    if (zxcvbnResult.feedback.warning) {
      message = `${message} ${zxcvbnResult.feedback.warning}.`;
    } else if (zxcvbnResult.feedback.suggestions.length > 0) {
      message = `${message} ${zxcvbnResult.feedback.suggestions[0]}`;
    }
    return res.status(400).end();
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const sub = nanoid();

  db.prepare(
    "INSERT INTO users (username, password_hash, jwt_sub) VALUES (?, ?, ?)",
  ).run(username, hashedPassword, sub);

  const token = jwt.sign({ sub }, process.env.JWT_SECRET, {
    algorithm: "HS256",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "Strict",
    maxAge: 2592000000, // one month
  });

  res.status(201).end();
}

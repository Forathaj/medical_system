/** @format */

import { parse } from "url";
import User from "../models/User.js";
import hashPassword from "../utils/hashPassword.js";
import jwt from "jsonwebtoken";

export const authRoutes = async (req, res, client) => {
  console.log("🔥 authRoutes.js loaded!"); // Check if the file is even loaded

  const db = client.db("medicalDB");
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  console.log("📡 Incoming request:", req.method, pathname); // Log incoming requests

  if (req.method === "POST" && pathname === "/auth/register") {
    console.log("✅ Register route reached!");

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      console.log("📦 Request body:", body);
      try {
        const { name, email, password } = JSON.parse(body);
        const userExists = await db.collection("users").findOne({ email });
        const hashedPassword = hashPassword(password);
        if (userExists) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "User already exists" }));
          return; // ✅ Ensure no more code runs after this
        }

        await User.createUser(db, { name, email, password: hashedPassword });
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User registered successfully" }));
      } catch (error) {
        console.error("Error registering user:", error);
        if (!res.headersSent) {
          // ✅ Ensure headers are only sent once
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Internal server error" }));
        }
      }
    });
  }
  if (req.method === "POST" && pathname === "/auth/login") {
    console.log("✅ Login route reached!");

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      const { email, password } = JSON.parse(body);
      console.log("📩 Received login data:", { email, password });

      // Find user by email
      const user = await User.findUserByEmail(db, email);
      if (!user || user.password !== hashPassword(password)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "Invalid email or password" })
        );
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ token }));
    });
  }
};

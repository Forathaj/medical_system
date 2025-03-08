/** @format */

import { Appointment } from "../models/appointment.js";
import { ObjectId } from "mongodb";
import { authMiddleware } from "../utils/authMiddleware.js";

export const appointmentRoutes = async (req, res, client) => {
  const db = client.db("medicalDB");
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // 👉 Book an appointment
  if (req.method === "POST" && pathname === "/appointments/book") {
    authMiddleware(req, res, async () => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        const { specialty, date, time } = JSON.parse(body);
        const userId = req.user.id;

        try {
          // Format date to YYYY-MM-DD (ignoring time for comparison)
          const appointmentDate = new Date(date).toISOString().split("T")[0];

          // Check for existing appointment with same specialty and date
          const existingAppointment = await db.collection("appointments").findOne({
            userId: new ObjectId(userId),
            specialty,
            date: { $regex: `^${appointmentDate}` }, // Match date only (ignore time)
          });

          if (existingAppointment) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "You have already booked this specialty on the selected date." }));
            return;
          }

          // Book the appointment
          const appointment = {
            userId: new ObjectId(userId),
            specialty,
            date,
            time,
            createdAt: new Date(),
          };

          await Appointment.createAppointment(db, appointment);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Appointment booked successfully" }));
        } catch (error) {
          console.error("Error booking appointment:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Failed to book appointment." }));
        }
      });
    });
  }

  // 👉 Get user's appointments
  if (req.method === "GET" && pathname.startsWith("/appointments/user")) {
    authMiddleware(req, res, async () => {
      const appointments = await Appointment.getAppointmentsByUserId(db, req.user.id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(appointments));
    });
  }

  // 👉 Cancel an appointment
  if (req.method === "DELETE" && pathname.startsWith("/appointments/cancel/")) {
    authMiddleware(req, res, async () => {
      const appointmentId = pathname.split("/").pop();
      await Appointment.deleteAppointment(db, new ObjectId(appointmentId));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Appointment canceled successfully" }));
    });
  }
};
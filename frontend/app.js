/** @format */

const bookForm = document.getElementById("bookForm");
const appointmentsList = document.getElementById("appointmentsList");

const token = localStorage.getItem("token"); // Get JWT token from local storage

// Redirect to login if not authenticated
if (!token) {
  window.location.href = "login.html";
}

// Book an appointment
bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const specialty = document.getElementById("specialty").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  try {
    const response = await fetch("http://localhost:5000/appointments/book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ specialty, date, time }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Appointment booked successfully!");
      fetchAppointments(); // Refresh appointments
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Error booking appointment:", err);
    alert("Failed to book appointment.");
  }
});

// Fetch and display appointments
async function fetchAppointments() {
  try {
    const response = await fetch("http://localhost:5000/appointments/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const appointments = await response.json();

    appointmentsList.innerHTML = appointments
      .map(
        (app) => `
            <li>
                ${app.specialty} - ${app.date} at ${app.time}
                <button onclick="cancelAppointment('${app._id}')">Cancel</button>
            </li>
        `
      )
      .join("");
  } catch (err) {
    console.error("Error fetching appointments:", err);
  }
}

// Cancel an appointment
async function cancelAppointment(appointmentId) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    const response = await fetch(
      `http://localhost:5000/appointments/cancel/${appointmentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      alert("Appointment canceled successfully!");
      fetchAppointments(); // Refresh list
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error("Error canceling appointment:", err);
  }
}

// Fetch appointments when page loads
fetchAppointments();

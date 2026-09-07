const fs = require("fs");
const path = require("path");
const { getStore } = require("@netlify/blobs");

function loadSessions() {
  const dataPath = path.join(__dirname, "data", "sessions.json");
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let sessions;
  try {
    sessions = loadSessions();
  } catch (error) {
    console.error("Error reading sessions.json:", error);
    return { statusCode: 500, body: "Error loading session data." };
  }

  const store = getStore("session-bookings");

  try {
    const results = await Promise.all(
      sessions.map(async (session) => {
        // Individual (1:1) sessions don't have a shared capacity, they route
        // straight to a Google Calendar Appointment Schedule instead.
        if (session.type !== "class") {
          return session;
        }

        const record = await store.get(session.id, {
          type: "json",
          consistency: "strong",
        });

        const booked = record?.booked || 0;
        const seatsRemaining = Math.max(session.capacity - booked, 0);

        return {
          ...session,
          seatsRemaining,
          full: seatsRemaining === 0,
        };
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(results),
    };
  } catch (error) {
    console.error("Error building session availability:", error);
    return { statusCode: 500, body: "Error loading session availability." };
  }
};

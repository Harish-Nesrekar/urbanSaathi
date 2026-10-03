"use client";

import { useEffect, useState } from "react";

export default function CitizenDashboard() {
  const [message, setMessage] = useState("Loading...");
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("You are not logged in.");
      return;
    }

    const fetchProtectedData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/test/protected",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message);
          return;
        }

        setMessage(data.message);
        setUserId(data.user.id);
        setRole(data.user.role);
      } catch (error) {
        console.error("Dashboard error:", error);
        setMessage("Unable to connect to the server");
      }
    };

    fetchProtectedData();
  }, []);

  return (
    <main>
      <h1>UrbanSathi Citizen Dashboard</h1>

      <p>{message}</p>

      {userId && (
        <div>
          <p>User ID: {userId}</p>
          <p>Role: {role}</p>
        </div>
      )}
    </main>
  );
}
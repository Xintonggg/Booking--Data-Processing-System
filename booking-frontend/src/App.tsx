// src/App.tsx
import { useEffect, useState, type ChangeEvent } from "react";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

/** ---- Types from your Django API ---- */
export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string;
}

export interface BookingRow {
  id: string;
  staff_id: string;
  start: string; // ISO string from backend
  end: string;   // ISO string from backend
  customer_name: string;
  customer_phone: string;
  customer_email: string;
}

interface AvailabilityResp {
  start_iso: string;
  duration_min: number;
  available: Staff[];
}

interface BookingsResp {
  bookings: BookingRow[];
}

/** ---- Small helpers ---- */
const emailOk = (e: string) => /^\S+@\S+\.\S+$/.test(e);
const phoneOk = (p: string) => /^\+?\d[\d\s\-]{6,}$/.test(p);

export default function App() {
  // form state
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);

  // data state (typed!)
  const [available, setAvailable] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [msg, setMsg] = useState<string>("");

  const isoFromInputs = () => (date && time ? `${date}T${time}:00` : null);

  /** Query availability */
  const fetchAvailable = async () => {
    setMsg("");
    const start_iso = isoFromInputs();
    if (!start_iso) return setMsg("Pick date & time first.");

    const res = await fetch(`${API}/available-staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_iso, duration_min: Number(duration) }),
    });

    const data: AvailabilityResp = await res.json();
    if (!res.ok) return setMsg((data as any)?.detail ?? "Failed to get availability.");

    setAvailable(data.available); // typed as Staff[]
    setSelectedStaff("");
  };

  /** Submit a booking */
  const submitBooking = async () => {
    setMsg("");
    const start_iso = isoFromInputs();
    if (!start_iso) return setMsg("Pick date & time first.");
    if (!selectedStaff) return setMsg("Select a staff member.");
    if (!name.trim()) return setMsg("Name is required.");
    if (!phoneOk(phone)) return setMsg("Invalid phone.");
    if (!emailOk(email)) return setMsg("Invalid email.");

    const res = await fetch(`${API}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: selectedStaff,
        start_iso,
        duration_min: Number(duration),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMsg(`Booked! ID: ${data.booking_id}`);
      setAvailable([]);
      setSelectedStaff("");
      setName(""); setPhone(""); setEmail("");
      loadBookings();
    } else {
      setMsg(data?.detail ?? "Booking failed.");
    }
  };

  /** Load bookings table */
  const loadBookings = async () => {
    const res = await fetch(`${API}/bookings`);
    const data: BookingsResp = await res.json();
    if (res.ok) setBookings(data.bookings ?? []);
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  // typed change handlers (avoid implicit any)
  const onDurationChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDuration(Number(e.target.value));
  const onDateChange = (e: ChangeEvent<HTMLInputElement>) =>
    setDate(e.target.value);
  const onTimeChange = (e: ChangeEvent<HTMLInputElement>) =>
    setTime(e.target.value);

  return (
    <div style={{ maxWidth: 880, margin: "32px auto", fontFamily: "system-ui" }}>
      <h1>Booking Demo (Django + React + TS)</h1>

      {/* Time picker */}
      <section style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, marginBottom: 16 }}>
        <h2>Choose Time</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label>Date</label>
            <input type="date" value={date} onChange={onDateChange} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Time</label>
            <input type="time" value={time} onChange={onTimeChange} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Duration (min)</label>
            <input type="number" min={15} step={15} value={duration} onChange={onDurationChange} style={{ width: "100%" }} />
          </div>
        </div>
        <button onClick={fetchAvailable} style={{ marginTop: 12 }}>Find Available Staff</button>
      </section>

      {/* Available list */}
      <section style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, marginBottom: 16 }}>
        <h2>Available Staff</h2>
        {available.length === 0 ? <p>No staff yet. Pick a time and click “Find”.</p> : (
          <ul>
            {available.map((s) => (
              <li key={s.id} style={{ marginBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="radio"
                    name="staff"
                    value={s.id}
                    checked={selectedStaff === s.id}
                    onChange={() => setSelectedStaff(s.id)}
                  />
                  <span><b>{s.name}</b> — {s.skills} ({s.phone})</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Customer form */}
      <section style={{ padding: 16, border: "1px solid #eee", borderRadius: 12, marginBottom: 16 }}>
        <h2>Your Info</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>
        <button onClick={submitBooking} style={{ marginTop: 12 }}>Book</button>
        {msg && <div style={{ marginTop: 12, padding: 10, background: "#f6f6f6", borderRadius: 8 }}>{msg}</div>}
      </section>

      {/* Bookings table */}
      <section style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2>Existing Bookings</h2>
        <a href={`${API}/export/bookings-csv`} target="_blank" rel="noreferrer">Export CSV</a>
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <Th>ID</Th><Th>Staff</Th><Th>Start</Th><Th>End</Th>
                <Th>Name</Th><Th>Phone</Th><Th>Email</Th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <Td>{b.id}</Td>
                  <Td>{b.staff_id}</Td>
                  <Td>{b.start}</Td>
                  <Td>{b.end}</Td>
                  <Td>{b.customer_name}</Td>
                  <Td>{b.customer_phone}</Td>
                  <Td>{b.customer_email}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** tiny styled helpers */
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "6px 8px" }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ borderBottom: "1px solid #eee", padding: "6px 8px" }}>{children}</td>;
}

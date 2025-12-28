"use client";

import { useEffect, useState } from "react";

/* 🔒 Static weekly predictions */
const WEEKLY_PREDICTIONS = [
  { pid: "p1_1", question: "Will Ritual quietly ship something important this week?" },
  { pid: "p2_2", question: "Will decentralized intelligence feel more real by the end of this week?" },
  { pid: "p3_3", question: "Will Infernet prove it can scale beyond expectations this week?" },
  { pid: "p4_4", question: "Will builders take Ritual infrastructure more seriously after this week?" },
  { pid: "p5_5", question: "Will this week mark a meaningful step toward autonomous onchain intelligence?" },
  { pid: "p6_6", question: "Will Infernet return publicly or enter a new phase of availability in January?" },
];

/* 🔔 Toast */
function Toast({ message }) {
  if (!message) return null;
  return <div style={styles.toast}>{message}</div>;
}

/* 🔐 Auth Modal */
function AuthModal({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  submit,
  error,
  validationError,
  canSubmit,
}) {
  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modal}>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p style={styles.modalSub}>Ritual Prediction Market</p>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Password (min 6 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        {validationError && <p style={styles.error}>{validationError}</p>}
        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={submit}
          disabled={!canSubmit}
          style={{
            ...styles.primaryBtn,
            opacity: canSubmit ? 1 : 0.5,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {mode === "login" ? "Login" : "Sign up"}
        </button>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={styles.switchBtn}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [votes, setVotes] = useState({});
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  /* 🔁 Toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* 🔄 Initial votes + SSE */
  useEffect(() => {
      refreshUser();   
    fetchVotes();

    const es = new EventSource("/api/stream");
    es.onopen = () => {
  fetchVotes(); // 🔁 hard resync when SSE reconnects
};

   es.onmessage = (e) => {
  const data = JSON.parse(e.data);

  setVotes(prev => {
    const current = prev[data.pid];
    if (!current) return prev;

    // ignore stale updates
    if (current.yes === data.yes && current.no === data.no) {
      return prev;
    }

    return {
      ...prev,
      [data.pid]: {
        ...current,
        yes: data.yes,
        no: data.no,
        votes: data.votes ?? current.votes,
      },
    };
  });
};


    return () => es.close();
  }, []);

  async function refreshUser() {
    const res = await fetch("/api/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    } else {
      setUser(null);
    }
  }

  async function fetchVotes() {
    const res = await fetch("/api/predictions");
    const data = await res.json();
    const map = {};
    data.forEach((p) => (map[p.pid] = p));
    setVotes(map);
  }

  /* ✅ Frontend validation */
  useEffect(() => {
    if (!email.includes("@")) {
      setValidationError("Email must contain @");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }
    setValidationError("");
  }, [email, password]);

  const canSubmit = !validationError && email && password;

  async function submitAuth() {
    if (!canSubmit) return;

    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Authentication failed");
      return;
    }

    setEmail("");
    setPassword("");
    setToast(mode === "signup" ? "Account created 🎉" : "Logged in ✅");
    await refreshUser();
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setToast("Logged out");
  }

  async function vote(pid, choice) {
    if (!user) return;

    setVotes((prev) => {
      const current = prev[pid] ?? { pid, yes: 0, no: 0, votes: [] };
      const votesArr = current.votes.map((v) => ({ ...v }));

      const existing = votesArr.find((v) => v.userId === user._id);
      let yes = current.yes;
      let no = current.no;

      if (!existing) {
        votesArr.push({ userId: user._id, choice });
        choice === "YES" ? yes++ : no++;
      } else if (existing.choice !== choice) {
        existing.choice === "YES" ? yes-- : no--;
        choice === "YES" ? yes++ : no++;
        existing.choice = choice;
      } else {
        return prev;
      }

      return {
        ...prev,
        [pid]: { ...current, yes, no, votes: votesArr },
      };
    });

    await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pid, choice }),
    });
  }

  return (
    <main style={styles.page}>
  <header style={styles.header}>
  <div style={styles.brandWrap}>
    <img src="/logo.png" alt="Ritual" style={styles.logo} />
    <div>
      <h1 style={styles.title}>Ritual Prediction Market</h1>
      <p style={styles.subtitle}>Collective intelligence, live</p>
    </div>
  </div>

  {user && (
    <div style={styles.userBox}>
      <span style={styles.email} title={user.email}>
        {user.email}
      </span>
      <button onClick={logout} style={styles.logoutBtn}>
        Logout
      </button>
    </div>
  )}
</header>


      {!user && (
        <AuthModal
          mode={mode}
          setMode={setMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          submit={submitAuth}
          error={error}
          validationError={validationError}
          canSubmit={canSubmit}
        />
      )}

      {user && (
        <section style={styles.grid}>
          {WEEKLY_PREDICTIONS.map((p) => {
            const v = votes[p.pid] || { yes: 0, no: 0 };
            const total = v.yes + v.no || 1;
            const yesPct = Math.round((v.yes / total) * 100);
            const noPct = 100 - yesPct;

            return (
              <div key={p.pid} style={styles.card}>
                <h3 style={styles.question}>{p.question}</h3>

                <div style={styles.voteRow}>
                  <button onClick={() => vote(p.pid, "YES")} style={styles.yesBtn}>YES</button>
                  <button onClick={() => vote(p.pid, "NO")} style={styles.noBtn}>NO</button>
                </div>

                <div style={styles.bar}>
                  <div style={{ ...styles.barYes, width: `${yesPct}%` }} />
                  <div style={{ ...styles.barNo, width: `${noPct}%` }} />
                </div>

                <div style={styles.meta}>
                  <span>YES {yesPct}%</span>
                  <span>NO {noPct}%</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <Toast message={toast} />
    </main>
  );
}

/* 🎨 Styles (unchanged background) */
const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 500px at top, #161616, #0a0a0a)",
    color: "#eaeaea",
    padding: "32px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
header: {
  maxWidth: 1000,
  margin: "0 auto 32px",
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  justifyContent: "space-between",
  alignItems: "center",
},
brandWrap: {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flex: "1 1 260px",
},

logo: {
  width: 38,
  flexShrink: 0,
},
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subtitle: { margin: 0, fontSize: 13, color: "#9a9a9a" },
  grid: {
    maxWidth: 1000,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  question: { margin: 0, fontSize: 16, fontWeight: 500 },
  voteRow: { display: "flex", gap: 12 },
  yesBtn: { flex: 1, background: "#1f7a4a", border: "none", borderRadius: 14, padding: "12px 0", color: "#fff", fontWeight: 600 },
  noBtn: { flex: 1, background: "#7a1f1f", border: "none", borderRadius: 14, padding: "12px 0", color: "#fff", fontWeight: 600 },
  bar: { height: 12, background: "#1f1f1f", borderRadius: 8, overflow: "hidden", display: "flex" },
  barYes: { background: "#1f7a4a", transition: "width 0.4s ease" },
  barNo: { background: "#7a1f1f", transition: "width 0.4s ease" },
  meta: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9a9a9a" },
  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  modal: { background: "#121212", border: "1px solid #1f1f1f", borderRadius: 20, padding: 28, width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 },
  modalSub: { fontSize: 13, color: "#9a9a9a" },
  input: { background: "#0e0e0e", border: "1px solid #222", borderRadius: 12, padding: "10px 12px", color: "#fff" },
  primaryBtn: { background: "#fff", color: "#000", borderRadius: 14, padding: "10px", fontWeight: 600 },
  switchBtn: { background: "none", border: "none", color: "#9a9a9a", fontSize: 12 },
userBox: {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  flex: "1 1 220px",
},

email: {
  fontSize: 12,
  color: "#9a9a9a",
  maxWidth: 160,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
},

logoutBtn: {
  background: "#1f1f1f",
  border: "1px solid #333",
  borderRadius: 12,
  padding: "6px 12px",
  color: "#fff",
  cursor: "pointer",
  whiteSpace: "nowrap",
},
  logoutBtn: { background: "#1f1f1f", border: "1px solid #333", borderRadius: 12, padding: "6px 12px", color: "#fff" },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1f7a4a", color: "#fff", padding: "10px 18px", borderRadius: 14 },
  error: { color: "#ff6b6b", fontSize: 13 },
};

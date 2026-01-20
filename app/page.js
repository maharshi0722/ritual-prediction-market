"use client";

import { useEffect, useState, useRef } from "react";

/* 🔒 Static weekly predictions */
const WEEKLY_PREDICTIONS = [
  { pid: "01", question: "Ritualist stronger than Ritty?", yesLabel: "Yes - Ritualist", noLabel: "No - Ritty" },
  { pid: "02", question: "Ritty stronger than Ritty Bitty?", yesLabel: "Yes - Ritty", noLabel: "No - Ritty Bitty" },
  { pid: "03", question: "NPC stronger than Dunce?", yesLabel: "Yes - NPC", noLabel: "No - Dunce" },
  { pid: "04", question: "Zealot stronger than Mage?", yesLabel: "Yes - Zealot", noLabel: "No - Mage" },
  { pid: "05", question: "Ritty bitty stronger than Ascendant?", yesLabel: "Yes - Ritty Bitty", noLabel: "No - Ascendant" },
  { pid: "06", question: "Cursed stronger than Harmonic?", yesLabel: "Yes - Cursed", noLabel: "No - Harmonic" },
  { pid: "07", question: "Community stronger than Ritualist?", yesLabel: "Yes - Community", noLabel: "No - Ritualist" },
  
];



/* 🔔 Toast */
function Toast({ message }) {
  if (!message) return null;
  return <div className="toast" style={styles.toast}>{message}</div>;
}

/* 🔐 Auth Modal */
function AuthModal({
  mode, setMode,
  email, setEmail,
  password, setPassword,
  username, setUsername,
  confirmPassword, setConfirmPassword,
  submit, error, validationError, canSubmit,
  authSubmitting,
}) {
  return (
    <div style={styles.modalBackdrop}>
      <div style={styles.modal}>
        <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <p style={styles.modalSub}>Ritual Market Place</p>

        {mode === "signup" && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        )}

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

        {mode === "signup" && (
          <input
            placeholder="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
          />
        )}

        {validationError && <p style={styles.error}>{validationError}</p>}
        {error && <p style={styles.error}>{error}</p>}
<button
  onClick={submit}
  disabled={!canSubmit || authSubmitting}
  style={{
    ...styles.primaryBtn,
    opacity: !canSubmit || authSubmitting ? 0.6 : 1,
    cursor: authSubmitting ? "not-allowed" : "pointer",
  }}
>
  {authSubmitting && <span className="auth-spinner" />}
  {authSubmitting
    ? mode === "login"
      ? "Logging in…"
      : "Creating account…"
    : mode === "login"
    ? "Login"
    : "Sign up"}
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

/* ------------------------- Main Component ------------------------- */
export default function Home() {
  const [votingPid, setVotingPid] = useState(null);
const [voting, setVoting] = useState(null);
// { pid: string, choice: "YES" | "NO" } | null

  const [votes, setVotes] = useState({});
  const [user, setUser] = useState(null);
const [authSubmitting, setAuthSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("login");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const [nextClaimAt, setNextClaimAt] = useState(null); // timestamp in ms
  const [now, setNow] = useState(Date.now()); // drives countdown updates
const [authLoading, setAuthLoading] = useState(true);

  // animation states
  const [faucetPulse, setFaucetPulse] = useState(false);
  const [creditsPop, setCreditsPop] = useState(false);

  const prevCreditsRef = useRef(0);

  // views: "market" | "history" | "leaderboard"
  const [view, setView] = useState("market");

  // history & leaderboard state
  const [history, setHistory] = useState([]); // [{ type, amount, pid, choice, createdAt }]
  const [leaderboard, setLeaderboard] = useState([]); // [{ username, votes, rank }]

  /* 🔁 Toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* 🔄 Initial votes + SSE + pulls */
  useEffect(() => {
    refreshUser();
    fetchVotes();

    const es = new EventSource("/api/stream");
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setVotes((prev) => ({
        ...prev,
        [data.pid]: { ...prev[data.pid], ...data },
      }));
    };

    return () => es.close();
  }, []);

  /* -------------------- Data fetchers -------------------- */
 async function refreshUser() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });

    if (!res.ok) {
      setUser(null);
      setNextClaimAt(null);
      return;
    }

    const data = await res.json();
    if (!data.user) {
      setUser(null);
      setNextClaimAt(null);
      return;
    }

    const u = data.user;
    prevCreditsRef.current = u.credits ?? 0;
    setUser(u);

    if (u.lastFaucetClaim) {
      const last = new Date(u.lastFaucetClaim).getTime();
      const next = last + 24 * 60 * 60 * 1000;
      setNextClaimAt(Date.now() < next ? next : null);
    } else {
      setNextClaimAt(null);
    }

    fetchHistory();
    fetchLeaderboard();
  } finally {
    // 🔑 THIS IS THE FIX
    setAuthLoading(false);
  }
}


  async function fetchVotes() {
    const res = await fetch("/api/predictions");
    if (!res.ok) return;
    const data = await res.json();
    const map = {};
    data.forEach((p) => (map[p.pid] = p));
    setVotes(map);
  }

  // fetch user history (GET /api/history)
  async function fetchHistory(global = false, limit = 50, skip = 0) {
    try {
      const params = new URLSearchParams();
      if (global) params.set("global", "true");
      params.set("limit", String(limit));
      params.set("skip", String(skip));

      const url = `/api/history?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        // helpful debug message
        const txt = await res.text();
        console.error("fetchHistory failed:", res.status, txt);
        if (res.status === 401) {
          setToast("Login to view your history");
        }
        setHistory([]);
        return;
      }

      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("fetchHistory error:", err);
      setHistory([]);
    }
  }

  // fetch leaderboard (GET /api/leaderboard) — server now returns votes-count leaderboard
  async function fetchLeaderboard(limit = 50) {
    try {
      const res = await fetch(`/api/leaderboard?limit=${limit}`);
      if (!res.ok) {
        console.error("fetchLeaderboard failed:", res.status, await res.text());
        setLeaderboard([]);
        return;
      }
      const data = await res.json();
      // server should return items with `votes` field for active-votes leaderboard
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("fetchLeaderboard error:", err);
      setLeaderboard([]);
    }
  }

  /* -------------------- Form / auth -------------------- */
  useEffect(() => {
    if (!email.includes("@")) return setValidationError("Email must contain @");
    if (password.length < 6) return setValidationError("Password must be at least 6 characters");
    if (mode === "signup" && password !== confirmPassword)
      return setValidationError("Passwords do not match");
    setValidationError("");
  }, [email, password, confirmPassword, mode]);

  const canSubmit = !validationError && email && password;

async function submitAuth() {
  if (!canSubmit || authSubmitting) return;

  setError("");
  setAuthSubmitting(true);

  try {
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(
        mode === "signup"
          ? { email, password, confirmPassword, username }
          : { email, password }
      ),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Authentication failed");
      return;
    }

    setToast(mode === "signup" ? "Account created 🎉" : "Logged in ✅");
    await refreshUser();
  } catch {
    setError("Network error. Try again.");
  } finally {
    setAuthSubmitting(false);
  }
    fetchHistory();
    fetchLeaderboard();
}


  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setNextClaimAt(null);
  }

  /* -------------------- Voting -------------------- */
  async function vote(pid, choice) {
    if (!user) return;
    if (votingPid === pid) return;

    setVotingPid(pid);
  setVoting({ pid, choice });
    // optimistic update
    setVotes(prev => {
      const cur = prev[pid];
      if (!cur) return prev;

      const existing = cur.votes?.find(v => v.userId === user._id);
      let yes = cur.yes;
      let no = cur.no;
      let votesArr = [...(cur.votes || [])];

      if (!existing) {
        votesArr.push({ userId: user._id, choice });
        choice === "YES" ? yes++ : no++;
      } else if (existing.choice !== choice) {
        votesArr = votesArr.map(v => {
          if (v.userId !== user._id) return v;
          v.choice === "YES" ? yes-- : no--;
          choice === "YES" ? yes++ : no++;
          return { ...v, choice };
        });
      }

      return {
        ...prev,
        [pid]: { ...cur, yes, no, votes: votesArr },
      };
    });

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pid, choice }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast(data.error || "Vote failed");
        fetchVotes(); // rollback
        return;
      }

      if (data.credits !== undefined) {
        setUser(u => ({ ...u, credits: data.credits }));
        setCreditsPop(true);
        setTimeout(() => setCreditsPop(false), 600);
      }

      fetchHistory();
      fetchLeaderboard();
    } finally {
      setVotingPid(null);
       setVoting(null); 
    }
  }


  async function removeVote(pid) {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pid, remove: true }),
    });

    const data = await res.json();
    if (!res.ok) return setToast("Failed to remove vote");

    if (data.credits !== undefined) {
      prevCreditsRef.current = user?.credits ?? prevCreditsRef.current;
      setUser((u) => ({ ...u, credits: data.credits }));
      setCreditsPop(true);
      setTimeout(() => setCreditsPop(false), 600);
      fetchHistory();
      fetchLeaderboard();
    }
  }

  /* -------------------- Faucet -------------------- */
  async function claimFaucet() {
    const res = await fetch("/api/faucet", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.remainingMs) {
        setNextClaimAt(Date.now() + data.remainingMs);
      }
      return setToast("Already claimed");
    }

    prevCreditsRef.current = user?.credits ?? prevCreditsRef.current;
    setUser((u) => ({
      ...u,
      credits: data.credits,
      lastFaucetClaim:
        data.lastFaucetClaim ||
        (data.nextClaimAt ? new Date(data.nextClaimAt).getTime() - 24 * 60 * 60 * 1000 : Date.now()),
    }));

    if (data.nextClaimAt) {
      const next = typeof data.nextClaimAt === "number" ? data.nextClaimAt : new Date(data.nextClaimAt).getTime();
      setNextClaimAt(next);
    } else if (data.remainingMs) {
      setNextClaimAt(Date.now() + data.remainingMs);
    }

    setFaucetPulse(true);
    setCreditsPop(true);
    setToast("+10 credits claimed");
    setTimeout(() => setFaucetPulse(false), 900);
    setTimeout(() => setCreditsPop(false), 700);

    fetchHistory();
    fetchLeaderboard();
  }
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 640);
  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);


  /* -------------------- Countdown tick -------------------- */
  useEffect(() => {
    if (!nextClaimAt) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [nextClaimAt]);

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0")
    );
  }

  const remainingMs = nextClaimAt ? Math.max(0, nextClaimAt - now) : 0;

  /* -------------------- Render helpers -------------------- */
  function renderHistory() {
    if (!history.length) return <div style={styles.empty}>No history yet.</div>;
    return (
      <div style={styles.historyList}>
        {history.map((h, i) => (
          <div key={i} style={styles.historyItem} className="history-item">
            <div style={styles.historyLeft}>
              <div style={styles.historyType}>
                {h.type === "faucet" ? "Faucet" : h.type === "vote" ? "Vote" : h.type === "remove_vote" ? "Removed vote" : "Changed vote"}
              </div>
              <div style={styles.historyMeta}>
                {h.pid ? `${h.pid}${h.choice ? ` · ${h.choice}` : ""}` : ""}
              </div>
            </div>
            <div style={styles.historyRight}>
              {h.amount ? <strong style={{ color: h.amount > 0 ? "#1f7a4a" : "#eaeaea" }}>{h.amount > 0 ? `+${h.amount}` : h.amount}</strong> : null}
              <div style={styles.historyTime}>{new Date(h.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderLeaderboard() {
    if (!leaderboard.length) return <div style={styles.empty}>No leaderboard data.</div>;
    return (
      <div style={styles.leaderboardList}>
{leaderboard.map((u, i) => (
  <div key={i} style={styles.lbItem} className="lb-item">
    <div style={styles.lbLeft}>
      <div style={styles.lbRank}>#{u.rank ?? i + 1}</div>
      <div>
        <div style={styles.lbName}>{u.username}</div>
        {/* if username looks like a shortened id, show full id below */}
        {u.username && u.username.endsWith("…") ? (
          <div style={styles.lbSub}>{u.userId}</div>
        ) : (
          <div style={styles.lbSub}>{u.subtitle ?? ""}</div>
        )}
      </div>
    </div>
    <div style={styles.lbRight}>
      <div style={styles.lbCredits}>{u.votes ?? u.credits ?? 0}</div>
    </div>
  </div>
))}
      </div>
    );
  }
  if (authLoading) {
  return (
    <main style={styles.page}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9a9a9a",
          fontSize: 14,
        }}
      >
        Loading…
      </div>
    </main>
  );
}
/* 🔐 NOT LOGGED IN → NAVBAR + AUTH ONLY */
if (!user) {
  return (
    <main
      style={{
        ...styles.page,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* ✅ NAVBAR (brand + login button only) */}
      <header style={styles.header}>
        <div style={styles.brandWrap}>
          <img src="/logo.png" alt="Ritual" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Ritual Market Place</h1>
            <p style={styles.subtitle}>Collective intelligence, live</p>
          </div>
        </div>

    
      </header>

      {/* ✅ CENTER AUTH MODAL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AuthModal
          mode={mode}
          setMode={setMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          username={username}
          setUsername={setUsername}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          submit={submitAuth}
          error={error}
          validationError={validationError}
          canSubmit={canSubmit}
            authSubmitting={authSubmitting}
        />
      </div>

      {/* ✅ FOOTER PINNED BOTTOM */}
      <footer
        style={{
          ...styles.footer,
          marginTop: 0,
          paddingBottom: 18,
        }}
      >
        Created by <span style={styles.footerName}>Maharshi</span>
      </footer>
    </main>
  );
}

  /* -------------------- Render -------------------- */
  return (
    <main style={styles.page}>
      {/* Inline animation CSS */}
      <style>{`
        .faucet-btn {
          transition: transform 180ms ease, box-shadow 180ms ease;
          will-change: transform, box-shadow;
        }
        .faucet-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 22px rgba(31,122,74,0.18);
        }
        .faucet-btn.pulse {
          animation: faucet-pulse 900ms cubic-bezier(.2,.9,.3,1);
        }
        @keyframes faucet-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(31,122,74,0.0); }
          40% { transform: scale(1.06); box-shadow: 0 10px 36px rgba(31,122,74,0.14); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(31,122,74,0.0); }
        }

        .toast {
          animation: toast-pop 320ms cubic-bezier(.2,.9,.3,1);
        }
        @keyframes toast-pop {
          from { transform: translateY(20px) scale(.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .credits-value {
          display: inline-block;
          transition: transform 260ms cubic-bezier(.2,.9,.3,1), color 160ms;
          transform-origin: center;
        }
        .credits-value.pop {
          transform: scale(1.18);
          color: #ffffff;
        }

        .bar-yes, .bar-no {
          transition: width 700ms cubic-bezier(.2,.9,.3,1);
        }

        .card {
          transition: transform 220ms ease, box-shadow 220ms ease, opacity 180ms;
        }
        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.35);
        }
.auth-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #000;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

        .view-panel {
          animation: view-fade 260ms ease;
        }
        @keyframes view-fade {
          from { opacity: 0.0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .history-item, .lb-item {
          transition: transform 180ms cubic-bezier(.2,.9,.3,1), box-shadow 180ms;
        }
        .history-item:hover, .lb-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.32);
        }
      `}</style>

      {/* HEADER */}
 <header
  style={{
    ...styles.header,
    flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    gap: isMobile ? 14 : 12,
  }}
>

        <div style={styles.brandWrap}>
          <img src="/logo.png" alt="Ritual" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Ritual Market Place</h1>
            <p style={styles.subtitle}>Collective intelligence, live</p>
          </div>
        </div>

        {/* NAV / user controls */}
  <div
  style={{
    ...styles.rightControls,
    width: isMobile ? "100%" : "auto",
    justifyContent: isMobile ? "space-between" : "flex-end",
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: isMobile ? 8 : 12,
  }}
>

          {/* view toggles */}
<div
  style={{
    ...styles.viewTabs,
    justifyContent: "center",
    width: "100%",
  }}
>


            <button
              onClick={() => setView("market")}
              style={{ ...styles.tabBtn, ...(view === "market" ? styles.tabActive : {}) }}
            >
              Market
            </button>
            <button
              onClick={() => {
                setView("history");
                fetchHistory();
              }}
              style={{ ...styles.tabBtn, ...(view === "history" ? styles.tabActive : {}) }}
            >
              History
            </button>
            <button
              onClick={() => {
                setView("leaderboard");
                fetchLeaderboard();
              }}
              style={{ ...styles.tabBtn, ...(view === "leaderboard" ? styles.tabActive : {}) }}
            >
              Leaderboard
            </button>
          </div>
<div
  style={{
    fontSize: 13,
    color: "#cfcfcf",
    textAlign: isMobile ? "center" : "left",
  }}
>
  Hi, <strong style={{ color: "#fff" }}>{user.username}</strong>
</div>

          {/* user box */}
          {user ? (
      <div
  style={{
    ...styles.userBox,
    width: isMobile ? "100%" : "auto",
    flexWrap: isMobile ? "wrap" : "nowrap",
        flexDirection: isMobile ? "column" : "row",
    alignItems: isMobile ? "stretch" : "center",
    gap: isMobile ? 8 : 10,
  }}
>

              <span style={styles.credits}>
                Credits: <strong className={`credits-value ${creditsPop ? "pop" : ""}`}>{user.credits ?? 0}</strong>
              </span>

              <button
                onClick={claimFaucet}
                disabled={remainingMs > 0}
                className={`faucet-btn ${faucetPulse ? "pulse" : ""}`}
                style={{
                  ...styles.faucetBtn,
                  opacity: remainingMs > 0 ? 0.6 : 1,
                  width: isMobile ? "100%" : "auto",
  padding: isMobile ? "12px" : "6px 10px",
                }}
              >
                {remainingMs > 0 ? formatTime(remainingMs) : "+10 Faucet"}
              </button>

              <button onClick={logout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setMode("login")}
                style={{ ...styles.primaryBtn, padding: "8px 12px", fontSize: 13 }}
              >
                Login / Sign up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEW */}
      <section style={styles.container}>
        {view === "market" && (
          <div className="view-panel">
     <div
  style={{
    ...styles.grid,
    gridTemplateColumns: isMobile ? "1fr" : styles.grid.gridTemplateColumns,
  }}
>

              {WEEKLY_PREDICTIONS.map((p) => {
                const v = votes[p.pid] || { yes: 0, no: 0, votes: [] };
                const myVote = v.votes?.find(vt => vt.userId === user?._id)?.choice;
                const total = v.yes + v.no || 1;
                const yesPct = Math.round((v.yes / total) * 100);
                const noPct = 100 - yesPct;

                return (
                  <div key={p.pid} style={styles.card} className="card">
                    <div style={styles.questionWrap}>
                      <h3 style={styles.question}>{p.question}</h3>
                    </div>

                    <div style={styles.voteRow}>
                  <button
  disabled={voting?.pid === p.pid}
  onClick={() => vote(p.pid, "YES")}
  style={{
    ...styles.yesBtn,
    opacity: voting?.pid === p.pid ? 0.6 : 1,
    background:
      myVote === "YES"
        ? "#1f7a4a"
        : "rgba(31,122,74,0.35)",
  }}
>
  {voting?.pid === p.pid && voting?.choice === "YES" ? (
    <span className="auth-spinner" />
  ) : (
    p.yesLabel || "YES"
  )}
</button>



<button
  disabled={voting?.pid === p.pid}
  onClick={() => vote(p.pid, "NO")}
  style={{
    ...styles.noBtn,
    opacity: voting?.pid === p.pid ? 0.6 : 1,
    background:
      myVote === "NO"
        ? "#7a1f1f"
        : "rgba(122,31,31,0.35)",
  }}
>
  {voting?.pid === p.pid && voting?.choice === "NO" ? (
    <span className="auth-spinner" />
  ) : (
    p.noLabel || "NO"
  )}
</button>



                    </div>

                    <div style={styles.removeVoteWrap}>
                      {myVote && (
                        <button
                          onClick={() => removeVote(p.pid)}
                          style={styles.removeVote}
                        >
                          Remove vote
                        </button>
                      )}
                    </div>

                    <div style={styles.bar}>
                      <div className="bar-yes" style={{ ...styles.barYes, width: `${yesPct}%` }} />
                      <div className="bar-no" style={{ ...styles.barNo, width: `${noPct}%` }} />
                    </div>

                    <div style={styles.meta}>
                      <span>YES {yesPct}%</span>
                      <span>NO {noPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "history" && (
          <div className="view-panel">
            <h2 style={styles.sectionTitle}>Your activity</h2>
            <p style={styles.sectionSub}>Recent faucet claims, votes and refunds</p>
            {renderHistory()}
          </div>
        )}

        {view === "leaderboard" && (
          <div className="view-panel">
            <h2 style={styles.sectionTitle}>Leaderboard</h2>
            <p style={styles.sectionSub}>Top contributors by votes</p>
            {renderLeaderboard()}
          </div>
        )}
      </section>

      {!user && (
        <AuthModal
          mode={mode}
          setMode={setMode}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          username={username}
          setUsername={setUsername}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          submit={submitAuth}
          error={error}
          validationError={validationError}
          canSubmit={canSubmit}
        />
      )}

      <Toast message={toast} />

      <footer style={styles.footer}>
        Created by <span style={styles.footerName}>Maharshi</span>
      </footer>
    </main>
  );
}

/* ------------------------- Styles ------------------------- */
const styles = {
  
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 500px at top, #161616, #0a0a0a)",
    color: "#eaeaea",
    padding: "28px 16px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    maxWidth: 1100,
    margin: "0 auto 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  brandWrap: { display: "flex", gap: 12, alignItems: "center" },
  logo: { width: 50,  },
  title: { margin: 0, fontSize: 20 },
  subtitle: { margin: 0, fontSize: 12, color: "#9a9a9a" },

  rightControls: { display: "flex", gap: 12, alignItems: "center" },
  viewTabs: { display: "flex", gap: 6, alignItems: "center", marginRight: 8 },
  tabBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#cfcfcf",
    padding: "6px 12px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  tabActive: {
    background: "linear-gradient(180deg,#243922,#163d20)",
    border: "1px solid rgba(31,122,74,0.45)",
    color: "#fff",
  },

  userBox: { display: "flex", gap: 10, alignItems: "center" },
  credits: { fontSize: 14, color: "#9a9a9a" },

  faucetBtn: {
    background: "#1f7a4a",
    border: "none",
    borderRadius: 10,
    padding: "6px 10px",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
  },

  logoutBtn: {
    background: "#1f1f1f",
    border: "1px solid #333",
    borderRadius: 10,
    padding: "6px 10px",
    color: "#fff",
    cursor: "pointer",
  },

  container: {
    maxWidth: 1100,
    margin: "0 auto",
    paddingTop: 6,
  },

  /* Market grid */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  voteRow: { display: "flex", gap: 12 },
  yesBtn: { flex: 1, padding: 12, borderRadius: 14, color: "#fff", cursor: "pointer", border: "none" },
  noBtn: { flex: 1, padding: 12, borderRadius: 14, color: "#fff", cursor: "pointer", border: "none" },

  removeVote: {
    fontSize: 12,
    opacity: 0.8,
    background: "none",
    border: "none",
    color: "#9a9a9a",
    cursor: "pointer",
    padding: 0,
    lineHeight: "18px",
    textAlign: "center",
    width: "100%",
  },

  bar: { height: 12, background: "#111", borderRadius: 8, overflow: "hidden", display: "flex" },
  barYes: { background: "#1f7a4a", height: "100%" },
  barNo: { background: "#7a1f1f", height: "100%" },
  meta: { display: "flex", justifyContent: "space-between", fontSize: 12 },

  /* History */
  sectionTitle: { margin: "12px 0 4px", fontSize: 18 },
  sectionSub: { margin: "0 0 12px", color: "#9a9a9a", fontSize: 13 },

  historyList: { display: "flex", flexDirection: "column", gap: 10 },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.03)",
    alignItems: "center",
  },
  historyLeft: { display: "flex", flexDirection: "column" },
  historyType: { fontSize: 13, fontWeight: 600 },
  historyMeta: { fontSize: 12, color: "#9a9a9a" },
  historyRight: { textAlign: "right", display: "flex", flexDirection: "column", gap: 4 },
  historyTime: { fontSize: 11, color: "#8f8f8f" },

  /* Leaderboard */
  leaderboardList: { display: "flex", flexDirection: "column", gap: 10 },
  lbItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
    border: "1px solid rgba(255,255,255,0.03)",
    alignItems: "center",
  },
  lbLeft: { display: "flex", gap: 12, alignItems: "center" },
  lbRank: { width: 44, textAlign: "center", fontWeight: 700, color: "#cfcfcf" },
  lbName: { fontWeight: 600 },
  lbSub: { fontSize: 12, color: "#9a9a9a" },
  lbRight: { textAlign: "right" },
  lbCredits: { fontWeight: 800, color: "#fff" },

  empty: { color: "#9a9a9a", padding: 14 },

  footer: { marginTop: 40, textAlign: "center", color: "#9a9a9a" },
  footerName: { color: "#eaeaea", fontWeight: 600 },

  toast: {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1f7a4a",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 14,
    zIndex: 60,
  },

  error: { color: "#ff6b6b" },

  removeVoteWrap: {
    height: 18,
    marginTop: 6,
    display: "flex",
    alignItems: "center",
  },

  questionWrap: { minHeight: 75, display: "flex", alignItems: "flex-start" },
  question: { margin: 0, fontSize: 15, fontWeight: 600, lineHeight: "1.4" },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  modal: {
    background: "#121212",
    border: "1px solid #1f1f1f",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  input: {
    background: "#0e0e0e",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "10px 12px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  primaryBtn: {
    background: "#ffffff",
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "10px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },

};

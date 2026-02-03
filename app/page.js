"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* -------------------- Static weekly predictions (fallback) -------------------- */

const WEEKLY_PREDICTIONS = [
  // 🛡️ Moderators
  {
   pid: "201",
  question: "Will this week’s Ritual Academy session be high-signal?",
  yesLabel: "High signal",
},
    {
    pid: "202",
    question: "Bunsdev vs Elif Hilal Kara — who’s your favorite Ritual developer?",
    yesLabel: "Bunsdev",
    noLabel: "Elif Hilal Kara",
  },
  {
    pid: "203",
    question: "Stefan vs Dunken — who’s been more consistent as a moderator?",
    yesLabel: "Stefan",
    noLabel: "Dunken",
  },

  // 🏗️ Builders
  {
    pid: "204",
    question: "Meison vs Maharshi — who’s shipping better builder work?",
    yesLabel: "Meison",
    noLabel: "Maharshi",
  },
  {
    
    pid: "205",
    question:
     "Tanoy vs Elijah — who’s the stronger builder right now?",
    yesLabel: "Tanoy",
    noLabel: "Elijah",
  },

  // 😂 Memes
  {
    pid: "206",
    question: "Moctx vs Oahid — who’s dropping better memes?",
    yesLabel: "Moctx",
    noLabel: "Oahid",
  },

  // 🎨 Art
  {
    pid: "207",
    question: "Mathson vs Osaragi — who’s producing better art lately?",
    yesLabel: "Mathson",
    noLabel: "Osaragi",
  },
  {
    pid: "208",
    question: "Gill vs Pixel — whose art is stronger overall?",
    yesLabel: "Gill",
    noLabel: "Pixel",
  },

  // ✍️ Content
  {
    pid: "209",
    question: "Maharshi vs G9D — who’s writing more valuable content?",
    yesLabel: "Maharshi",
    noLabel: "G9D",
  },

  // 💬 Chat
  {
    pid: "210",
    question: "JT vs Cass — who’s more active in chat?",
    yesLabel: "JT",
    noLabel: "Cass",
  },

  // 🧠 Ritual Dev Team (new pid range)
 
];

/* -------------------- Weekly Market Timer Helper -------------------- */
function getWeeklyMarketTimer() {
  const now = new Date();
  const currentDay = now.getDay();

  let daysUntilSaturday = (7 - currentDay + 7) % 7;
  if (daysUntilSaturday === 0 && now.getHours() >= 23 && now.getMinutes() >= 59) {
    daysUntilSaturday = 7;
  }

  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(23, 59, 59, 999);

  const remainingMs = Math.max(0, saturday.getTime() - now.getTime());
  const closed = remainingMs <= 0;

  return { remainingMs, closed };
}

function formatMarketTimer(ms) {
  if (ms <= 0) return "Closed";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/* -------------------- Toast Component -------------------- */
function Toast({ message, theme }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "14px 28px",
        background: theme === "dark" ? "#1a1a1a" : "#fff",
        color: theme === "dark" ? "#fff" : "#111",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        fontWeight: 600,
        fontSize: 14,
        zIndex: 9999,
        animation: "slideUp 0.3s ease-out",
        border: theme === "dark" ? "1px solid #333" : "1px solid #e0e0e0",
      }}
    >
      {message}
    </div>
  );
}

/* -------------------- Auth Modal Component -------------------- */
function AuthModal({
  visible,
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUsername,
  confirmPassword,
  setConfirmPassword,
  submit,
  error,
  validationError,
  canSubmit,
  authSubmitting,
  onClose,
  theme,
  isMobile,
}) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowPass(false);
      setShowConfirm(false);
    }
  }, [visible, mode]);

  if (!visible) return null;

  const handleKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canSubmit && !authSubmitting) submit();
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: theme === "dark" ? "1px solid #333" : "1px solid #e0e0e0",
    background: theme === "dark" ? "#1a1a1a" : "#f8f9fa",
    color: theme === "dark" ? "#fff" : "#111",
    fontSize: 15,
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: isMobile ? "100%" : 440,
          maxWidth: "100%",
          padding: isMobile ? 20 : 32,
          borderRadius: 24,
          background: theme === "dark" ? "#111" : "#fff",
          color: theme === "dark" ? "#eaeaea" : "#111",
          boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ margin: "8px 0 0", color: theme === "dark" ? "#888" : "#666", fontSize: 14 }}>
              {mode === "login" ? "Sign in to access your account" : "Join Ritual — submit and track predictions"}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: theme === "dark" ? "#222" : "#f0f0f0",
              border: "none",
              borderRadius: 10,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: theme === "dark" ? "#888" : "#666",
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: theme === "dark" ? "#1a1a1a" : "#f0f0f0", padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: mode === "login" ? (theme === "dark" ? "#333" : "#fff") : "transparent",
              color: mode === "login" ? (theme === "dark" ? "#fff" : "#111") : (theme === "dark" ? "#888" : "#666"),
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: mode === "login" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: mode === "signup" ? (theme === "dark" ? "#333" : "#fff") : "transparent",
              color: mode === "signup" ? (theme === "dark" ? "#fff" : "#111") : (theme === "dark" ? "#888" : "#666"),
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: mode === "signup" ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
            }}
          >
            Sign up
          </button>
        </div>

        <form onKeyDown={handleKey} onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <div style={{ display: "grid", gap: 16 }}>
            {mode === "signup" && (
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme === "dark" ? "#ccc" : "#444" }}>
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme === "dark" ? "#ccc" : "#444" }}>
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme === "dark" ? "#ccc" : "#444" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{ ...inputStyle, paddingRight: 60 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: theme === "dark" ? "#888" : "#666",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 500, color: theme === "dark" ? "#ccc" : "#444" }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    style={{ ...inputStyle, paddingRight: 60 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: theme === "dark" ? "#888" : "#666",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {(validationError || error) && (
              <div style={{
                padding: "12px 16px",
                background: theme === "dark" ? "rgba(220,38,38,0.15)" : "#fef2f2",
                border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: 12,
                color: "#dc2626",
                fontSize: 14,
              }}>
                {validationError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || authSubmitting}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "none",
                background: canSubmit && !authSubmitting ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#ccc",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                cursor: canSubmit && !authSubmitting ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                marginTop: 8,
              }}
            >
              {authSubmitting ? (mode === "login" ? "Logging in…" : "Creating account…") : (mode === "login" ? "Login" : "Sign up")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Market Timer Badge -------------------- */
function MarketTimerBadge({ theme }) {
  const [timer, setTimer] = useState(getWeeklyMarketTimer());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(getWeeklyMarketTimer());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isUrgent = timer.remainingMs < 3600000;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 16px",
        borderRadius: 24,
        background: timer.closed
          ? (theme === "dark" ? "#333" : "#e5e5e5")
          : isUrgent
          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: timer.closed ? (theme === "dark" ? "#888" : "#666") : "#fff",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: timer.closed ? "none" : "0 4px 12px rgba(16,185,129,0.3)",
      }}
    >
      <span style={{ fontSize: 16 }}>{timer.closed ? "🔒" : "⏱️"}</span>
      <span>{timer.closed ? "Market Closed" : `Ends in ${formatMarketTimer(timer.remainingMs)}`}</span>
    </div>
  );
}

/* -------------------- Main Component -------------------- */
export default function Home() {
  const [theme, setTheme] = useState("light");
  const [serverPredictions, setServerPredictions] = useState([]);
  const [localPredictions, setLocalPredictions] = useState({});
  const [predictionsList, setPredictionsList] = useState(() => WEEKLY_PREDICTIONS.map((p) => ({ ...p })));
  const [polyMarkets, setPolyMarkets] = useState([]);
  const [polyLoading, setPolyLoading] = useState(false);
  const [polyError, setPolyError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [votes, setVotes] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPid, setNewPid] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newYesLabel, setNewYesLabel] = useState("");
  const [newNoLabel, setNewNoLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingError, setAddingError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const prevCreditsRef = useRef(0);
  const [nextClaimAt, setNextClaimAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [faucetPulse, setFaucetPulse] = useState(false);
  const [votingPid, setVotingPid] = useState(null);
  const [voting, setVoting] = useState(null);
  const [view, setView] = useState("market");
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [polySort, setPolySort] = useState("trending");

  /* ---------- Theme persistence ---------- */
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  /* ---------- Responsive ---------- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ---------- Toast auto-hide ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Merge predictions ---------- */
  useEffect(() => {
    const serverMap = Object.fromEntries(serverPredictions.map((p) => [p.pid, p]));
    const serverOrder = serverPredictions.map((p) => p.pid);
    const seen = new Set();
    const merged = [];

    for (const w of WEEKLY_PREDICTIONS) {
      const s = serverMap[w.pid];
      merged.push({
        pid: w.pid,
        question: s?.question?.trim() || w.question,
        yesLabel: pickLabel(s?.yesLabel, w.yesLabel, "YES"),
        noLabel: pickLabel(s?.noLabel, w.noLabel, "NO"),
        source: s ? "server" : "weekly",
      });
      seen.add(w.pid);
    }

    for (const pid of serverOrder) {
      if (seen.has(pid)) continue;
      const s = serverMap[pid];
      if (!s) continue;
      merged.push({ ...s, source: "server" });
      seen.add(pid);
    }

    for (const lp of Object.values(localPredictions)) {
      if (!lp?.pid || seen.has(lp.pid)) continue;
      merged.push({ ...lp, source: "client" });
      seen.add(lp.pid);
    }

    setPredictionsList(merged);
  }, [serverPredictions, localPredictions]);

  /* ---------- Initial data + SSE ---------- */
  useEffect(() => {
    refreshUser();
    fetchVotes();

    let es;
    try {
      es = new EventSource("/api/stream");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (!data?.pid) return;

          setVotes((prev) => ({ ...prev, [data.pid]: { ...(prev[data.pid] || {}), ...data } }));

          setServerPredictions((prev) => {
            const idx = prev.findIndex((p) => p.pid === data.pid);
            const serverItem = {
              pid: data.pid,
              question: typeof data.question === "string" && data.question.trim() ? data.question.trim() : "",
              yesLabel: typeof data.yesLabel === "string" ? data.yesLabel : "",
              noLabel: typeof data.noLabel === "string" ? data.noLabel : "",
              source: "server",
            };

            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...serverItem };
              return copy;
            }
            return [...prev, serverItem];
          });

          setLocalPredictions((prev) => {
            if (!prev?.[data.pid]) return prev;
            const copy = { ...prev };
            delete copy[data.pid];
            return copy;
          });
        } catch (err) {
          console.warn("SSE parse error", err);
        }
      };
      es.onerror = () => es?.close();
    } catch (err) {
      console.warn("SSE init failed", err);
    }
    return () => es?.close();
  }, []);

  /* ---------- Polymarket ---------- */
  async function fetchPolymarket(q = "", sort = "trending") {
    setPolyLoading(true);
    setPolyError("");
    try {
      const res = await fetch(`/api/polymarket?limit=24&sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setPolyError(data?.error || "Failed to load Polymarket markets");
        setPolyMarkets([]);
        return;
      }
      let markets = [];
      if (data?.sections && typeof data.sections === "object") {
        const key = sort === "new" ? "latest" : sort;
        if (Array.isArray(data.sections[key])) markets = data.sections[key];
      }
      if (!markets.length && Array.isArray(data?.markets)) markets = data.markets;
      setPolyMarkets(markets);
    } catch {
      setPolyError("Network error loading Polymarket markets");
      setPolyMarkets([]);
    } finally {
      setPolyLoading(false);
    }
  }

  useEffect(() => {
    if (view !== "polymarket") return;
    fetchPolymarket(searchQuery, polySort);
    const t = setInterval(() => fetchPolymarket(searchQuery, polySort), 15000);
    return () => clearInterval(t);
  }, [view, polySort, searchQuery]);

  function formatCompact(n) {
    try {
      return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(n);
    } catch {
      return String(n);
    }
  }

  /* ---------- Data fetchers ---------- */
  async function fetchVotes() {
    try {
      const res = await fetch("/api/predictions");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const serverMap = {};
      const serverOrder = [];
      data.forEach((p) => {
        if (!p?.pid) return;
        const q = typeof p.question === "string" && p.question.trim() ? p.question : "";
        serverMap[p.pid] = { pid: p.pid, question: q, yesLabel: p.yesLabel ?? "", noLabel: p.noLabel ?? "" };
        serverOrder.push(p.pid);
      });

      const serverList = serverOrder.map((pid) => {
        const s = serverMap[pid];
        return s ? { pid: s.pid, question: s.question, yesLabel: s.yesLabel, noLabel: s.noLabel, source: "server" } : null;
      }).filter(Boolean);
      setServerPredictions(serverList);

      const map = {};
      data.forEach((p) => {
        if (!p?.pid) return;
        map[p.pid] = { pid: p.pid, yes: p.yes ?? 0, no: p.no ?? 0, votes: p.votes ?? [] };
      });
      setVotes((prev) => ({ ...prev, ...map }));
    } catch (err) {
      console.error("fetchVotes error", err);
    }
  }

  async function refreshUser() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setNextClaimAt(null);
        return;
      }
      const data = await res.json();
      if (!data?.user) {
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
      fetchMySuggestions().catch(() => {});
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchMySuggestions() {
    try {
      const res = await fetch("/api/suggestions?mine=true", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const items = data.suggestions || [];

      setLocalPredictions((prev) => {
        const copy = { ...prev };
        for (const s of items) {
          const key = s.pid || `pending-${s._id}`;
          copy[key] = {
            pid: key,
            question: s.question,
            yesLabel: s.yesLabel || "YES",
            noLabel: s.noLabel || "NO",
            source: "client",
            pending: s.status !== "approved",
          };
          setVotes((prevVotes) => ({ ...prevVotes, [key]: prevVotes[key] || { yes: 0, no: 0, votes: [] } }));
        }
        return copy;
      });
    } catch (err) {
      console.error("fetchMySuggestions error", err);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history", { credentials: "include" });
      if (!res.ok) { setHistory([]); return; }
      const d = await res.json();
      setHistory(d.history || []);
    } catch (err) {
      console.error(err);
      setHistory([]);
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) { setLeaderboard([]); return; }
      const d = await res.json();
      setLeaderboard(d.leaderboard || []);
    } catch (err) {
      console.error(err);
      setLeaderboard([]);
    }
  }

  /* ---------- Auth helpers ---------- */
  useEffect(() => {
    if (!email) { setValidationError(""); return; }
    if (!email.includes("@")) return setValidationError("Email must contain @");
    if (password && password.length > 0 && password.length < 6) return setValidationError("Password must be at least 6 characters");
    if (mode === "signup" && password !== confirmPassword) return setValidationError("Passwords do not match");
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
        body: JSON.stringify(mode === "signup" ? { email, password, confirmPassword, username } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Authentication failed"); return; }
      setToast(mode === "signup" ? "Account created 🎉" : "Logged in ✅");
      setShowAuthModal(false);
      await refreshUser();
    } catch (err) {
      setError("Network error. Try again.");
      console.error(err);
    } finally {
      setAuthSubmitting(false);
      fetchHistory();
      fetchLeaderboard();
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      setUser(null);
      setNextClaimAt(null);
      setError("");
    }
  }

  /* ---------- Faucet helpers ---------- */
  useEffect(() => {
    if (!nextClaimAt) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [nextClaimAt]);

  const remainingMs = nextClaimAt ? Math.max(0, nextClaimAt - now) : 0;

  function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function pickLabel(serverLabel, weeklyLabel, fallback) {
    const s = (serverLabel ?? "").toString().trim();
    if (!s) return weeklyLabel || fallback;
    const up = s.toUpperCase();
    if (up === "YES" || up === "NO") return weeklyLabel || fallback;
    return s;
  }

  async function claimFaucet() {
    if (!user) {
      setToast("Login to claim faucet");
      setShowAuthModal(true);
      setMode("login");
      return;
    }
    try {
      const res = await fetch("/api/faucet", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        if (data?.remainingMs) setNextClaimAt(Date.now() + Number(data.remainingMs));
        setToast(data?.error || "Already claimed");
        return;
      }
      prevCreditsRef.current = user?.credits ?? prevCreditsRef.current;
      setUser((u) => ({ ...u, credits: data.credits }));
      const next = Date.now() + 24 * 60 * 60 * 1000;
      setNextClaimAt(next);
      setFaucetPulse(true);
      setToast("+10 credits claimed 🎉");
      setTimeout(() => setFaucetPulse(false), 900);
      fetchHistory();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      setToast("Network error");
    }
  }

  /* ---------- Voting ---------- */
  async function vote(pid, choice) {
    if (!user) {
      setToast("Login to vote");
      setShowAuthModal(true);
      setMode("login");
      return;
    }
    if (votingPid === pid) return;
    setVotingPid(pid);
    setVoting({ pid, choice });

    setVotes((prev) => {
      const cur = prev[pid] || { yes: 0, no: 0, votes: [] };
      const existing = cur.votes?.find((v) => v.userId === user._id);
      let yes = cur.yes ?? 0;
      let no = cur.no ?? 0;
      let votesArr = [...(cur.votes ?? [])];

      if (!existing) {
        votesArr.push({ userId: user._id, choice });
        if (choice === "YES") yes++;
        else no++;
      } else if (existing.choice !== choice) {
        votesArr = votesArr.map((v) => (v.userId === user._id ? { ...v, choice } : v));
        if (existing.choice === "YES") yes--;
        else no--;
        if (choice === "YES") yes++;
        else no++;
      }
      return { ...prev, [pid]: { ...cur, yes, no, votes: votesArr } };
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
        fetchVotes();
        return;
      }
      if (data.credits !== undefined) setUser((u) => ({ ...u, credits: data.credits }));
      fetchHistory();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
      fetchVotes();
    } finally {
      setVotingPid(null);
      setVoting(null);
    }
  }

  async function removeVote(pid) {
    if (!user) {
      setToast("Login to remove vote");
      setShowAuthModal(true);
      setMode("login");
      return;
    }
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pid, remove: true }),
      });
      const data = await res.json();
      if (!res.ok) { setToast("Failed to remove vote"); return; }
      if (data.credits !== undefined) setUser((u) => ({ ...u, credits: data.credits }));
      fetchHistory();
      fetchLeaderboard();
      fetchVotes();
    } catch (err) {
      console.error(err);
    }
  }

  /* ---------- Add prediction ---------- */
  function openAddModal() {
    setNewPid("");
    setNewQuestion("");
    setNewYesLabel("");
    setNewNoLabel("");
    setAddingError("");
    setShowAddModal(true);
  }

  async function submitNewPrediction() {
    if (!newQuestion.trim()) { setAddingError("Question is required"); return; }
    setAdding(true);
    setAddingError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pid: newPid.trim() || undefined,
          question: newQuestion.trim(),
          yesLabel: newYesLabel.trim() || undefined,
          noLabel: newNoLabel.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setShowAuthModal(true);
          setMode("login");
          setAddingError("Login to submit suggestion");
          return;
        }
        setAddingError(data.error || "Failed to submit suggestion");
        return;
      }
      setToast("Suggestion submitted ✅");
      setShowAddModal(false);

      const sug = data.suggestion || {};
      const createdPrediction = data.prediction || null;
      const tempPid = sug.pid || `pending-${sug._id || Date.now()}`;

      const pendingItem = {
        pid: tempPid,
        question: sug.question || newQuestion.trim(),
        yesLabel: sug.yesLabel || newYesLabel.trim() || "YES",
        noLabel: sug.noLabel || newNoLabel.trim() || "NO",
        source: "client",
        pending: !createdPrediction,
      };

      setLocalPredictions((prev) => ({ ...prev, [tempPid]: pendingItem }));
      setVotes((prev) => ({ ...prev, [tempPid]: prev[tempPid] || { yes: 0, no: 0, votes: [] } }));
    } catch (e) {
      console.error("submit suggestion error", e);
      setAddingError("Network error");
    } finally {
      setAdding(false);
    }
  }
    function renderHistory() {
    if (!history.length) return <div style={styles.empty}>No history yet.</div>;
    return (
      <div style={styles.historyList}>
        {history.map((h, i) => (
          <div key={i} style={styles.historyItem}>
            <div style={styles.historyLeft}>
              <div style={styles.historyType}>{h.type}</div>
              <div style={styles.historyMeta}>{h.pid ? `${h.pid}${h.choice ? ` · ${h.choice}` : ""}` : ""}</div>
            </div>
            <div style={styles.historyRight}>
              {h.amount ? (
                <strong style={{ color: h.amount > 0 ? "#1f7a4a" : theme === "dark" ? "#eaeaea" : "#111" }}>
                  {h.amount > 0 ? `+${h.amount}` : h.amount}
                </strong>
              ) : null}
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
          <div key={i} style={styles.lbItem}>
            <div style={styles.lbLeft}>
              <div style={styles.lbRank}>#{u.rank ?? i + 1}</div>
              <div>
                <div style={styles.lbName}>{u.username}</div>
                <div style={styles.lbSub}>{u.subtitle ?? ""}</div>
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

  /* ---------- Prepare list for rendering ---------- */
  const normalizePid = (pid) => (/^\d+$/.test(String(pid)) ? String(pid).padStart(2, "0") : String(pid));
  const weeklySet = useMemo(() => new Set(WEEKLY_PREDICTIONS.map((w) => w.pid)), []);
  const byPid = useMemo(() => Object.fromEntries(predictionsList.map((p) => [p.pid, p])), [predictionsList]);

  const combined = useMemo(() => {
    const seen = new Set();
    const visible = [];

    for (const p of predictionsList) {
      const pid = String(p.pid);
      const norm = normalizePid(pid);
      if (weeklySet.has(norm) && pid !== norm) continue;
      const canonical = byPid[norm] || p;
      const question = canonical.question ? String(canonical.question).trim() : "";
      if (!question) continue;
      if (canonical.source !== "client" && /^prediction\s*\d+$/i.test(question)) continue;
      if (seen.has(norm)) continue;
      seen.add(norm);
      visible.push(canonical);
    }

    if (!searchQuery) return visible;
    const q = searchQuery.toLowerCase();
    return visible.filter((p) => (((p.question || "") + " " + (p.yesLabel || "") + " " + (p.noLabel || "")).toLowerCase().includes(q)));
  }, [predictionsList, byPid, weeklySet, searchQuery]);

  /* ---------- Styles ---------- */
  const pageStyle = {
    minHeight: "100vh",
    background: theme === "dark"
      ? "linear-gradient(180deg, #0a0a0a 0%, #111 100%)"
      : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
    color: theme === "dark" ? "#eaeaea" : "#1a1a1a",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const headerStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    padding: isMobile ? "16px" : "20px 32px",
    borderBottom: theme === "dark" ? "1px solid #222" : "1px solid #e0e0e0",
    background: theme === "dark" ? "rgba(10,10,10,0.95)" : "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    gap: isMobile ? 16 : 0,
  };

  const cardStyle = {
    background: theme === "dark" ? "#1a1a1a" : "#fff",
    border: theme === "dark" ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 24,
    transition: "all 0.3s ease",
    boxShadow: theme === "dark" ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.06)",
  };

  const buttonBaseStyle = {
    border: "none",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: 14,
  };

  const primaryButtonStyle = {
    ...buttonBaseStyle,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#fff",
    padding: "12px 20px",
    boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
  };

  const secondaryButtonStyle = {
    ...buttonBaseStyle,
    background: theme === "dark" ? "#2a2a2a" : "#f3f4f6",
    color: theme === "dark" ? "#fff" : "#374151",
    padding: "10px 16px",
  };

  const tabButtonStyle = (isActive) => ({
    ...buttonBaseStyle,
    background: isActive ? (theme === "dark" ? "#333" : "#e5e7eb") : "transparent",
    color: isActive ? (theme === "dark" ? "#fff" : "#111") : (theme === "dark" ? "#888" : "#6b7280"),
    padding: "10px 16px",
  });

  const voteButtonStyle = (isActive, type) => ({
    flex: 1,
    padding: "16px 20px",
    borderRadius: 14,
    border: "none",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: isActive
      ? (type === "yes" ? "#10b981" : "#ef4444")
      : (theme === "dark"
        ? (type === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)")
        : (type === "yes" ? "#ecfdf5" : "#fef2f2")),
    color: isActive
      ? "#fff"
      : (type === "yes"
        ? (theme === "dark" ? "#34d399" : "#059669")
        : (theme === "dark" ? "#f87171" : "#dc2626")),
    boxShadow: isActive ? `0 4px 12px ${type === "yes" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}` : "none",
  });

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: theme === "dark" ? "1px solid #333" : "1px solid #e0e0e0",
    background: theme === "dark" ? "#1a1a1a" : "#f8f9fa",
    color: theme === "dark" ? "#fff" : "#111",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    marginTop: 8,
  };

  /* ---------- Loading UI ---------- */
  if (authLoading) {
    return (
      <main style={pageStyle}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 48,
              height: 48,
              border: `3px solid ${theme === "dark" ? "#333" : "#e0e0e0"}`,
              borderTopColor: "#10b981",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: theme === "dark" ? "#888" : "#666" }}>Loading…</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  /* ---------- Main UI ---------- */
  return (
    <main style={pageStyle}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .card:hover { transform: translateY(-4px); box-shadow: ${theme === "dark" ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.1)"}; }
        .vote-btn:hover { transform: scale(1.02); }
        .vote-btn:active { transform: scale(0.98); }
        input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
      `}</style>

      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/logo.png" alt="Ritual" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: theme === "dark" ? "#fff" : "#111" }}>
              Ritual Market
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: theme === "dark" ? "#888" : "#666" }}>
              Collective intelligence, live
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12, alignItems: isMobile ? "stretch" : "center" }}>
          <div style={{ display: "flex", gap: 4, background: theme === "dark" ? "#1a1a1a" : "#f3f4f6", padding: 4, borderRadius: 14, flexWrap: "wrap" }}>
            {["market", "polymarket", "history", "leaderboard"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setView(tab);
                  if (tab === "history") fetchHistory();
                  if (tab === "leaderboard") fetchLeaderboard();
                  if (tab === "polymarket") fetchPolymarket(searchQuery, polySort);
                }}
                style={tabButtonStyle(view === tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} style={secondaryButtonStyle}>
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <button onClick={openAddModal} style={secondaryButtonStyle}>
              + Add
            </button>

            <button
              onClick={claimFaucet}
              disabled={remainingMs > 0}
              style={{
                ...primaryButtonStyle,
                opacity: remainingMs > 0 ? 0.6 : 1,
                animation: faucetPulse ? "pulse 0.3s ease" : "none",
              }}
            >
              {remainingMs > 0 ? formatTime(remainingMs) : "+10 💧"}
            </button>

            {user ? (
              <>
                <span style={{ fontSize: 14, color: theme === "dark" ? "#ccc" : "#444" }}>
                  {user.username} · <strong style={{ color: "#10b981" }}>{user.credits ?? 0}</strong>
                </span>
                <button onClick={logout} style={{ ...secondaryButtonStyle, color: "#ef4444" }}>
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setMode("login"); }} style={primaryButtonStyle}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section style={{ padding: isMobile ? 16 : 32, maxWidth: 1400, margin: "0 auto" }}>
        {/* Market View */}
        {view === "market" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Weekly Predictions</h2>
                <p style={{ margin: "8px 0 0", color: theme === "dark" ? "#888" : "#666" }}>
                  Vote on this week's community predictions
                </p>
              </div>
              <MarketTimerBadge theme={theme} />
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 24,
            }}>
              {combined.map((p) => {
                const v = votes[p.pid] || { yes: 0, no: 0, votes: [] };
                const myVote = v.votes?.find((vt) => vt.userId === user?._id)?.choice;
                const total = Math.max(1, (v.yes || 0) + (v.no || 0));
                const yesPct = Math.round(((v.yes || 0) / total) * 100);
                const noPct = 100 - yesPct;
                const questionText = p.question?.trim() || WEEKLY_PREDICTIONS.find((w) => w.pid === p.pid)?.question || `Prediction ${p.pid}`;

                return (
                  <div key={p.pid} style={cardStyle} className="card">
                    <div style={{ marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: theme === "dark" ? "#fff" : "#111" }}>
                        {questionText}
                      </h3>
                      {p.source === "client" && p.pending && (
                        <span style={{
                          display: "inline-block",
                          marginTop: 8,
                          padding: "4px 10px",
                          borderRadius: 8,
                          background: theme === "dark" ? "#333" : "#fef3c7",
                          color: theme === "dark" ? "#fcd34d" : "#92400e",
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          ⏳ Pending approval
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <button
                        className="vote-btn"
                        disabled={voting?.pid === p.pid}
                        onClick={() => vote(p.pid, "YES")}
                        style={voteButtonStyle(myVote === "YES", "yes")}
                      >
                        {p.yesLabel || "YES"}
                      </button>
                      <button
                        className="vote-btn"
                        disabled={voting?.pid === p.pid}
                        onClick={() => vote(p.pid, "NO")}
                        style={voteButtonStyle(myVote === "NO", "no")}
                      >
                        {p.noLabel || "NO"}
                      </button>
                    </div>

                    {myVote && (
                      <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        onClick={() => removeVote(p.pid)}
                       className="flex items-center justify-center"
                        style={{
                          background: "none",
                          border: "none",
                          color: theme === "dark" ? "#888" : "#6b7280",
                          fontSize: 13,
                          cursor: "pointer",
                          marginBottom: 16,
                          textDecoration: "underline",
                        }}
                      >
                        Remove vote
                      </button>
                      </div>
                    )}
                             <div style={styles.meta}>
                        <span style={{ color: theme === "dark" ? "#cfe9d7" : "#0b4d22" }}> {yesPct}%</span>
                        <span style={{ color: theme === "dark" ? "#f4cfcf" : "#5b1f1f" }}>{noPct}%</span>
                      </div>

                    <div style={{
                      height: 8,
                      borderRadius: 4,
                      background: theme === "dark" ? "#333" : "#e5e7eb",
                      overflow: "hidden",
                      display: "flex",
                    }}>
                      <div style={{
                        width: `${yesPct}%`,
                        background: "linear-gradient(90deg, #10b981, #34d399)",
                        transition: "width 0.5s ease",
                      }} />
                      <div style={{
                        width: `${noPct}%`,
                        background: "linear-gradient(90deg, #ef4444, #f87171)",
                        transition: "width 0.5s ease",
                      }} />
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Polymarket View */}
        {view === "polymarket" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Polymarket Feed</h2>
              <p style={{ margin: "8px 0 0", color: theme === "dark" ? "#888" : "#666" }}>
                Real-time prediction markets from Polymarket
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {["trending", "new", "volume"].map((sort) => (
                <button
                  key={sort}
                  onClick={() => setPolySort(sort)}
                  style={tabButtonStyle(polySort === sort)}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </button>
              ))}
            </div>

            {polyLoading && (
              <div style={{ textAlign: "center", padding: 48 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  border: `3px solid ${theme === "dark" ? "#333" : "#e0e0e0"}`,
                  borderTopColor: "#10b981",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto",
                }} />
              </div>
            )}

            {polyError && (
              <div style={{
                padding: 16,
                background: theme === "dark" ? "rgba(239,68,68,0.1)" : "#fef2f2",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12,
                color: "#ef4444",
              }}>
                {polyError}
              </div>
            )}

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(380px, 1fr))",
              gap: 24,
            }}>
              {(polyMarkets || []).map((m) => {
                const ritualPid = `poly-${m.id}`;
                const v = votes[ritualPid] || { yes: 0, no: 0, votes: [] };
                const myVote = v.votes?.find((vt) => vt.userId === user?._id)?.choice;
                const total = Math.max(1, (v.yes || 0) + (v.no || 0));
                const ritualYesPct = Math.round(((v.yes || 0) / total) * 100);
                const ritualNoPct = 100 - ritualYesPct;

                return (
                  <div key={m.id} style={cardStyle} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.4, flex: 1, color: theme === "dark" ? "#fff" : "#111" }}>
                        {m.title}
                      </h3>
                      {m.url && (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#10b981",
                            fontSize: 13,
                            textDecoration: "none",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Open ↗
                        </a>
                      )}
                    </div>

                    <div style={{ fontSize: 13, color: theme === "dark" ? "#888" : "#666", marginBottom: 16 }}>
                      Vol: {m.volume != null ? formatCompact(m.volume) : "—"} · Liq: {m.liquidity != null ? formatCompact(m.liquidity) : "—"}
                    </div>

                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <button
                        className="vote-btn"
                        disabled={voting?.pid === ritualPid}
                        onClick={() => vote(ritualPid, "YES")}
                        style={voteButtonStyle(myVote === "YES", "yes")}
                      >
                        YES
                      </button>
                        <button
                          className="vote-btn"
                          disabled={voting?.pid === ritualPid}
                          onClick={() => vote(ritualPid, "NO")}
                          style={{
                            ...styles.noBtn,
                            opacity: voting?.pid === ritualPid ? 0.6 : 1,
                            background: myVote === "NO" ? "#7a1f1f" : theme === "dark" ? "rgba(122,31,31,0.12)" : "#fdecec",
                            color: theme === "dark" ? "#fff" : "#500000",
                          }}
                        >
                          NO 
                        </button>
                      </div>

                      <div style={styles.removeVoteWrap}>
                        {myVote && <button onClick={() => removeVote(ritualPid)} style={styles.removeVote}>Remove vote</button>}
                      </div>

                      {/* ✅ Ritual vote bar */}
                      <div className="bar" style={{ ...styles.bar, background: theme === "dark" ? "#111" : "#f1f5f9" }}>
                        <div className="bar-yes" style={{ ...styles.barYes, width: `${ritualYesPct}%` }} />
                        <div className="bar-no" style={{ ...styles.barNo, width: `${ritualNoPct}%` }} />
                      </div>

                      <div style={styles.meta}>
                        <span style={{ color: theme === "dark" ? "#cfe9d7" : "#0b4d22" }}> YES {ritualYesPct}%</span>
                        <span style={{ color: theme === "dark" ? "#f4cfcf" : "#5b1f1f" }}> NO {ritualNoPct}%</span>
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

        {/* Add prediction modal */}
        {showAddModal && (
          <div style={styles.modalBackdrop}>
            <div style={{ ...styles.modal, maxWidth: 520, background: theme === "dark" ? "#121212" : "#fff", color: theme === "dark" ? "#eaeaea" : "#111" }}>
              <h3 style={{ margin: 0 }}>Add a prediction</h3>
              <p style={{ marginTop: 8, color: theme === "dark" ? "#9a9a9a" : "#666" }}>
                Provide a unique id (optional) and a question. This submits a suggestion to the server; it will appear in Market after approval.
              </p>

              <input placeholder="Unique id (optional)" value={newPid} onChange={(e) => setNewPid(e.target.value)} style={{ ...styles.input, marginTop: 8, background: theme === "dark" ? "#0e0e0e" : "#fff", color: theme === "dark" ? "#fff" : "#111", border: theme === "dark" ? "1px solid #222" : "1px solid rgba(0,0,0,0.06)" }} />
              <input placeholder="Question text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} style={{ ...styles.input, marginTop: 8, background: theme === "dark" ? "#0e0e0e" : "#fff", color: theme === "dark" ? "#fff" : "#111", border: theme === "dark" ? "1px solid #222" : "1px solid rgba(0,0,0,0.06)" }} />
              <input placeholder="Yes label (optional)" value={newYesLabel} onChange={(e) => setNewYesLabel(e.target.value)} style={{ ...styles.input, marginTop: 8, background: theme === "dark" ? "#0e0e0e" : "#fff", color: theme === "dark" ? "#fff" : "#111", border: theme === "dark" ? "1px solid #222" : "1px solid rgba(0,0,0,0.06)" }} />
              <input placeholder="No label (optional)" value={newNoLabel} onChange={(e) => setNewNoLabel(e.target.value)} style={{ ...styles.input, marginTop: 8, background: theme === "dark" ? "#0e0e0e" : "#fff", color: theme === "dark" ? "#fff" : "#111", border: theme === "dark" ? "1px solid #222" : "1px solid rgba(0,0,0,0.06)" }} />

              {addingError && <div style={styles.error}>{addingError}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={submitNewPrediction} disabled={adding} style={styles.primaryBtn}>
                  {adding ? "Submitting…" : "Submit suggestion"}
                </button>
                <button onClick={() => setShowAddModal(false)} style={styles.removeVote}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <AuthModal
          visible={showAuthModal}
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
          onClose={() => setShowAuthModal(false)}
          theme={theme}
          isMobile={isMobile}
        />

        <Toast message={toast} />

        <footer style={styles.footer}>
          Created by <span style={styles.footerName}>Maharshi</span>
        </footer>
      </main>
    );
  }

  /* ------------------------- Common CSS & styles ------------------------- */
  function commonCss(theme) {
    return `
      .faucet-btn { transition: transform .18s ease, box-shadow .18s ease; }
      .faucet-btn.pulse { animation: faucet-pulse .9s cubic-bezier(.2,.9,.3,1); }
      @keyframes faucet-pulse { 0% { transform: scale(1) } 40% { transform: scale(1.06) } 100% { transform: scale(1) } }

      .card { transition: transform .18s ease, box-shadow .18s ease; border-radius: 14px; }
      .card:hover { transform: translateY(-6px); box-shadow: 0 10px 24px rgba(0,0,0,0.25); }

      .auth-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #000; border-right-color: transparent; border-radius: 50%; animation: spin .6s linear infinite; vertical-align: middle; margin-right: 8px; }
      @keyframes spin { to { transform: rotate(360deg) } }

      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
      .vote-row { display: flex; gap: 12px; }
      .vote-row .vote-btn { width: 100%; border-radius: 12px; padding: 12px; min-height: 44px; }

      @media (max-width: 720px) {
        .card { padding: 14px !important; min-height: 120px !important; }
        .question { font-size: 15px !important; }
        .card .bar { height: 10px !important; }
        .vote-row { flex-direction: column; gap: 8px; }
        .vote-row .vote-btn { padding: 12px; width: 100%; }
        header { padding: 14px 12px !important; }
        .right-controls { width: 100% !important; margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
        input[placeholder="Find a question fast"] { width: 100% !important; margin-left: 0 !important; }
        .modal { width: 94% !important; padding: 14px !important; }
      }

      @media (min-width: 721px) and (max-width: 1024px) {
        .card { padding: 16px !important; }
        .question { font-size: 15px !important; }
      }

      body { background: ${theme === "dark" ? "#0a0a0a" : "#f5f9fb"}; }
    `;
  }

  const styles = {
    page: { minHeight: "100vh", padding: "20px 18px", fontFamily: "Inter, system-ui, sans-serif" },
    header: { maxWidth: 1200, margin: "0 auto 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
    brandWrap: { display: "flex", gap: 12, alignItems: "center" },
    logo: { width: 52, height: 52, objectFit: "contain" },

    rightControls: { display: "flex", gap: 12, alignItems: "center" },

    tabBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#cfcfcf", padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13 },
    tabActive: { background: "linear-gradient(180deg,#243922,#163d20)", border: "1px solid rgba(31,122,74,0.45)", color: "#fff" },

    faucetBtn: { background: "#1f7a4a", border: "none", borderRadius: 10, padding: "6px 10px", color: "#fff", fontSize: 12, cursor: "pointer" },
    logoutBtn: { background: "#111", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "6px 10px", color: "#fff", cursor: "pointer" },
    secondaryBtn: { background: "transparent", color: "#cfcfcf", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 13 },

    container: { maxWidth: 1200, margin: "0 auto", paddingTop: 6 },
    grid: { display: "grid", gap: 16 },

    card: { borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12, minHeight: 140, boxSizing: "border-box", width: "100%" },
    voteRow: { display: "flex", gap: 12, alignItems: "center" },
    yesBtn: { flex: 1, padding: 12, borderRadius: 12, cursor: "pointer", border: "none", fontWeight: 700, minHeight: 44 },
    noBtn: { flex: 1, padding: 12, borderRadius: 12, cursor: "pointer", border: "none", fontWeight: 700, minHeight: 44 },

    removeVote: { fontSize: 12, opacity: 0.85, background: "none", border: "none", color: "#9a9a9a", cursor: "pointer", padding: 0, lineHeight: "18px", textAlign: "center", width: "100%" },

    bar: { height: 12, borderRadius: 8, overflow: "hidden", display: "flex" },
    barYes: { background: "#1f7a4a", height: "100%" },
    barNo: { background: "#7a1f1f", height: "100%" },

    meta: { display: "flex", justifyContent: "space-between", fontSize: 13 },

    sectionTitle: { margin: "12px 0 4px", fontSize: 18 },
    sectionSub: { margin: "0 0 12px", color: "#9a9a9a", fontSize: 13 },

    historyList: { display: "flex", flexDirection: "column", gap: 10 },
    historyItem: { display: "flex", justifyContent: "space-between", gap: 10, padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.02)" },
    historyLeft: { display: "flex", flexDirection: "column" },
    historyType: { fontSize: 13, fontWeight: 600 },
    historyMeta: { fontSize: 12, color: "#9a9a9a" },
    historyRight: { textAlign: "right", display: "flex", flexDirection: "column", gap: 4 },
    historyTime: { fontSize: 11, color: "#8f8f8f" },

    leaderboardList: { display: "flex", flexDirection: "column", gap: 10 },
    lbItem: { display: "flex", justifyContent: "space-between", gap: 10, padding: 12, borderRadius: 12 },
    lbLeft: { display: "flex", gap: 12, alignItems: "center" },
    lbRank: { width: 44, textAlign: "center", fontWeight: 700, color: "#6b6b6b" },
    lbName: { fontWeight: 700 },
    lbSub: { fontSize: 12, color: "#9a9a9a" },
    lbRight: { textAlign: "right" },
    lbCredits: { fontWeight: 800 },

    empty: { color: "#9a9a9a", padding: 14 },

    modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 },
    modal: { background: "#121212", border: "1px solid #1f1f1f", borderRadius: 12, padding: 20, width: "95%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 12 },

    input: { borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", border: "1px solid rgba(0,0,0,0.06)" },
    primaryBtn: { background: "#1f7a4a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", fontWeight: 700, cursor: "pointer" },
    switchBtn: { background: "transparent", border: "none", color: "#9a9a9a", cursor: "pointer" },

    removeVoteWrap: { height: 18, marginTop: 6, display: "flex", alignItems: "center" },

    questionWrap: { minHeight: 64, display: "flex", alignItems: "flex-start" },
    question: { margin: 0, fontSize: 16, fontWeight: 600, lineHeight: "1.35", whiteSpace: "normal", wordBreak: "break-word" },

    myBetsEmpty: { color: "#9a9a9a", padding: 8 },
    myBetsList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
    myBetItem: { padding: 8, borderRadius: 8, background: "rgba(0,0,0,0.02)" },

    footer: { marginTop: 40, textAlign: "center", color: "#9a9a9a" },
    footerName: { color: "#eaeaea", fontWeight: 600 },

    toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1f7a4a", color: "#fff", padding: "10px 18px", borderRadius: 14, zIndex: 60 },

    error: { color: "#ff6b6b" },
  };
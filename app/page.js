"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* -------------------- Static weekly predictions (fallback) -------------------- */
const WEEKLY_PREDICTIONS = [
  // 🛡️ Mods (leadership & consistency)
  {
    pid: "116",
    question: "Who’s your favorite from the foundation team?",
    yesLabel: "Josh",
    noLabel: "Claire",
  },
  {
    pid: "101",
    question: "Who’s been the most active mod recently?",
    yesLabel: "Jez",
    noLabel: "Stefan",
  },
  {
    pid: "102",
    question: "Which mod is showing up more consistently these days?",
    yesLabel: "Dunken",
    noLabel: "Flash",
  },

  // 🎯 Event Manager (planning & execution)
  {
    pid: "103",
    question: "Who’s running events better right now planning + execution?",
    yesLabel: "Hinata",
    noLabel: "Kash",
  },

  // 😂 Memes (quality & consistency)
  {
    pid: "104",
    question: "Who’s delivering better memes lately?",
    yesLabel: "Moctx",
    noLabel: "Kundan",
  },

  // 🏗️ Builders (shipping & impact)
  {
    pid: "105",
    question: "Who’s been shipping stronger builder work recently?",
    yesLabel: "Meison",
    noLabel: "Elijah",
  },
  {
    pid: "106",
    question: "If you had to pick one top builder today, who takes it?",
    yesLabel: "Maharshi",
    noLabel: "Tanoy",
  },
  {
    pid: "107",
    question: "Who’s making the bigger builder impact right now?",
    yesLabel: "Rajlol",
    noLabel: "Cripson",
  },

  // 🎨 Art (style & output)
  {
    pid: "108",
    question: "Who’s been dropping the better art lately?",
    yesLabel: "Osaragi",
    noLabel: "Pixelsect",
  },
  {
    pid: "109",
    question: "Whose art has been stronger recently output + style?",
    yesLabel: "Gill",
    noLabel: "Willow",
  },
  {
    pid: "110",
    question: "Who’s the better artist right now (overall vibe + quality)?",
    yesLabel: "Alpha",
    noLabel: "Eren Daddy",
  },

  // ✍️ Content (clarity & value)
  {
    pid: "111",
    question: "Who’s writing more valuable content lately?",
    yesLabel: "Maharshi",
    noLabel: "Anirudh",
  },
  {
    pid: "112",
    question: "Who’s the stronger content writer these days?",
    yesLabel: "Lubu",
    noLabel: "G9D",
  },

  // 💬 Chat activity (presence & participation)
  {
    pid: "113",
    question: "Who’s been more active in chat recently?",
    yesLabel: "Cass",
    noLabel: "Willow",
  },
  {
    pid: "114",
    question: "Who’s more present in chat these days messages?",
    yesLabel: "JT",
    noLabel: "Marcellus",
  },

  // 🎮 Gamer (skill & wins)
  {
    pid: "115",
    question: "Who’s the better gamer right now?",
    yesLabel: "Lina",
    noLabel: "Sahil",
  },
];



/* -------------------- Small UI components -------------------- */
function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" style={styles.toast}>
      {message}
    </div>
  );
}

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

  return (
    <div style={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={mode === "login" ? "Login" : "Sign up"}>
      <div
        className="modal"
        style={{
          ...styles.modal,
          width: isMobile ? "94%" : 420,
          padding: isMobile ? 14 : 20,
          background: theme === "dark" ? "#0f1113" : "#fff",
          color: theme === "dark" ? "#eaeaea" : "#111",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
            <p style={{ margin: "6px 0 0", color: theme === "dark" ? "#9a9a9a" : "#666", fontSize: 13 }}>
              {mode === "login" ? "Sign in to access your account" : "Join Ritual — submit and track predictions"}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close authentication dialog"
            style={{
              background: "transparent",
              border: "none",
              color: theme === "dark" ? "#9a9a9a" : "#666",
              cursor: "pointer",
              fontSize: 16,
              padding: 6,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.06)",
              background: mode === "login" ? (theme === "dark" ? "#15221b" : "#eaf6ec") : "transparent",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.06)",
              background: mode === "signup" ? (theme === "dark" ? "#15221b" : "#eaf6ec") : "transparent",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign up
          </button>
        </div>

        <form
          style={{ marginTop: 14 }}
          onKeyDown={handleKey}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {mode === "signup" && (
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <span style={{ color: theme === "dark" ? "#cfcfcf" : "#444" }}>Username</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  style={{
                    ...styles.input,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: theme === "dark" ? "#0b0d0f" : "#fff",
                    color: theme === "dark" ? "#fff" : "#111",
                    border: theme === "dark" ? "1px solid #202327" : "1px solid rgba(0,0,0,0.08)",
                  }}
                />
              </label>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              <span style={{ color: theme === "dark" ? "#cfcfcf" : "#444" }}>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  ...styles.input,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: theme === "dark" ? "#0b0d0f" : "#fff",
                  color: theme === "dark" ? "#fff" : "#111",
                  border: theme === "dark" ? "1px solid #202327" : "1px solid rgba(0,0,0,0.08)",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
              <span style={{ color: theme === "dark" ? "#cfcfcf" : "#444" }}>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{
                    ...styles.input,
                    padding: "10px 38px 10px 12px",
                    borderRadius: 10,
                    background: theme === "dark" ? "#0b0d0f" : "#fff",
                    color: theme === "dark" ? "#fff" : "#111",
                    border: theme === "dark" ? "1px solid #202327" : "1px solid rgba(0,0,0,0.08)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#9a9a9a",
                    cursor: "pointer",
                    padding: 6,
                    fontSize: 13,
                  }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {mode === "signup" && (
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <span style={{ color: theme === "dark" ? "#cfcfcf" : "#444" }}>Confirm Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    style={{
                      ...styles.input,
                      padding: "10px 38px 10px 12px",
                      borderRadius: 10,
                      background: theme === "dark" ? "#0b0d0f" : "#fff",
                      color: theme === "dark" ? "#fff" : "#111",
                      border: theme === "dark" ? "1px solid #202327" : "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide confirm" : "Show confirm"}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#9a9a9a",
                      cursor: "pointer",
                      padding: 6,
                      fontSize: 13,
                    }}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            )}

            <div>
              {validationError && <div style={{ ...styles.error, marginTop: 6 }}>{validationError}</div>}
              {error && <div style={{ ...styles.error, marginTop: 6 }}>{error}</div>}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || authSubmitting}
                style={{
                  ...styles.primaryBtn,
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  opacity: !canSubmit || authSubmitting ? 0.7 : 1,
                }}
              >
                {authSubmitting ? (
                  <>
                    <span
                      className="auth-spinner"
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.9)",
                        borderRightColor: "transparent",
                        borderRadius: "50%",
                      }}
                    />
                    {mode === "login" ? "Logging in…" : "Creating account…"}
                  </>
                ) : mode === "login" ? (
                  "Login"
                ) : (
                  "Sign up"
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                style={{
                  ...styles.switchBtn,
                  padding: "10px 12px",
                  borderRadius: 10,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                {mode === "login" ? "Create account" : "Back to login"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Main component -------------------- */
export default function Home() {
  // theme (light/dark)
  const [theme, setTheme] = useState("dark");

  // authoritative server predictions (from /api/predictions)
  const [serverPredictions, setServerPredictions] = useState([]);
  // client-local predictions (client-only adds), keyed by pid
  const [localPredictions, setLocalPredictions] = useState({});

  // merged predictions displayed in UI
  const [predictionsList, setPredictionsList] = useState(() => WEEKLY_PREDICTIONS.map((p) => ({ ...p })));

  // Polymarket feed state
  const [polyMarkets, setPolyMarkets] = useState([]);
  const [polyLoading, setPolyLoading] = useState(false);
  const [polyError, setPolyError] = useState("");

  // loading & auth states
  const [searchQuery, setSearchQuery] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  // votes keyed by pid (from server)
  const [votes, setVotes] = useState({});

  // add prediction modal & fields
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPid, setNewPid] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [newYesLabel, setNewYesLabel] = useState("");
  const [newNoLabel, setNewNoLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingError, setAddingError] = useState("");

  // auth form
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");

  // UI states
  const [toast, setToast] = useState("");
  const prevCreditsRef = useRef(0);
  const [nextClaimAt, setNextClaimAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [faucetPulse, setFaucetPulse] = useState(false);
  const [creditsPop, setCreditsPop] = useState(false);


  const [votingPid, setVotingPid] = useState(null);
  const [voting, setVoting] = useState(null);

  const [view, setView] = useState("market");
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  /* ---------- theme persistence ---------- */
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

  /* ---------- responsive ---------- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ---------- toast auto-hide ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- recompute merged predictionsList whenever server/local change ---------- */
  useEffect(() => {
    const serverMap = Object.fromEntries(serverPredictions.map((p) => [p.pid, p]));
    const serverOrder = serverPredictions.map((p) => p.pid);

    const seen = new Set();
    const merged = [];

   for (const w of WEEKLY_PREDICTIONS) {
  const s = serverMap[w.pid];

  merged.push({
    pid: w.pid,
    question: (s?.question && s.question.trim()) ? s.question.trim() : w.question,
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
      if (!lp || !lp.pid) continue;
      if (seen.has(lp.pid)) continue;
      merged.push({ ...lp, source: "client" });
      seen.add(lp.pid);
    }

    setPredictionsList(merged);
  }, [serverPredictions, localPredictions]);

  /* ---------- initial data + SSE ---------- */
  useEffect(() => {
    refreshUser();
    fetchVotes();

    let es;
    try {
      es = new EventSource("/api/stream");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (!data || !data.pid) return;

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
            if (!prev || !prev[data.pid]) return prev;
            const copy = { ...prev };
            delete copy[data.pid];
            return copy;
          });
        } catch (err) {
          console.warn("SSE parse/upsert error", err);
        }
      };
      es.onerror = () => {
        try {
          es.close();
        } catch {}
      };
    } catch (err) {
      console.warn("SSE init failed", err);
    }
    return () => es && es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const [polySort, setPolySort] = useState("trending"); // trending | new | volume

async function fetchPolymarket(q = "", sort = "trending") {
  setPolyLoading(true);
  setPolyError("");

  try {
    const res = await fetch(
      `/api/polymarket?limit=24&sort=${encodeURIComponent(sort)}&q=${encodeURIComponent(q)}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (!res.ok) {
      setPolyError(data?.error || "Failed to load Polymarket markets");
      setPolyMarkets([]);
      return;
    }

    // Prefer backend-provided sections when available.
    // Map UI "new" to backend "latest".
    let markets = [];
    if (data?.sections && typeof data.sections === "object") {
      const key = sort === "new" ? "latest" : sort;
      if (Array.isArray(data.sections[key])) markets = data.sections[key];
    }

    // Fallback to the older `markets` array if sections missing / empty
    if (!markets.length && Array.isArray(data?.markets)) markets = data.markets;

    setPolyMarkets(markets);
  } catch {
    setPolyError("Network error loading Polymarket markets");
    setPolyMarkets([]);
  } finally {
    setPolyLoading(false);
  }
}



// ✅ auto refresh while on polymarket tab
useEffect(() => {
  if (view !== "polymarket") return;

  fetchPolymarket(searchQuery, polySort);

  const t = setInterval(() => {
    fetchPolymarket(searchQuery, polySort);
  }, 15000);

  return () => clearInterval(t);
}, [view, polySort, searchQuery]);



  function formatCompact(n) {
    try {
      return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(n);
    } catch {
      return String(n);
    }
  }

  /* -------------------- Data fetchers -------------------- */
  async function fetchVotes() {
    try {
      const res = await fetch("/api/predictions");
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const serverMap = {};
      const serverOrder = [];
      data.forEach((p) => {
        if (!p || !p.pid) return;
        const q = typeof p.question === "string" && p.question.trim() ? p.question : "";
     serverMap[p.pid] = { pid: p.pid, question: q, yesLabel: p.yesLabel ?? "", noLabel: p.noLabel ?? "" };
   serverOrder.push(p.pid);
      });

      const serverList = [];
      for (const pid of serverOrder) {
        const s = serverMap[pid];
        if (!s) continue;
        serverList.push({ pid: s.pid, question: s.question, yesLabel: s.yesLabel, noLabel: s.noLabel, source: "server" });
      }
      setServerPredictions(serverList);

      const map = {};
      data.forEach((p) => {
        if (!p || !p.pid) return;
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

      try {
        await fetchMySuggestions();
      } catch (err) {
        console.warn("fetchMySuggestions failed:", err);
      }
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
      if (!res.ok) {
        setHistory([]);
        return;
      }
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
      if (!res.ok) {
        setLeaderboard([]);
        return;
      }
      const d = await res.json();
      setLeaderboard(d.leaderboard || []);
    } catch (err) {
      console.error(err);
      setLeaderboard([]);
    }
  }

  /* -------------------- Auth helpers -------------------- */
  useEffect(() => {
    if (!email) {
      setValidationError("");
      return;
    }
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
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }
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

  /* -------------------- Faucet helpers -------------------- */
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

    // If already claimed, server should return remainingMs
    if (!res.ok) {
      if (data?.remainingMs) setNextClaimAt(Date.now() + Number(data.remainingMs));
      setToast(data?.error || "Already claimed");
      return;
    }

    // ✅ Update credits UI
    prevCreditsRef.current = user?.credits ?? prevCreditsRef.current;
    setUser((u) => ({ ...u, credits: data.credits }));

    // ✅ Start the 24h timer instantly (no need to wait for /api/me)
    const next = Date.now() + 24 * 60 * 60 * 1000;
    setNextClaimAt(next);

    // optional: keep your animations
    setFaucetPulse(true);
    setToast("+10 credits claimed");
    setTimeout(() => setFaucetPulse(false), 900);

    fetchHistory();
    fetchLeaderboard();

    // optional: refreshUser to sync server timestamps (not required for timer)
    // refreshUser();
  } catch (err) {
    console.error(err);
    setToast("Network error");
  }
}


  /* -------------------- Voting (Ritual credits) -------------------- */
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

    // optimistic update
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
      if (!res.ok) {
        setToast("Failed to remove vote");
        return;
      }
      if (data.credits !== undefined) setUser((u) => ({ ...u, credits: data.credits }));
      fetchHistory();
      fetchLeaderboard();
      fetchVotes();
    } catch (err) {
      console.error(err);
    }
  }

  /* -------------------- Add prediction (server-backed suggestion) -------------------- */
  function openAddModal() {
    setNewPid("");
    setNewQuestion("");
    setNewYesLabel("");
    setNewNoLabel("");
    setAddingError("");
    setShowAddModal(true);
  }

  async function submitNewPrediction() {
    if (!newQuestion.trim()) {
      setAddingError("Question is required");
      return;
    }
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

      setToast("Suggestion submitted ✅ waiting for approval");
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

  /* -------------------- Panels & helpers (rendering) -------------------- */
  function pageStyle(theme) {
    return {
      ...styles.page,
      background: theme === "dark" ? "radial-gradient(1200px 500px at top, #161616, #0a0a0a)" : "#f5f9fb",
      color: theme === "dark" ? "#eaeaea" : "#111",
    };
  }

  function cardStyle(theme) {
    return {
      ...styles.card,
      background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#fff",
      border: theme === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid #e6eaf0",
      color: theme === "dark" ? "#eaeaea" : "#111",
    };
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

  function renderMyBetsPanel() {
    const myBets = Object.values(votes).filter((v) => v.votes?.some((x) => x.userId === user?._id));
    if (!myBets.length) return <div style={styles.myBetsEmpty}>No bets yet. Vote in the market to see them here.</div>;

    return (
      <div style={styles.myBetsList}>
        {myBets.map((p) => {
          const myVote = p.votes.find((v) => v.userId === user?._id)?.choice;

          // votes don’t carry question; lookup from predictionsList (weekly/server/local)
          const meta = predictionsList.find((x) => x.pid === p.pid);
          const questionText = meta?.question || `Prediction ${p.pid}`;

          return (
            <div key={p.pid} style={styles.myBetItem}>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme === "dark" ? "#fff" : "#111" }}>
                {p.pid} · {questionText}
              </div>
              <div style={{ fontSize: 13, color: "#9a9a9a" }}>{myVote}</div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- prepare list for rendering ---------- */
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

  /* ---------- loading UI ---------- */
  if (authLoading) {
    return (
      <main style={pageStyle(theme)}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: theme === "dark" ? "#9a9a9a" : "#444" }}>
          Loading…
        </div>
      </main>
    );
  }

  /* ---------- UI (main) ---------- */
  return (
    <main style={pageStyle(theme)}>
      <style>{commonCss(theme)}</style>

      <header style={{ ...styles.header, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 12 : 8 }}>
        <div style={styles.brandWrap}>
          <img src="/logo.png" alt="Ritual" style={styles.logo} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, color: theme === "dark" ? "#eaeaea" : "#111" }}>Ritual Market Place</h1>
            <p style={{ margin: 0, fontSize: 12, color: theme === "dark" ? "#9a9a9a" : "#666" }}>Collective intelligence, live</p>
          </div>
        </div>

        <div style={{ ...styles.rightControls, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-end", gap: 8 }} className="right-controls">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setView("market")} style={{ ...styles.tabBtn, ...(view === "market" ? styles.tabActive : {}), color: theme === "dark" ? "#eaeaea" : "#111" }}>
              Market
            </button>
            <button onClick={() => { setView("history"); fetchHistory(); }} style={{ ...styles.tabBtn, ...(view === "history" ? styles.tabActive : {}), color: theme === "dark" ? "#eaeaea" : "#111" }}>
              History
            </button>
            <button onClick={() => { setView("leaderboard"); fetchLeaderboard(); }} style={{ ...styles.tabBtn, ...(view === "leaderboard" ? styles.tabActive : {}), color: theme === "dark" ? "#eaeaea" : "#111" }}>
              Leaderboard
            </button>
            <button onClick={() => { setView("polymarket"); fetchPolymarket(searchQuery,polySort ); }} style={{ ...styles.tabBtn, ...(view === "polymarket" ? styles.tabActive : {}), color: theme === "dark" ? "#eaeaea" : "#111" }}>
              Polymarket
            </button>

          
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} style={styles.secondaryBtn}>
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <button onClick={openAddModal} style={styles.secondaryBtn}>Add prediction</button>

            <button
              onClick={claimFaucet}
              disabled={remainingMs > 0}
              className={`faucet-btn ${faucetPulse ? "pulse" : ""}`}
              style={{ ...styles.faucetBtn, opacity: remainingMs > 0 ? 0.6 : 1, padding: isMobile ? "10px" : "6px 10px" }}
            >
              {remainingMs > 0 ? formatTime(remainingMs) : "+10 Faucet"}
            </button>

            {user ? (
              <>
                <div style={{ fontSize: 13, color: theme === "dark" ? "#cfcfcf" : "#444" }}>
                  Hi, <strong style={{ color: theme === "dark" ? "#fff" : "#111" }}>{user.username}</strong>
                </div>
                <button onClick={logout} style={styles.logoutBtn}>Logout</button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setMode("login"); }} style={{ ...styles.primaryBtn, padding: "8px 12px", fontSize: 13 }}>
                Login / Sign up
              </button>
            )}
          </div>
        </div>
      </header>

      <section style={styles.container}>
        {/* Optional: show "My Bets" in market view */}
        {view === "market" && (
          <>

            <div className="view-panel">
              <div className="grid" style={{ ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {combined.map((p) => {
                  const v = votes[p.pid] || { yes: p.yes ?? 0, no: p.no ?? 0, votes: p.votes ?? [] };
                  const myVote = v.votes?.find((vt) => vt.userId === user?._id)?.choice;
                  const total = Math.max(1, (v.yes || 0) + (v.no || 0));
                  const yesPct = Math.round(((v.yes || 0) / total) * 100);
                  const noPct = 100 - yesPct;

                  const questionText =
                    p.question && String(p.question).trim()
                      ? String(p.question).trim()
                      : WEEKLY_PREDICTIONS.find((w) => w.pid === p.pid)?.question || `Prediction ${p.pid}`;

                  return (
                    <div key={p.pid} style={cardStyle(theme)} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={styles.questionWrap}>
                          <h3 className="question" style={{ ...styles.question, color: theme === "dark" ? "#fff" : "#111" }}>
                            {questionText}
                          </h3>
                      {p.source === "client" && p.pending && (
  <div style={{ fontSize: 11, color: "#9a9a9a", marginTop: 6 }}>
    Pending approval
  </div>
)}

{p.source === "client" && !p.pending && (
  <div style={{ fontSize: 11, color: "#9a9a9a", marginTop: 6 }}>
    Local
  </div>
)}
  </div>
                        <div style={{ fontSize: 12, color: theme === "dark" ? "#bfbfbf" : "#666" }}>{null}</div>
                      </div>

                      <div style={styles.voteRow} className="vote-row">
                        <button
                          className="vote-btn"
                          disabled={voting?.pid === p.pid}
                          onClick={() => vote(p.pid, "YES")}
                          style={{
                            ...styles.yesBtn,
                            opacity: voting?.pid === p.pid ? 0.6 : 1,
                            background: myVote === "YES" ? "#1f7a4a" : theme === "dark" ? "rgba(31,122,74,0.18)" : "#e6f3e9",
                            color: theme === "dark" ? "#fff" : "#0b4d22",
                          }}
                        >
                          {p.yesLabel || "YES"}
                        </button>

                        <button
                          className="vote-btn"
                          disabled={voting?.pid === p.pid}
                          onClick={() => vote(p.pid, "NO")}
                          style={{
                            ...styles.noBtn,
                            opacity: voting?.pid === p.pid ? 0.6 : 1,
                            background: myVote === "NO" ? "#7a1f1f" : theme === "dark" ? "rgba(122,31,31,0.12)" : "#fdecec",
                            color: theme === "dark" ? "#fff" : "#500000",
                          }}
                        >
                          {p.noLabel || "NO"}
                        </button>
                      </div>

                      <div style={styles.removeVoteWrap}>
                        {myVote && <button onClick={() => removeVote(p.pid)} style={styles.removeVote}>Remove vote</button>}
                      </div>

                      <div className="bar" style={{ ...styles.bar, background: theme === "dark" ? "#111" : "#f1f5f9" }}>
                        <div className="bar-yes" style={{ ...styles.barYes, width: `${yesPct}%` }} />
                        <div className="bar-no" style={{ ...styles.barNo, width: `${noPct}%` }} />
                      </div>

                      <div style={styles.meta}>
                        <span style={{ color: theme === "dark" ? "#cfe9d7" : "#0b4d22" }}>YES {yesPct}%</span>
                        <span style={{ color: theme === "dark" ? "#f4cfcf" : "#5b1f1f" }}>NO {noPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Polymarket view: read Polymarket prices, vote with Ritual credits */}
        {view === "polymarket" && (
          <div className="view-panel">
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
  </div>
  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
  <button
    onClick={() => setPolySort("trending")}
    style={{ ...styles.secondaryBtn, ...(polySort === "trending" ? styles.tabActive : {}) }}
  >
    Trending
  </button>

  <button
    onClick={() => setPolySort("new")}
    style={{ ...styles.secondaryBtn, ...(polySort === "new" ? styles.tabActive : {}) }}
  >
    Newest
  </button>

  <button
    onClick={() => setPolySort("volume")}
    style={{ ...styles.secondaryBtn, ...(polySort === "volume" ? styles.tabActive : {}) }}
  >
    Volume
  </button>
</div>

            <h2 style={styles.sectionTitle}>Polymarket feed</h2>
            {polyLoading && <div style={styles.empty}>Loading markets…</div>}
            {polyError && <div style={styles.error}>{polyError}</div>}

            <div className="grid" style={{ ...styles.grid, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))" }}>
              {(polyMarkets || []).map((m) => {
                // ✅ Ritual-only pid for Polymarket market
                const ritualPid = `poly-${m.id}`;

                const v = votes[ritualPid] || { yes: 0, no: 0, votes: [] };
                const myVote = v.votes?.find((vt) => vt.userId === user?._id)?.choice;

                const total = Math.max(1, (v.yes || 0) + (v.no || 0));
                const ritualYesPct = Math.round(((v.yes || 0) / total) * 100);
                const ritualNoPct = 100 - ritualYesPct;

                const outcomes = Array.isArray(m.outcomes) ? m.outcomes : [];
                const yes = outcomes.find((o) => (o.name || "").toLowerCase().includes("yes")) || outcomes[0];
                const no = outcomes.find((o) => (o.name || "").toLowerCase().includes("no")) || outcomes[1];
                const yesPrice = yes?.price != null ? Math.round(Number(yes.price) * 100) : null;
                const noPrice = no?.price != null ? Math.round(Number(no.price) * 100) : null;

                return (
                  <div key={m.id} style={cardStyle(theme)} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <h3 className="question" style={{ ...styles.question, color: theme === "dark" ? "#fff" : "#111" }}>
                          {m.title}
                        </h3>

                        <div style={{ marginTop: 6, fontSize: 12, color: theme === "dark" ? "#9a9a9a" : "#666" }}>
                        </div>

                        <div style={{ marginTop: 6, fontSize: 12, color: theme === "dark" ? "#9a9a9a" : "#666" }}>
                          Vol: {m.volume != null ? formatCompact(m.volume) : "—"} · Liq: {m.liquidity != null ? formatCompact(m.liquidity) : "—"}
                        </div>

                        <div style={{ marginTop: 10, fontSize: 12, color: theme === "dark" ? "#9a9a9a" : "#666" }}>
                        </div>
                      </div>

                      {m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            color: theme === "dark" ? "#9a9a9a" : "#666",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                        >
                          Open ↗
                        </a>
                      ) : null}
                    </div>

                    {/* ✅ Ritual voting buttons on Polymarket cards */}
                    <div style={styles.voteRow} className="vote-row">
                      <button
                        className="vote-btn"
                        disabled={voting?.pid === ritualPid}
                        onClick={() => vote(ritualPid, "YES")}
                        style={{
                          ...styles.yesBtn,
                          opacity: voting?.pid === ritualPid ? 0.6 : 1,
                          background: myVote === "YES" ? "#1f7a4a" : theme === "dark" ? "rgba(31,122,74,0.18)" : "#e6f3e9",
                          color: theme === "dark" ? "#fff" : "#0b4d22",
                        }}
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
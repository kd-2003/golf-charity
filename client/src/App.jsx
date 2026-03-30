import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useParams } from "react-router-dom";
import api, { setToken } from "./api";

function Layout({ user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand" onClick={closeMobileMenu}>
          <h1>Golf Charity Platform</h1>
        </Link>
        <button type="button" className="menu-btn" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? "Close" : "Menu"}
        </button>
        <nav className={mobileOpen ? "mobile-open" : ""}>
          <Link to="/" onClick={closeMobileMenu}>Home</Link>
          <Link to="/charities" onClick={closeMobileMenu}>Charities</Link>
          <Link to="/how-it-works" onClick={closeMobileMenu}>How draws work</Link>
          {!user ? (
            <Link to="/login" onClick={closeMobileMenu}>Login</Link>
          ) : (
            <Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
          )}
          {user?.role === "admin" && <Link to="/admin" onClick={closeMobileMenu}>Admin</Link>}
          {!user ? (
            <Link to="/register" onClick={closeMobileMenu}>Subscribe</Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onLogout();
                closeMobileMenu();
              }}
            >
              Logout
            </button>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

function Home({ charities }) {
  const featured = charities.filter((c) => c.featured).slice(0, 3);
  const show = featured.length ? featured : charities.slice(0, 3);

  return (
    <section className="hero-section fade-in">
      <p className="eyebrow">Impact-first · Monthly draws · Your scores matter</p>
      <h2>Turn every round into hope</h2>
      <p className="lede">
        Subscribe, log your last five Stableford scores, and join a monthly prize draw — while a
        meaningful slice of every payment supports a charity you choose.
      </p>
      <div className="cta-row">
        <Link className="btn-primary" to="/register">Start your subscription</Link>
        <Link className="btn-ghost" to="/charities">Explore charities</Link>
      </div>
      <div className="steps">
        <article className="card micro">
          <h4>1 · Subscribe</h4>
          <p>Monthly or yearly plan. Secure checkout via Stripe.</p>
        </article>
        <article className="card micro">
          <h4>2 · Score &amp; support</h4>
          <p>Keep five Stableford scores current. Pick your charity share (min 10%).</p>
        </article>
        <article className="card micro">
          <h4>3 · Draw &amp; win</h4>
          <p>5, 4, or 3 number matches split the pool. Jackpot can roll if no top match.</p>
        </article>
      </div>
      <h3>Spotlight charities</h3>
      <div className="grid">
        {show.map((c) => (
          <Link key={c._id} to={`/charities/${c._id}`} className="card charity-card">
            {c.imageUrl && <img src={c.imageUrl} alt="" className="thumb" />}
            <h4>{c.name}</h4>
            <p>{c.description?.slice(0, 120)}{c.description?.length > 120 ? "…" : ""}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CharitiesPage() {
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    api.get("/charities").then((r) => setAll(r.data)).catch(() => setAll([]));
  }, []);

  const allTags = [...new Set(all.flatMap((c) => c.tags || []))];
  const list = all.filter((c) => {
    const nameOk = !q || c.name.toLowerCase().includes(q.toLowerCase());
    const tagOk = !tag || (c.tags || []).includes(tag);
    return nameOk && tagOk;
  });

  return (
    <section>
      <h2>Charity directory</h2>
      <p className="lede">Search and filter partners. Open a profile for events and full story.</p>
      <div className="filters">
        <input placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">All causes</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="grid">
        {list.map((c) => (
          <Link key={c._id} to={`/charities/${c._id}`} className="card charity-card">
            {c.featured && <span className="badge">Featured</span>}
            {c.imageUrl && <img src={c.imageUrl} alt="" className="thumb" />}
            <h4>{c.name}</h4>
            <p>{c.description?.slice(0, 140)}{c.description?.length > 140 ? "…" : ""}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CharityDetailPage() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/charities/${id}`).then((r) => setC(r.data)).catch(() => setErr("Charity not found"));
  }, [id]);

  if (err) return <p className="error-text">{err}</p>;
  if (!c) return <p>Loading…</p>;

  return (
    <article className="card detail">
      {c.imageUrl && <img src={c.imageUrl} alt="" className="hero-img" />}
      <h2>{c.name}</h2>
      <p>{c.description}</p>
      {c.tags?.length > 0 && (
        <p className="tags">{c.tags.map((t) => <span key={t} className="tag">{t}</span>)}</p>
      )}
      {c.upcomingEvents?.length > 0 && (
        <>
          <h3>Upcoming events</h3>
          <ul>
            {c.upcomingEvents.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </>
      )}
      <Link className="btn-primary" to="/register">Subscribe &amp; support</Link>
    </article>
  );
}

function HowItWorksPage() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api.get("/draws/upcoming").then((r) => setInfo(r.data)).catch(() => setInfo(null));
  }, []);

  return (
    <section className="fade-in">
      <h2>How the monthly draw works</h2>
      <ul className="draw-rules">
        <li>Each month, admins run a <strong>simulation</strong> first, then <strong>publish</strong> official numbers.</li>
        <li>Five numbers are drawn — either <strong>random</strong> or <strong>algorithmic</strong> (weighted from community scores).</li>
        <li>Your <strong>latest five Stableford scores</strong> (1–45) are checked against the draw.</li>
        <li><strong>5-number match:</strong> 40% of the pool (jackpot; rolls if nobody matches).</li>
        <li><strong>4-number match:</strong> 35% of the pool.</li>
        <li><strong>3-number match:</strong> 25% of the pool.</li>
        <li>Multiple winners in a tier split that tier equally.</li>
      </ul>
      {info && (
        <p className="info-text">
          Calendar month: <strong>{info.currentMonthKey}</strong> · Next published cycle aligns with{" "}
          <strong>{info.nextDrawMonthKey}</strong>.
        </p>
      )}
      <Link className="btn-primary" to="/register">Join the platform</Link>
    </section>
  );
}

function AuthPage({ mode, onAuth, charities }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    charityId: "",
    charityPercent: 10,
  });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              ...(form.charityId && { charityId: form.charityId }),
              charityPercent: Number(form.charityPercent),
            };
      const { data } = await api.post(path, payload);
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Try again.");
    }
  }

  return (
    <form onSubmit={submit} className="card auth-card">
      <h2>{mode === "login" ? "Login" : "Create account"}</h2>
      {mode === "register" && (
        <>
          <input
            placeholder="Full name"
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <label className="label-text">Charity at signup (PRD)</label>
          <select
            value={form.charityId}
            onChange={(e) => setForm({ ...form, charityId: e.target.value })}
          >
            <option value="">Choose later (can set in dashboard)</option>
            {charities.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <label className="label-text">Contribution % (min 10)</label>
          <input
            type="number"
            min="10"
            max="100"
            value={form.charityPercent}
            onChange={(e) => setForm({ ...form, charityPercent: e.target.value })}
          />
        </>
      )}
      <input
        placeholder="Email"
        type="email"
        required
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        required
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

function Dashboard({ user, charities, refreshUser }) {
  const [score, setScore] = useState({ value: "", date: "" });
  const [profile, setProfile] = useState({
    charityId: user?.charity?._id || "",
    charityPercent: user?.charityPercent || 10,
  });
  const [plan, setPlan] = useState(user?.subscriptionPlan || "monthly");
  const [scoreMessage, setScoreMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [participation, setParticipation] = useState(null);
  const [winnings, setWinnings] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ value: "", date: "" });
  const [donationAmt, setDonationAmt] = useState("");
  const [proof, setProof] = useState({ drawId: "", note: "", proofImageUrl: "" });

  const subscriptionActive = user.subscriptionStatus === "active";

  useEffect(() => {
    api.get("/users/me/participation").then((r) => setParticipation(r.data)).catch(() => {});
    api.get("/users/me/winnings").then((r) => setWinnings(r.data)).catch(() => setWinnings([]));
  }, [user]);

  async function addScore(e) {
    e.preventDefault();
    setScoreMessage("");
    try {
      await api.post("/users/scores", { value: Number(score.value), date: score.date });
      setScore({ value: "", date: "" });
      await refreshUser();
      setScoreMessage("Score saved.");
    } catch (err) {
      setScoreMessage(err.response?.data?.message || "Failed to save score.");
    }
  }

  async function saveEditScore(e) {
    e.preventDefault();
    setScoreMessage("");
    try {
      await api.put(`/users/scores/${editIdx}`, {
        value: Number(editForm.value),
        date: editForm.date,
      });
      setEditIdx(null);
      await refreshUser();
      setScoreMessage("Score updated.");
    } catch (err) {
      setScoreMessage(err.response?.data?.message || "Update failed.");
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMessage("");
    try {
      await api.put("/users/me", {
        charityId: profile.charityId || undefined,
        charityPercent: Number(profile.charityPercent),
      });
      await refreshUser();
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileMessage(err.response?.data?.message || "Failed to update profile.");
    }
  }

  async function subscribeNow() {
    setScoreMessage("");
    try {
      const { data } = await api.post("/billing/checkout-session", { plan });
      if (data?.url) window.location.href = data.url;
      else setScoreMessage("Unable to create checkout session.");
    } catch (err) {
      setScoreMessage(err.response?.data?.message || "Checkout failed.");
    }
  }

  async function manageSubscription() {
    setScoreMessage("");
    try {
      const { data } = await api.post("/billing/portal-session");
      if (data?.url) window.location.href = data.url;
      else setScoreMessage("Unable to open billing portal.");
    } catch (err) {
      setScoreMessage(err.response?.data?.message || "Portal failed.");
    }
  }

  async function submitDonation(e) {
    e.preventDefault();
    setScoreMessage("");
    try {
      await api.post("/users/donation", { amount: Number(donationAmt) });
      setDonationAmt("");
      await refreshUser();
      setScoreMessage("Donation recorded. Thank you.");
    } catch (err) {
      setScoreMessage(err.response?.data?.message || "Donation failed.");
    }
  }

  async function submitProof(e) {
    e.preventDefault();
    setScoreMessage("");
    try {
      await api.post("/users/winner-proof", proof);
      setProof({ drawId: "", note: "", proofImageUrl: "" });
      setScoreMessage("Proof submitted for admin review.");
    } catch (err) {
      setScoreMessage(err.response?.data?.message || "Proof upload failed.");
    }
  }

  return (
    <section className="grid">
      <article className="card">
        <h3>Subscription</h3>
        <p>Status: {user.subscriptionStatus}</p>
        <p>Plan: {user.subscriptionPlan}</p>
        <p>Renewal: {user.renewalDate ? new Date(user.renewalDate).toLocaleDateString() : "N/A"}</p>
        {participation && (
          <p className="muted">
            Est. subscription charity share (per cycle): Rs {participation.subscriptionCharityShareEstimate}
          </p>
        )}
        {!subscriptionActive && (
          <>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button type="button" onClick={subscribeNow}>Subscribe Now</button>
          </>
        )}
        {subscriptionActive && user.stripeCustomerId && (
          <button type="button" className="btn-secondary" onClick={manageSubscription}>
            Manage or cancel subscription
          </button>
        )}
      </article>

      <article className="card">
        <h3>Participation</h3>
        {participation ? (
          <>
            <p>Draws entered (published months): {participation.drawsEntered}</p>
            <p>Eligible (active + 5 scores): {participation.eligibleForDraw ? "Yes" : "No"}</p>
            <p>Scores on file: {participation.scoresCount} / 5</p>
            <p className="muted">Last published month: {participation.lastPublishedMonthKey || "—"}</p>
            <p className="muted">Next cycle key: {participation.nextDrawMonthKey}</p>
          </>
        ) : (
          <p>Loading…</p>
        )}
      </article>

      <article className="card">
        <h3>Stableford scores (max 5, newest first)</h3>
        {!subscriptionActive && (
          <p className="warn-text">Active subscription required to add or edit scores.</p>
        )}
        <form onSubmit={addScore}>
          <input
            type="number"
            min="1"
            max="45"
            value={score.value}
            onChange={(e) => setScore({ ...score, value: e.target.value })}
            placeholder="Score 1-45"
            disabled={!subscriptionActive}
          />
          <input
            type="date"
            value={score.date}
            onChange={(e) => setScore({ ...score, date: e.target.value })}
            disabled={!subscriptionActive}
          />
          <button type="submit" disabled={!subscriptionActive}>Add / roll score</button>
        </form>
        {scoreMessage && <p className="info-text">{scoreMessage}</p>}
        <ul className="score-list">
          {(user.scores || []).map((s, i) => (
            <li key={i}>
              {s.value} · {new Date(s.date).toLocaleDateString()}
              {subscriptionActive && (
                <button
                  type="button"
                  className="linkish"
                  onClick={() => {
                    setEditIdx(i);
                    const d = typeof s.date === "string" ? s.date.slice(0, 10) : new Date(s.date).toISOString().slice(0, 10);
                    setEditForm({ value: s.value, date: d });
                  }}
                >
                  Edit
                </button>
              )}
            </li>
          ))}
        </ul>
        {editIdx !== null && (
          <form className="inline-edit" onSubmit={saveEditScore}>
            <h4>Edit score #{editIdx + 1}</h4>
            <input
              type="number"
              min="1"
              max="45"
              value={editForm.value}
              onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
            />
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
            <button type="submit">Save</button>
            <button type="button" className="btn-secondary" onClick={() => setEditIdx(null)}>Cancel</button>
          </form>
        )}
      </article>

      <form className="card" onSubmit={saveProfile}>
        <h3>Charity &amp; contribution</h3>
        <select
          value={profile.charityId}
          onChange={(e) => setProfile({ ...profile, charityId: e.target.value })}
        >
          <option value="">Select charity</option>
          {charities.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          min="10"
          max="100"
          value={profile.charityPercent}
          onChange={(e) => setProfile({ ...profile, charityPercent: e.target.value })}
        />
        <button type="submit">Update</button>
        {profileMessage && <p className="info-text">{profileMessage}</p>}
      </form>

      <form className="card" onSubmit={submitDonation}>
        <h3>Independent donation</h3>
        <p className="muted">Optional top-up — not tied to the draw (PRD).</p>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Amount (Rs)"
          value={donationAmt}
          onChange={(e) => setDonationAmt(e.target.value)}
        />
        <button type="submit">Donate</button>
        <p className="muted">Your total extra gifts: Rs {user.independentDonationsTotal || 0}</p>
      </form>

      <article className="card">
        <h3>Winnings &amp; payouts</h3>
        <p>Running total (amounts credited at publish): Rs {user.totalWon || 0}</p>
        {winnings.length === 0 && <p className="muted">No wins yet.</p>}
        <ul>
          {winnings.map((w, i) => (
            <li key={i}>
              {w.monthKey}: {w.matches}-match · Rs {Math.round(w.amount)} ·{" "}
              <strong>{w.paymentStatus}</strong>
            </li>
          ))}
        </ul>
      </article>

      <form className="card" onSubmit={submitProof}>
        <h3>Winner verification (proof)</h3>
        <p className="muted">Winners only — upload a link to your score screenshot.</p>
        <select
          value={proof.drawId}
          onChange={(e) => setProof({ ...proof, drawId: e.target.value })}
        >
          <option value="">Select winning draw</option>
          {winnings.map((w) => (
            <option key={`${w.drawId}-${w.monthKey}`} value={w.drawId}>
              {w.monthKey} ({w.matches}-match)
            </option>
          ))}
        </select>
        <input
          placeholder="Proof image URL"
          value={proof.proofImageUrl}
          onChange={(e) => setProof({ ...proof, proofImageUrl: e.target.value })}
        />
        <input
          placeholder="Note to admin"
          value={proof.note}
          onChange={(e) => setProof({ ...proof, note: e.target.value })}
        />
        <button type="submit">Submit proof</button>
      </form>
    </section>
  );
}

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [sim, setSim] = useState(null);
  const [users, setUsers] = useState([]);
  const [draws, setDraws] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [message, setMessage] = useState("");
  const [monthKey, setMonthKey] = useState("");
  const [drawMode, setDrawMode] = useState("random");
  const [charityForm, setCharityForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    featured: false,
    tags: "",
    events: "",
  });
  const [scoresUserId, setScoresUserId] = useState("");
  const [scoresJson, setScoresJson] = useState("[]");

  async function loadData() {
    const [dashboardRes, usersRes, drawsRes, proofsRes] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/users"),
      api.get("/admin/draws"),
      api.get("/admin/winner-proofs"),
    ]);
    setStats(dashboardRes.data);
    setUsers(usersRes.data);
    setDraws(drawsRes.data);
    setProofs(proofsRes.data);
  }

  useEffect(() => {
    loadData().catch((err) =>
      setMessage(err.response?.data?.message || "Failed to load admin data.")
    );
  }, []);

  async function runSimulation(mode) {
    setMessage("");
    try {
      const { data } = await api.post("/draws/simulate", { mode });
      setSim(data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Simulation failed.");
    }
  }

  async function saveDraft() {
    setMessage("");
    try {
      await api.post("/draws/draft", { monthKey, mode: drawMode });
      setMessage("Draft saved (simulation stored, not published).");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Draft save failed.");
    }
  }

  async function publishDraw() {
    setMessage("");
    try {
      await api.post("/draws/publish", { monthKey, mode: drawMode });
      setMessage("Draw published.");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Publish failed.");
    }
  }

  async function toggleSubscription(userId, isActive) {
    setMessage("");
    try {
      await api.patch(`/admin/users/${userId}/subscription`, { active: !isActive });
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Subscription update failed.");
    }
  }

  async function createCharity(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/charities", {
        name: charityForm.name,
        description: charityForm.description,
        imageUrl: charityForm.imageUrl || undefined,
        featured: charityForm.featured,
        tags: charityForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        upcomingEvents: charityForm.events.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setCharityForm({ name: "", description: "", imageUrl: "", featured: false, tags: "", events: "" });
      setMessage("Charity created.");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Charity create failed.");
    }
  }

  async function applyScores(e) {
    e.preventDefault();
    setMessage("");
    try {
      const scores = JSON.parse(scoresJson);
      await api.put(`/admin/users/${scoresUserId}/scores`, { scores });
      setMessage("Scores updated.");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid JSON or request failed.");
    }
  }

  async function reviewProof(id, status) {
    setMessage("");
    try {
      await api.put(`/admin/winner-proofs/${id}`, { status });
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Review failed.");
    }
  }

  async function markPaid(drawId, userId) {
    setMessage("");
    try {
      await api.patch(`/admin/draws/${drawId}/winners/payment`, { userId, paymentStatus: "paid" });
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Payout update failed.");
    }
  }

  return (
    <section className="grid admin-grid">
      <article className="card">
        <h3>Analytics</h3>
        <p>Users: {stats?.totalUsers ?? "—"}</p>
        <p>Prize pool (sum of draws): Rs {stats?.totalPrizePool ?? "—"}</p>
        <p>Charity contributions: Rs {stats?.charityTotal ?? "—"}</p>
        <p>Draw records: {stats?.draws ?? "—"} (published: {stats?.publishedDraws ?? "—"}, drafts: {stats?.draftDraws ?? "—"})</p>
      </article>

      <article className="card">
        <h3>Draw management (PRD)</h3>
        <label className="label-text">Month key (YYYY-MM)</label>
        <input value={monthKey} onChange={(e) => setMonthKey(e.target.value)} placeholder="2026-04" />
        <select value={drawMode} onChange={(e) => setDrawMode(e.target.value)}>
          <option value="random">Random</option>
          <option value="algorithmic">Algorithmic</option>
        </select>
        <div className="btn-row">
          <button type="button" onClick={() => runSimulation(drawMode)}>Simulate only</button>
          <button type="button" onClick={saveDraft}>Save draft</button>
          <button type="button" className="btn-warn" onClick={publishDraw}>Publish results</button>
        </div>
        {sim && (
          <p className="info-text">{sim.mode}: {sim.simulatedNumbers?.join(", ")}</p>
        )}
      </article>

      <article className="card span-2">
        <h3>Published draws &amp; payouts</h3>
        <div className="draw-admin-list">
          {draws.filter((d) => d.published).map((d) => (
            <div key={d._id} className="draw-block">
              <strong>{d.monthKey}</strong> · nums: {d.drawNumbers?.join(", ")} · jackpot carry in: Rs {d.jackpotCarryIn || 0}
              <ul>
                {(d.winners || []).map((w, i) => (
                  <li key={i}>
                    User {String(w.user).slice(-6)} · {w.matches}-match · Rs {Math.round(w.amount)} · {w.paymentStatus}
                    {w.paymentStatus === "pending" && (
                      <button type="button" className="linkish" onClick={() => markPaid(d._id, w.user)}>
                        Mark paid
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>

      <article className="card">
        <h3>User subscriptions</h3>
        <div className="user-list">
          {users.map((u) => (
            <div className="user-row" key={u._id}>
              <div>
                <strong>{u.name}</strong>
                <p className="muted">{u.email}</p>
                <p>Status: {u.subscriptionStatus}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleSubscription(u._id, u.subscriptionStatus === "active")}
              >
                {u.subscriptionStatus === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </article>

      <form className="card" onSubmit={createCharity}>
        <h3>Add charity</h3>
        <input placeholder="Name" value={charityForm.name} onChange={(e) => setCharityForm({ ...charityForm, name: e.target.value })} required />
        <textarea placeholder="Description" value={charityForm.description} onChange={(e) => setCharityForm({ ...charityForm, description: e.target.value })} required />
        <input placeholder="Image URL" value={charityForm.imageUrl} onChange={(e) => setCharityForm({ ...charityForm, imageUrl: e.target.value })} />
        <label className="inline-check">
          <input type="checkbox" checked={charityForm.featured} onChange={(e) => setCharityForm({ ...charityForm, featured: e.target.checked })} />
          Featured
        </label>
        <input placeholder="Tags (comma)" value={charityForm.tags} onChange={(e) => setCharityForm({ ...charityForm, tags: e.target.value })} />
        <input placeholder="Upcoming events (comma)" value={charityForm.events} onChange={(e) => setCharityForm({ ...charityForm, events: e.target.value })} />
        <button type="submit">Create charity</button>
      </form>

      <form className="card span-2" onSubmit={applyScores}>
        <h3>Edit user scores (admin)</h3>
        <select value={scoresUserId} onChange={(e) => setScoresUserId(e.target.value)} required>
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>
        <textarea
          rows={4}
          value={scoresJson}
          onChange={(e) => setScoresJson(e.target.value)}
          placeholder='[{"value":36,"date":"2026-03-01"}, ...]'
        />
        <button type="submit">Apply scores</button>
      </form>

      <article className="card span-2">
        <h3>Winner proofs</h3>
        <div className="user-list">
          {proofs.map((p) => (
            <div className="user-row" key={p._id}>
              <div>
                <p>User: {p.user?.email} · Draw: {p.draw?.monthKey}</p>
                <p className="muted">{p.proofImageUrl}</p>
                <p>Status: {p.status}</p>
              </div>
              <div className="btn-row">
                <button type="button" onClick={() => reviewProof(p._id, "approved")}>Approve</button>
                <button type="button" className="btn-warn" onClick={() => reviewProof(p._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </article>

      {message && <p className="error-text span-2">{message}</p>}
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [charities, setCharities] = useState([]);

  async function refreshUser() {
    const { data } = await api.get("/users/me");
    setUser(data);
  }

  useEffect(() => {
    api
      .get("/charities")
      .then((r) => setCharities(r.data))
      .catch(() => setCharities([]));
    if (localStorage.getItem("token")) {
      refreshUser().catch(() => {
        setToken(null);
        setUser(null);
      });
    }
  }, []);

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Home charities={charities} />} />
        <Route path="/charities" element={<CharitiesPage />} />
        <Route path="/charities/:id" element={<CharityDetailPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <AuthPage mode="login" onAuth={setUser} charities={charities} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <AuthPage mode="register" onAuth={setUser} charities={charities} />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} charities={charities} refreshUser={refreshUser} /> : <Navigate to="/login" />}
        />
        <Route path="/admin" element={user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

import { useEffect, useMemo, useState } from "react";
import "./style.css";

const CATS = ["Technology", "Education", "Lifestyle", "News"];
const read = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function seed() {
  if (!read("users", []).length) {
    write("users", [{ id: "a1", name: "Admin", email: "admin@cms.com", password: "admin123", role: "admin" }]);
  }
  if (!read("posts", []).length) {
    write("posts", [
      { id: uid(), title: "Welcome to the CMS", category: "News", content: "This is the first published article. Admins manage content, users read and contribute.", author: "Admin", authorId: "a1", status: "published", date: new Date().toLocaleDateString(), comments: [] },
      { id: uid(), title: "Why Flexbox and Grid matter", category: "Technology", content: "CSS Grid handles two-dimensional layouts while Flexbox excels at one-dimensional alignment.", author: "Admin", authorId: "a1", status: "published", date: new Date().toLocaleDateString(), comments: [] }
    ]);
  }
}
seed();

function App() {
  const [users, setUsers] = useState(() => read("users", []));
  const [posts, setPosts] = useState(() => read("posts", []));
  const [session, setSession] = useState(() => read("session", null));
  const [theme, setTheme] = useState(() => read("theme", "light"));
  const [page, setPage] = useState(() => read("session", null) ? (read("session", null).role === "admin" ? "admin" : "user") : "home");
  const [tab, setTab] = useState("dash");
  const [authMode, setAuthMode] = useState("login");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", category: CATS[0], content: "", status: "published" });
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState("");

  useEffect(() => { write("users", users); }, [users]);
  useEffect(() => { write("posts", posts); }, [posts]);
  useEffect(() => { write("session", session); }, [session]);
  useEffect(() => { write("theme", theme); document.documentElement.dataset.theme = theme; }, [theme]);

  const go = (next) => { setPage(next); setMessage(""); };
  const logout = () => { setSession(null); write("session", null); go("home"); setTab("dash"); };
  const login = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return setMessage("Invalid email or password");
    setSession({ id: found.id, name: found.name, email: found.email, role: found.role });
    go(found.role === "admin" ? "admin" : "user");
    setTab(found.role === "admin" ? "dash" : "browse");
  };
  const signup = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name")).trim();
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));
    const confirm = String(data.get("confirm"));
    if (name.length < 2) return setMessage("Enter your name");
    if (password.length < 6) return setMessage("Password must be at least 6 characters");
    if (password !== confirm) return setMessage("Passwords do not match");
    if (users.some(u => u.email === email)) return setMessage("Email already registered");
    setUsers(old => [...old, { id: uid(), name, email, password, role: "user" }]);
    setMessage("Account created. Please sign in.");
    setAuthMode("login");
  };
  const savePost = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const item = { title: String(data.get("title")).trim(), category: String(data.get("category")), content: String(data.get("content")).trim(), status: page === "user" ? "pending" : String(data.get("status") || "published") };
    if (editing) setPosts(old => old.map(p => p.id === editing ? { ...p, ...item } : p));
    else setPosts(old => [{ id: uid(), ...item, author: session.name, authorId: session.id, date: new Date().toLocaleDateString(), comments: [] }, ...old]);
    setEditing(null); setForm({ title: "", category: CATS[0], content: "", status: "published" });
    setTab(page === "admin" ? "posts" : "my");
    setMessage(page === "user" ? "Article submitted for admin approval." : "Post saved successfully.");
  };
  const editPost = (post) => {
    setEditing(post.id); setForm({ title: post.title, category: post.category, content: post.content, status: post.status });
    setTab("form");
  };
  const removePost = (id) => { if (window.confirm("Delete this post?")) setPosts(old => old.filter(p => p.id !== id)); };
  const changeStatus = (id, status) => setPosts(old => old.map(p => p.id === id ? { ...p, status } : p));
  const removeUser = (id) => { if (window.confirm("Remove this user?")) setUsers(old => old.filter(u => u.id !== id)); };
  const visiblePosts = useMemo(() => posts.filter(p => p.status === "published" && (!filter || p.category === filter) && (p.title + " " + p.content).toLowerCase().includes(search.toLowerCase())), [posts, filter, search]);
  const mine = posts.filter(p => p.authorId === session?.id);
  const openArticle = (post) => { setSelectedPost(post); setComment(""); };

  if (!session && page !== "home" && page !== "auth") { setPage("home"); }
  const header = (title) => <div className="main-header"><div><h2>{title}</h2><p>ContentHub content management workspace</p></div></div>;
  const topbar = (title, role) => <div className="top"><span className="page-title">{title}</span><span className="top-actions"><div className="user-chip"><div className="avatar">{session.name?.[0]?.toUpperCase()}</div><span className="role">{role}</span><span>{session.name}</span></div><button className="alt sm" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>🌓</button><button className="alt sm" onClick={logout}>Sign out</button></span></div>;
  const sidebar = (items) => <aside className="side"><div className="side-logo">📰 ContentHub</div><nav><div className="side-section">Navigation</div>{items.map(([id, label, icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setEditing(null); setMessage(""); }}><span className="nav-icon">{icon}</span>{label}</button>)}</nav><div className="side-footer"><button className="alt sm" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>🌓 Toggle Theme</button><button className="alt sm" onClick={logout}>→ Sign Out</button></div></aside>;

  if (page === "home") return <><nav className="nav"><b>📰 ContentHub</b><div className="row"><button className="ghost sm" onClick={() => { setAuthMode("login"); go("auth"); }}>Login</button><button className="sm" onClick={() => { setAuthMode("signup"); go("auth"); }}>Get Started</button></div></nav><header className="hero"><div className="hero-blob"/><div className="hero-blob"/><div className="hero-blob"/><div className="hero-content"><div className="hero-badge"><span/>Role-based Content Management</div><h1>Create, Manage &amp;<br/><em>Publish</em> Content</h1><p>A modern CMS where admins review and publish content, and users read, comment, and contribute articles — all without a backend.</p><div className="row"><button className="btn" onClick={() => { setAuthMode("signup"); go("auth"); }}>Get Started Free</button><button className="btn o" onClick={() => { setAuthMode("login"); go("auth"); }}>Sign In</button></div><div className="hero-stats"><div><b>2</b><small>User Roles</small></div><div><b>100%</b><small>Client-side</small></div><div><b>0</b><small>Backend Needed</small></div></div></div></header><section className="section"><div className="section-header"><span className="eyebrow">✨ Features</span><h2>Everything you need to run<br/>a content workflow</h2><p className="sub">Powerful tools for admins and contributors, built right into the browser.</p></div><div className="fgrid">{[["🛡️","Admin Module","Dashboard, post management, and full user control."],["👤","User Module","Browse, search, comment, and submit articles."],["✅","Approval Workflow","User posts stay pending until an admin approves."],["🔍","Search & Filter","Find content by keyword or category."],["🌓","Dark Mode","Switch themes anytime."],["💾","Local Storage","Data persists in your browser."]].map(x=><div className="card" key={x[1]}><div className="ic">{x[0]}</div><h4>{x[1]}</h4><p>{x[2]}</p></div>)}</div></section><footer>© 2026 ContentHub CMS · Built with React</footer></>;

  if (page === "auth") return <div className="auth"><div className="brand"><div className="brand-logo">📰 ContentHub</div><h1>{authMode === "login" ? "Welcome back." : "Start creating today."}</h1><p>Your all-in-one content management system. Publish, manage, and collaborate effortlessly.</p><ul className="brand-features"><li>Role-based admin &amp; user modules</li><li>Approval &amp; publishing workflow</li><li>Search, filter &amp; comments</li><li>React-powered interface</li></ul></div><div className="pane"><form onSubmit={authMode === "login" ? login : signup}><div className="inner"><h2>{authMode === "login" ? "Sign in 👋" : "Create account ✨"}</h2><p className="hint">{authMode === "login" ? "Enter your credentials to continue" : "Join as a contributor in seconds"}</p><div className="msg">{message}</div>{authMode === "signup" && <><label>Full name</label><input name="name" required/><label>Confirm password</label><input name="confirm" type="password" required/></>}<label>Email address</label><input name="email" type="email" required/><label>Password</label><input name="password" type="password" required/><button className="auth-submit">{authMode === "login" ? "Sign In" : "Create Account"}</button><p className="auth-switch">{authMode === "login" ? "No account?" : "Already registered?"} <a onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setMessage(""); }}>{authMode === "login" ? "Create one" : "Sign in"}</a> · <a onClick={() => go("home")}>Back Home</a></p>{authMode === "login" && <div className="demo-box">Demo admin: <b>admin@cms.com</b> / <b>admin123</b></div>}</div></form></div></div>;

  if (page === "admin") return <div className="layout">{topbar("Admin Dashboard","ADMIN")}{sidebar([["dash","Dashboard","📊"],["posts","Manage Posts","📝"],["users","Manage Users","👥"]])}<main className="main">{message && <p className="notice">{message}</p>}{tab === "dash" && <section className="tab">{header("📊 Dashboard")}<div className="stats">{[["Total Posts",posts.length],["Published",posts.filter(p=>p.status==="published").length],["Pending Review",posts.filter(p=>p.status==="pending").length],["Users",users.filter(u=>u.role==="user").length]].map(x=><div className="card" key={x[0]}><b>{x[1]}</b>{x[0]}</div>)}</div></section>}{tab === "posts" && <section className="tab">{header("📝 Manage Posts")}<button onClick={() => { setEditing(null); setForm({title:"",category:CATS[0],content:"",status:"published"}); setTab("form"); }}>+ New Post</button><div className="tbl"><table><thead><tr><th>Title</th><th>Category</th><th>Author</th><th>Status</th><th>Actions</th></tr></thead><tbody>{posts.map(p=><tr key={p.id}><td>{p.title}</td><td>{p.category}</td><td>{p.author}</td><td><span className={`tag ${p.status}`}>{p.status}</span></td><td className="act"><button className="sm alt" onClick={() => editPost(p)}>Edit</button>{p.status !== "published" ? <button className="sm ok" onClick={() => changeStatus(p.id,"published")}>Publish</button> : <button className="sm alt" onClick={() => changeStatus(p.id,"draft")}>Unpublish</button>}<button className="sm bad" onClick={() => removePost(p.id)}>Delete</button></td></tr>)}</tbody></table></div></section>}{tab === "form" && <section className="tab">{header(editing ? "Edit Post" : "New Post")}<form className="card cms-form" onSubmit={savePost}><label>Title</label><input name="title" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><label>Category</label><select name="category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select><label>Content</label><textarea name="content" rows="8" required value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/><label>Status</label><select name="status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="published">Published</option><option value="draft">Draft</option></select><button>Save Post</button> <button type="button" className="alt" onClick={()=>setTab("posts")}>Cancel</button></form></section>}{tab === "users" && <section className="tab">{header("👥 Manage Users")}<div className="tbl"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.role==="admin"?"—":<button className="sm bad" onClick={()=>removeUser(u.id)}>Remove</button>}</td></tr>)}</tbody></table></div></section>}</main></div>;

  return <div className="layout">{topbar("User Workspace","USER")}{sidebar([["browse","Browse Articles","📚"],["write","Write Article","✍️"],["my","My Posts","📂"]])}<main className="main">{message && <p className="notice">{message}</p>}{tab === "browse" && <section className="tab">{header("📚 Articles")}<div className="bar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles..."/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All categories</option>{CATS.map(c=><option key={c}>{c}</option>)}</select></div><div className="grid">{visiblePosts.map(p=><div className="card" key={p.id}><span className="tag">{p.category}</span><h4>{p.title}</h4><small>By {p.author} · {p.date}</small><p>{p.content.slice(0,120)}...</p><button className="sm" onClick={()=>openArticle(p)}>Read</button></div>)}</div>{!visiblePosts.length && <p>No articles found.</p>}</section>}{tab === "write" && <section className="tab">{header("✍️ Write Article")}<form className="card cms-form" onSubmit={savePost}><label>Title</label><input name="title" required/><label>Category</label><select name="category">{CATS.map(c=><option key={c}>{c}</option>)}</select><label>Content</label><textarea name="content" rows="9" required/><button>🚀 Submit for Review</button></form></section>}{tab === "my" && <section className="tab">{header("📂 My Posts")}<div className="tbl"><table><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Action</th></tr></thead><tbody>{mine.map(p=><tr key={p.id}><td>{p.title}</td><td>{p.category}</td><td><span className={`tag ${p.status}`}>{p.status}</span></td><td><button className="sm bad" onClick={()=>removePost(p.id)}>Delete</button></td></tr>)}</tbody></table></div></section>}</main>{selectedPost && <div className="modal-backdrop" onClick={()=>setSelectedPost(null)}><div className="article-modal card" onClick={e=>e.stopPropagation()}><button className="alt sm close-modal" onClick={()=>setSelectedPost(null)}>× Close</button><h2>{selectedPost.title}</h2><small>{selectedPost.category} · {selectedPost.author} · {selectedPost.date}</small><p>{selectedPost.content}</p><h4>Comments ({selectedPost.comments?.length || 0})</h4>{(selectedPost.comments || []).map((c,i)=><p className="comment" key={i}><b>{c.by}</b>: {c.text}</p>)}<form onSubmit={e=>{e.preventDefault();if(!comment.trim())return;const updated={...selectedPost,comments:[...(selectedPost.comments||[]),{by:session.name,text:comment.trim()}]};setPosts(old=>old.map(p=>p.id===updated.id?updated:p));setSelectedPost(updated);setComment("");}}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment..."/><button>Comment</button></form></div></div>}</div>;
}
export default App;

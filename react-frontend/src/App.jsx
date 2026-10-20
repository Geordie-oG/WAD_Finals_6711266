import { useContext, useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { UserContext } from "./context/UserContext";
import { api } from "./lib/api";
import "./App.css";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
const statusClass = (status) => `badge ${status.toLowerCase()}`;
function ErrorMessage({ error }) {
  return error ? (
    <div className="notice error" role="alert">
      {error}
    </div>
  ) : null;
}
function Layout() {
  const { user, loading, logout } = useContext(UserContext);
  const [error, setError] = useState("");
  if (loading)
    return <div className="loading">Connecting to your classroom…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      <header className="topbar">
        <Link to="/courses" className="brand">
          <span className="brand-icon">C</span> CourseSpace
          <span className="brand-dot">.</span>
        </Link>
        <nav>
          <NavLink to="/courses">
            {user.role === "Teacher" ? "My courses" : "Explore courses"}
          </NavLink>
          {user.role === "Student" && (
            <NavLink to="/enrollments">My learning</NavLink>
          )}
        </nav>
        <div className="account">
          <span>
            <strong>{user.username}</strong>
            <small>{user.role}</small>
          </span>
          <button
            className="button small secondary"
            onClick={() => logout().catch((e) => setError(e.message))}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="container">
        <ErrorMessage error={error} />
        <Outlet />
      </main>
      <footer>
        CourseSpace · Online Course Service <span>WAD_Finals 6711266</span>
      </footer>
    </>
  );
}
function Login() {
  const { user, loading, login } = useContext(UserContext);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) return <div className="loading">Connecting…</div>;
  if (user) return <Navigate to="/courses" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await login(form.get("identifier"), form.get("password"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-layout">
      <section className="login-story">
        <Link className="brand" to="/login">
          <span className="brand-icon">C</span> CourseSpace.
        </Link>
        <div>
          <p className="eyebrow">A LITTLE CURIOSITY. A NEW POSSIBILITY.</p>
          <h1>
            Your next chapter
            <br />
            starts here.
          </h1>
          <p>
            Find a course that moves you forward.
            <br />
            Learn something new, one topic at a time.
          </p>
          <div className="story-tags">
            <span>Learn with purpose</span>
            <span>Teach what you love</span>
          </div>
        </div>
        <small>ONLINE COURSE SERVICE · WAD_Finals</small>
      </section>
      <section className="login-form">
        <div className="login-card">
          <span className="eyebrow">WELCOME TO COURSESPACE</span>
          <h2>Good to see you.</h2>
          <p className="muted">Sign in to your student or teacher account.</p>
          <ErrorMessage error={error} />
          <form onSubmit={submit}>
            <label>
              Username or email
              <input
                name="identifier"
                autoComplete="username"
                placeholder="e.g. student1"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </label>
            <button className="button primary full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in →"}
            </button>
          </form>
          <p className="login-help">
            Test accounts and setup instructions are in the project README.
          </p>
        </div>
      </section>
    </div>
  );
}
function CourseCard({ course }) {
  return (
    <article className="course-card">
      <div className="card-top">
        <span className="course-symbol">
          {course.topics[0]?.slice(0, 2).toUpperCase() || "CS"}
        </span>
        <span className={statusClass(course.status)}>{course.status}</span>
      </div>
      <p className="eyebrow">{course.teacherName}</p>
      <h3>
        <Link to={`/courses/${course._id}`}>{course.name}</Link>
      </h3>
      <div className="topics">
        {course.topics.slice(0, 3).map((topic) => (
          <span key={topic}>{topic}</span>
        ))}
        {course.topics.length > 3 && <span>+{course.topics.length - 3}</span>}
      </div>
      <div className="course-meta">
        <span>◷ {course.duration} days</span>
        <span>
          {course.enrolledCount} / {course.maxStudent} students
        </span>
      </div>
      <div className="card-bottom">
        <strong>{money(course.price)}</strong>
        <Link to={`/courses/${course._id}`}>
          View course <span>↗</span>
        </Link>
      </div>
    </article>
  );
}
function Courses({ enrolled = false }) {
  const { user } = useContext(UserContext);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState({
    courses: [],
    loading: true,
    error: "",
  });
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () =>
        api(enrolled ? "/enrollment" : `/course?q=${encodeURIComponent(query)}`)
          .then((data) => {
            if (active)
              setResult({ courses: data.courses, loading: false, error: "" });
          })
          .catch((e) => {
            if (active)
              setResult({ courses: [], loading: false, error: e.message });
          }),
      200,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, enrolled]);
  const teacher = user.role === "Teacher";
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            {teacher
              ? "YOUR TEACHING STUDIO"
              : enrolled
                ? "KEEP YOUR MOMENTUM"
                : "MAKE ROOM FOR SOMETHING NEW"}
          </p>
          <h1>
            {teacher
              ? "Share what you know."
              : enrolled
                ? "Your learning journey."
                : "A good day to learn."}
          </h1>
          <p className="muted">
            {teacher
              ? "Create courses, meet your students, and manage every detail."
              : enrolled
                ? "The courses you have enrolled in, all in one place."
                : "Explore new ideas and find your next course."}
          </p>
        </div>
        {teacher && (
          <Link className="button primary" to="/courses/new">
            ＋ Create course
          </Link>
        )}
      </section>
      <div className="catalog-bar">
        <h2>
          {teacher
            ? "My courses"
            : enrolled
              ? "Enrolled courses"
              : "Explore courses"}
          <span className="count">{result.courses.length}</span>
        </h2>
        {!enrolled && (
          <label className="search">
            <span className="sr-only">Search courses or teachers</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses or teachers…"
            />
          </label>
        )}
      </div>
      <ErrorMessage error={result.error} />
      {result.loading ? (
        <div className="empty">Loading your courses…</div>
      ) : result.courses.length ? (
        <div className="course-grid">
          {result.courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>
            {enrolled ? "Your next chapter is waiting." : "No courses found."}
          </h3>
          <p>
            {enrolled
              ? "Explore courses and enroll to start learning."
              : "Try another search or create your first course."}
          </p>
          {enrolled && (
            <Link className="button primary" to="/courses">
              Explore courses
            </Link>
          )}
        </div>
      )}
    </>
  );
}
function CourseForm() {
  const { courseId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!courseId) return;
    let active = true;
    api(`/course/${courseId}`)
      .then((data) => {
        if (active) setCourse(data.course);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [courseId]);
  if (user.role !== "Teacher") return <Navigate to="/courses" replace />;
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      duration: Number(form.get("duration")),
      topics: form
        .get("topics")
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      price: Number(form.get("price")),
      maxStudent: Number(form.get("maxStudent")),
      status: form.get("status"),
    };
    try {
      const data = await api(courseId ? `/course/${courseId}` : "/course", {
        method: courseId ? "PUT" : "POST",
        body,
      });
      navigate(`/courses/${data.course._id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link
        className="back-link"
        to={courseId ? `/courses/${courseId}` : "/courses"}
      >
        ← Back
      </Link>
      <section className="page-heading">
        <div>
          <p className="eyebrow">YOUR TEACHING STUDIO</p>
          <h1>
            {courseId ? "Make it even better." : "Build a new beginning."}
          </h1>
          <p className="muted">
            {courseId
              ? "Update your course details below."
              : "Turn your knowledge into someone’s next skill."}
          </p>
        </div>
      </section>
      <ErrorMessage error={error} />
      {courseId && !course ? (
        <div className="empty">
          {error ? "Course unavailable." : "Loading course…"}
        </div>
      ) : (
        <form className="editor" key={courseId || "new"} onSubmit={submit}>
          <h2>Course details</h2>
          <label>
            Course name
            <input
              name="name"
              defaultValue={course?.name}
              maxLength={120}
              required
              placeholder="e.g. Introduction to Web Design"
            />
          </label>
          <label>
            Topics <small>Separate topics with commas or new lines</small>
            <textarea
              name="topics"
              defaultValue={course?.topics.join(", ")}
              required
              rows={3}
              placeholder="HTML, CSS, Responsive design"
            />
          </label>
          <div className="form-grid">
            <label>
              Duration (days)
              <input
                type="number"
                name="duration"
                min="1"
                max="3650"
                defaultValue={course?.duration || 7}
                required
              />
            </label>
            <label>
              Price (THB)
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                defaultValue={course?.price ?? 0}
                required
              />
            </label>
            <label>
              Max students
              <input
                type="number"
                name="maxStudent"
                min={Math.max(1, course?.enrolledCount || 0)}
                max="10000"
                defaultValue={course?.maxStudent || 20}
                required
              />
            </label>
            <label>
              Status
              <select name="status" defaultValue={course?.status || "Open"}>
                <option>Open</option>
                <option>Close</option>
                <option>Cancel</option>
              </select>
            </label>
          </div>
          <p className="muted">
            Open allows enrollment while seats remain. Close stops enrollment.
            Cancel hides the course from the student catalog.
          </p>
          <div className="form-actions">
            <Link
              className="button secondary"
              to={courseId ? `/courses/${courseId}` : "/courses"}
            >
              Cancel
            </Link>
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : courseId ? "Save changes" : "Create course"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    let active = true;
    api(`/course/${courseId}`)
      .then((data) => {
        if (active) setCourse(data.course);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [courseId]);
  async function enroll() {
    setBusy(true);
    setError("");
    try {
      await api(`/course/${courseId}/enroll`, { method: "POST" });
      const data = await api(`/course/${courseId}`);
      setCourse(data.course);
      setMessage("You’re enrolled! Find this course in My learning.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api(`/course/${courseId}`, { method: "DELETE" });
      navigate("/courses");
    } catch (e) {
      setError(e.message);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }
  const teacher = user.role === "Teacher";
  const remaining = course ? course.maxStudent - course.enrolledCount : 0;
  return (
    <>
      <Link to="/courses" className="back-link">
        ← All courses
      </Link>
      <ErrorMessage error={error} />
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
      {!course ? (
        <div className="empty">
          {error ? "Course unavailable." : "Loading course…"}
        </div>
      ) : (
        <>
          <section className="detail-header">
            <div>
              <span className={statusClass(course.status)}>
                {course.status}
              </span>
              <h1>{course.name}</h1>
              <p>
                With <strong>{course.teacherName}</strong>
              </p>
            </div>
            <div className="detail-price">
              <small>COURSE FEE</small>
              <strong>{money(course.price)}</strong>
            </div>
          </section>
          <div className="detail-grid">
            <section className="panel">
              <p className="eyebrow">WHAT YOU’LL EXPLORE</p>
              <h2>A little more about this course</h2>
              <div className="topic-list">
                {course.topics.map((topic, i) => (
                  <div key={topic}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {topic}
                  </div>
                ))}
              </div>
            </section>
            <aside className="panel enrollment-panel">
              <h2>Your course at a glance</h2>
              <dl>
                <div>
                  <dt>Duration</dt>
                  <dd>{course.duration} days</dd>
                </div>
                <div>
                  <dt>Students enrolled</dt>
                  <dd>
                    {course.enrolledCount} / {course.maxStudent}
                  </dd>
                </div>
                <div>
                  <dt>Seats remaining</dt>
                  <dd>{Math.max(remaining, 0)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{course.status}</dd>
                </div>
              </dl>
              {teacher ? (
                <>
                  <Link
                    className="button primary full"
                    to={`/courses/${courseId}/edit`}
                  >
                    Edit course
                  </Link>
                  <button
                    className="button danger full"
                    disabled={busy || course.enrolledCount > 0}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete course
                  </button>
                  {course.enrolledCount > 0 && (
                    <p className="muted">
                      Courses with enrolled students cannot be deleted.
                    </p>
                  )}
                  {confirmDelete && (
                    <div className="delete-confirm" role="alert">
                      <p>Delete this course permanently?</p>
                      <button
                        className="button danger"
                        disabled={busy}
                        onClick={remove}
                      >
                        Yes, delete course
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Keep course
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="button primary full"
                    disabled={
                      busy ||
                      course.isEnrolled ||
                      course.status !== "Open" ||
                      remaining <= 0
                    }
                    onClick={enroll}
                  >
                    {busy
                      ? "Enrolling…"
                      : course.isEnrolled
                        ? "✓ Already enrolled"
                        : course.status !== "Open"
                          ? "Enrollment closed"
                          : remaining <= 0
                            ? "Course is full"
                            : "Enroll in this course →"}
                  </button>
                  <p className="muted">
                    {course.isEnrolled
                      ? "This course is in your learning list."
                      : "Your seat is confirmed as soon as you enroll."}
                  </p>
                </>
              )}
            </aside>
          </div>
          {teacher && (
            <section className="panel students-panel">
              <h2>
                Enrolled students{" "}
                <span className="count">{course.enrolledStudents.length}</span>
              </h2>
              {course.enrolledStudents.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.enrolledStudents.map((student) => (
                        <tr key={student._id}>
                          <td>{student.username}</td>
                          <td>{student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No students enrolled yet.</p>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/new" element={<CourseForm />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/edit" element={<CourseForm />} />
          <Route path="/enrollments" element={<Courses enrolled />} />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

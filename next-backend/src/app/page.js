export default function Home() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "80px auto",
        padding: 24,
        fontFamily: "system-ui",
      }}
    >
      <h1>CourseSpace API</h1>
      <p>CSX4107 Online Course Service · 6711266</p>
      <p>Next.js backend with authenticated Teacher and Student operations.</p>
      <a href="/api/health">Check database connection</a>
    </main>
  );
}

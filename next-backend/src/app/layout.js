import "./globals.css";
export const metadata = {
  title: "CourseSpace API",
  description: "CSX4107 Online Course Service backend",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

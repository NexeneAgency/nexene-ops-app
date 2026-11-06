import "./globals.css";
export const metadata = {
  title: "Nexene Ops",
  description: "Deine Agentur. Ein Workspace.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: import("react").ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

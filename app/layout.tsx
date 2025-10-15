export const metadata = {
  title: "Fed Rate Impact Calculator",
  description: "Advisor Rescue Marketing • Plan Life Right",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f8fafc" }}>{children}</body>
    </html>
  );
}

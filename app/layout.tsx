import "../styles/globals.css";
export const metadata = { title: "Fed Rate Impact Calculator", description: "Advisor Rescue Marketing – Plan Life Right" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen bg-gray-50 text-gray-900">{children}</body></html>);
}

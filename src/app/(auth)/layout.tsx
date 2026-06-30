export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-mb-bg flex items-center justify-center p-4 overflow-y-auto">
      {children}
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col justify-center">
        {children}
      </div>
    </div>
  );
}

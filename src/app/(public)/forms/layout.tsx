import MainLayout from "@/components/layout/MainLayout";

export default function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <div className="relative">{children}</div>
    </MainLayout>
  );
}

import FloatingSpinWidget from "@/components/shared/FloatingSpinWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div>{children}</div>
      <FloatingSpinWidget />
    </>
  );
}

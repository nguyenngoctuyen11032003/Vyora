import { PageContainer } from "@/src/components/shared/page-container";

export function AppFooter() {
  return (
    <footer className="mt-20 pb-safe sm:mt-28">
      <PageContainer>
        <div aria-hidden="true" className="ruler opacity-70" />
        <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono text-subtle-foreground">Gym Training Plan · Chương trình 12 tuần</p>
          <p className="text-sm text-muted-foreground">Ưu tiên đúng kỹ thuật trước khi tăng mức tạ.</p>
        </div>
      </PageContainer>
    </footer>
  );
}

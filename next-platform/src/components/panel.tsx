import { learningEnabled } from "@/server/learning-feature";
import { WorkspaceNav } from "./workspace-nav";
export function Panel({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-layout">
      <nav className="workspace-navigation" aria-label="Çalışma alanı">
        <WorkspaceNav role={role} learning={learningEnabled()} />
      </nav>
      <div className="panel-main">{children}</div>
    </div>
  );
}

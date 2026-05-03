import { LobbyView } from "@/views/lobby/LobbyView";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <LobbyView />
    </ErrorBoundary>
  );
}

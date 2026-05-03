import { RoomView } from "@/views/room/RoomView";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <RoomView />
    </ErrorBoundary>
  );
}

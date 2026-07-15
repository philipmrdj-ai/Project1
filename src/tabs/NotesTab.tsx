import { NotesPanel } from "../components/NotesPanel";
import { BrainId } from "../state/types";
import { SectionHead } from "./shared";

export function NotesTab({ brainId }: { brainId: BrainId }) {
  return (
    <>
      <SectionHead
        title="Notes"
        sub="Infinite nested notes — drag a note onto another to nest it"
      />
      <NotesPanel brainId={brainId} />
    </>
  );
}

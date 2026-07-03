import PrintList from "./PrintList";

export const dynamic = "force-dynamic";

// Print-friendly guest sheet for the door. Uses the PIN already saved on the
// device (unlock the door list first if it isn't).
export default function DoorPrintPage() {
  return <PrintList />;
}

import { useState } from "react";
import SortableTable, { type SortableColumn } from "./component";

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  seconds: number;
  plays: number;
  added: Date;
}

const TRACKS: Track[] = [
  { id: "t01", title: "rainy window", artist: "mellow fox", bpm: 72, seconds: 154, plays: 12400, added: new Date(2026, 8, 14) },
  { id: "t02", title: "Night Bus Home", artist: "Kōhī Club", bpm: 84, seconds: 201, plays: 48900, added: new Date(2026, 6, 2) },
  { id: "t03", title: "tape loop no. 12", artist: "Sleepy Ferns", bpm: 68, seconds: 133, plays: 3150, added: new Date(2026, 9, 1) },
  { id: "t04", title: "Library at 2am", artist: "Paper Moon", bpm: 76, seconds: 187, plays: 21700, added: new Date(2026, 7, 21) },
  { id: "t05", title: "tape loop no. 9", artist: "Sleepy Ferns", bpm: 70, seconds: 129, plays: 6820, added: new Date(2026, 8, 3) },
  { id: "t06", title: "Matcha & Margins", artist: "Kōhī Club", bpm: 80, seconds: 176, plays: 15300, added: new Date(2026, 5, 18) },
  { id: "t07", title: "Snow on the Skylight", artist: "Lumen Lane", bpm: 64, seconds: 223, plays: 9640, added: new Date(2026, 9, 9) },
  { id: "t08", title: "cassette sunrise", artist: "Paper Moon", bpm: 88, seconds: 165, plays: 33800, added: new Date(2026, 4, 30) },
  { id: "t09", title: "Desk Plant Dreams", artist: "mellow fox", bpm: 72, seconds: 148, plays: 1270, added: new Date(2026, 9, 11) },
  { id: "t10", title: "Last Train, Slow Mix", artist: "Lumen Lane", bpm: 60, seconds: 245, plays: 18200, added: new Date(2026, 7, 5) },
];

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const formatLength = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const COLUMNS: SortableColumn<Track>[] = [
  { key: "title", header: "Title", value: (t) => t.title },
  { key: "artist", header: "Artist", value: (t) => t.artist },
  { key: "bpm", header: "BPM", value: (t) => t.bpm, align: "right" },
  { key: "length", header: "Length", value: (t) => t.seconds, cell: (t) => formatLength(t.seconds), align: "right" },
  { key: "plays", header: "Plays", value: (t) => t.plays, cell: (t) => compact.format(t.plays).toLowerCase(), align: "right" },
  { key: "added", header: "Added", value: (t) => t.added, cell: (t) => shortDate.format(t.added), align: "right" },
];

const STATES = ["Data", "Loading", "Empty"] as const;
type DemoState = (typeof STATES)[number];

export default function SortableTableDemo() {
  const [state, setState] = useState<DemoState>("Data");

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Demo state" className="flex self-start rounded-lg border border-[#37302a] bg-[#16130f] p-1">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={state === s}
            onClick={() => setState(s)}
            className="cursor-pointer rounded-md px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#a2977f] uppercase transition-colors outline-none hover:text-[#ece4d6] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:bg-[#37302a] aria-pressed:bg-[#282219] aria-pressed:text-[#ece4d6]"
          >
            {s}
          </button>
        ))}
      </div>

      <SortableTable
        caption="Top tracks on lofistack radio"
        columns={COLUMNS}
        rows={state === "Empty" ? [] : TRACKS}
        getRowKey={(t) => t.id}
        initialSort={{ key: "plays", direction: "descending" }}
        loading={state === "Loading"}
        emptyMessage="No tracks in this crate yet. Save one from the radio to see it here."
      />
    </div>
  );
}

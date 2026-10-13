import { useState } from "react";
import SpringBottomSheet from "./component";

interface Track {
  id: number;
  title: string;
  artist: string;
  length: string;
}

const QUEUE: Track[] = [
  { id: 1, title: "Rainy Window", artist: "mellow.wav", length: "2:48" },
  { id: 2, title: "Late Bus Home", artist: "Kofi Hart", length: "3:12" },
  { id: 3, title: "Tea Gone Cold", artist: "sleepy fox", length: "2:31" },
  { id: 4, title: "Notebook Margins", artist: "Juna & the Lamps", length: "3:05" },
  { id: 5, title: "4am Library", artist: "Oslo Loops", length: "2:57" },
  { id: 6, title: "Warm Static", artist: "cassette kid", length: "3:22" },
  { id: 7, title: "Moss on the Stairs", artist: "Pale Orchard", length: "2:44" },
  { id: 8, title: "Study Hall Ghosts", artist: "nori beats", length: "3:09" },
  { id: 9, title: "Window Seat", artist: "Amber Tapes", length: "2:36" },
  { id: 10, title: "Slow Sunday Pages", artist: "Hana Moto", length: "3:40" },
  { id: 11, title: "Lamp Light Loop", artist: "mellow.wav", length: "2:19" },
  { id: 12, title: "Last Train, No Rush", artist: "Kofi Hart", length: "3:28" },
];

const shuffled = (list: Track[]) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const footerButton =
  "flex-1 cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition-[background-color,border-color,scale] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100";

export default function SpringBottomSheetDemo() {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState(QUEUE);
  const [playingId, setPlayingId] = useState(1);
  const playing = QUEUE.find((t) => t.id === playingId);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-full bg-[#e0985f] px-6 py-3 text-[15px] font-medium text-[#16130f] transition-[background-color,scale] duration-150 outline-none hover:bg-[#f3b983] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-[#e0985f] active:scale-[0.96]"
      >
        Open play queue
      </button>
      <p className="m-0 font-mono text-[11px] text-[#a2977f]">
        now playing · {playing?.title} — {playing?.artist}
      </p>

      <SpringBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Play queue"
        description={`lofistack radio · study mix · ${queue.length} tracks`}
        snapPoints={[0.5, 0.92]}
        initialSnap={0}
        closeLabel="Close play queue"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              disabled={queue.length === 0}
              onClick={() => setQueue(shuffled(queue))}
              className={`${footerButton} border border-[#e0985f] text-[#e0985f] hover:bg-[#e0985f]/12 disabled:hover:bg-transparent`}
            >
              Shuffle
            </button>
            <button
              type="button"
              disabled={queue.length === 0}
              onClick={() => setQueue([])}
              className={`${footerButton} border border-[#37302a] bg-[#1f1b16] text-[#ece4d6] hover:border-[#4a4037] hover:bg-[#37302a] disabled:hover:border-[#37302a] disabled:hover:bg-[#1f1b16]`}
            >
              Clear queue
            </button>
          </div>
        }
      >
        {queue.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="m-0 text-sm text-[#a2977f]">Your queue is empty. Nothing up next.</p>
            <button
              type="button"
              onClick={() => setQueue(QUEUE)}
              className="cursor-pointer rounded-full px-3 py-1.5 font-mono text-xs text-[#e0985f] outline-none hover:bg-[#e0985f]/12 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:scale-[0.97]"
            >
              Restore study mix
            </button>
          </div>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
            {queue.map((track) => {
              const isPlaying = track.id === playingId;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    aria-current={isPlaying ? "true" : undefined}
                    onClick={() => setPlayingId(track.id)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-[background-color] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-[#e0985f] ${
                      isPlaying ? "bg-[#e0985f]/8 shadow-[inset_3px_0_0_#e0985f]" : "hover:bg-[#1f1b16] active:bg-[#16130f]"
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`truncate text-sm font-medium ${isPlaying ? "text-[#f3b983]" : "text-[#ece4d6]"}`}>
                        {track.title}
                      </span>
                      <span className="truncate text-xs text-[#a2977f]">
                        {isPlaying ? `now playing · ${track.artist}` : track.artist}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-[#a2977f] tabular-nums">{track.length}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </SpringBottomSheet>
    </div>
  );
}

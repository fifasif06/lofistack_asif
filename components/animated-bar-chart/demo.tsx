import { useState } from "react";
import AnimatedBarChart, { type BarDatum } from "./component";

const THIS_WEEK: BarDatum[] = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 64 },
  { label: "Thu", value: 37 },
  { label: "Fri", value: 91 },
  { label: "Sat", value: 118 },
  { label: "Sun", value: 76 },
];

const LAST_WEEK: BarDatum[] = [
  { label: "Mon", value: 35 },
  { label: "Tue", value: 47 },
  { label: "Wed", value: 29 },
  { label: "Thu", value: 66 },
  { label: "Fri", value: 54 },
  { label: "Sat", value: 83 },
  { label: "Sun", value: 102 },
];

const WEEKS = { "This week": THIS_WEEK, "Last week": LAST_WEEK };
type Week = keyof typeof WEEKS;

export default function AnimatedBarChartDemo() {
  const [week, setWeek] = useState<Week>("This week");

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Week" className="flex self-start rounded-lg border border-[#37302a] bg-[#16130f] p-1">
        {(Object.keys(WEEKS) as Week[]).map((w) => (
          <button
            key={w}
            type="button"
            aria-pressed={week === w}
            onClick={() => setWeek(w)}
            className="cursor-pointer rounded-md px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#a2977f] uppercase transition-colors outline-none hover:text-[#ece4d6] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:bg-[#37302a] aria-pressed:bg-[#282219] aria-pressed:text-[#ece4d6]"
          >
            {w}
          </button>
        ))}
      </div>

      <AnimatedBarChart
        title="Minutes listened per day"
        description={`lofistack radio · ${week.toLowerCase()}`}
        data={WEEKS[week]}
        unit="minutes"
        categoryLabel="Day"
        highlightMax
      />
    </div>
  );
}

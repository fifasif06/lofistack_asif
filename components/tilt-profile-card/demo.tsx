import { useState } from "react";
import TiltProfileCard, { type ProfileStat } from "./component";

const NAME = "Md Asif-Ud-Doula";
const ROLE = "Senior Automation Engineer L4";
const TAGS = ["Service Team Lead", "Operation Team", "Client Acquisition"];
const STATS: ProfileStat[] = [
  { label: "components", value: 30 },
  { label: "agent logs", value: 13 },
  { label: "days", value: 90 },
];

export default function TiltProfileCardDemo() {
  const [followed, setFollowed] = useState(false);

  return (
    <TiltProfileCard
      name={NAME}
      role={ROLE}
      tags={TAGS}
      stats={STATS}
      maxTilt={14}
      followed={followed}
      onFollowChange={setFollowed}
    />
  );
}

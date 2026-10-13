import SkeletonLoader from "./component";

const PLAYLIST = {
  title: "rainy window study mix",
  meta: "1 hr 12 min · tape hiss included",
  station: "lofistack radio",
  initials: "lo",
  artLabel: "side b · 5 sec preview",
};

export default function SkeletonLoaderDemo() {
  return <SkeletonLoader {...PLAYLIST} loadMs={2200} />;
}

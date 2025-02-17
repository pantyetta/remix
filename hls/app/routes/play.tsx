import Player from "~/components/player";

export default function Index() {
  return (
    <div className="w-full lg:w-4/5 xl:w-2/3">
      <Player src="https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8" />
    </div>
  );
}

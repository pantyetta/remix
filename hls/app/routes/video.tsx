import { data } from "@remix-run/react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import screenfull from "screenfull";

interface PlayerStatus {
  isPlay: boolean;
  showSubtitle: boolean;
  volume: number;
  duration: number;
  seek: number;
  load: number;
  isFullScreen: boolean;
  isControllerShow: boolean;
}

interface Qualitiy {
  level: number;
  name: string;
  codec?: string;
  bitrate?: number;
}

export default function Index() {
  const src =
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8";
  // const src =
  // "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8";
  // const src =
  // "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8";
  // const src =
  //   "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8";

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRoot = useRef(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    isPlay: false,
    showSubtitle: false,
    volume: 0.5,
    duration: 1,
    seek: 0,
    load: 0,
    isFullScreen: false,
    isControllerShow: true,
  });

  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [qualities, setQualities] = useState<Qualitiy[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setPlayerStatus((preState) => ({
          ...preState,
          duration: video.duration,
        }));
        const levels = hls?.levels.map(
          (level, index): Qualitiy => ({
            level: index,
            name: `${level.height}p`,
            codec: level.videoCodec || "",
            bitrate: level.bitrate,
          })
        );
        if (!levels) return;
        setQualities([{ level: -1, name: "auto" }, ...levels]);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        console.log(`🎥 HLS Level Switched: ${data.level}`);
        console.log(
          `🔍 Current Resolution: ${hls?.levels[data.level].height}p / ${
            hls?.levels[data.level].codecs
          }`
        );
        console.log(`📶 Bitrate: ${hls?.levels[data.level].bitrate}bps`);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume) {
      setPlayerStatus((preState) => ({
        ...preState,
        volume: parseFloat(savedVolume),
      }));
      video.volume = parseFloat(savedVolume);
    } else {
      video.volume = playerStatus.volume;
    }

    const updateTime = () =>
      setPlayerStatus((preState) => ({
        ...preState,
        seek: video.currentTime,
      }));
    const setVideoDuration = () =>
      setPlayerStatus((preState) => ({
        ...preState,
        duration: video.duration,
      }));

    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        setPlayerStatus((preState) => ({
          ...preState,
          load: video.buffered.end(video.buffered.length - 1),
        }));
      }
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", setVideoDuration);
    video.addEventListener("progress", updateBuffered);

    setHlsInstance(hls);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("loadedmetadata", setVideoDuration);
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  const showControlsTemporarily = () => {
    setPlayerStatus((preState) => ({
      ...preState,
      isControllerShow: true,
    }));

    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(
      () =>
        setPlayerStatus((preState) => ({
          ...preState,
          isControllerShow: false,
        })),
      3000
    );
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    setPlayerStatus((preState) => ({
      ...preState,
      isPlay: !video.paused,
    }));
    showControlsTemporarily();
  };

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    setPlayerStatus((preState) => ({
      ...preState,
      volume: value,
    }));
    localStorage.setItem("playerVolume", value.toString());
    showControlsTemporarily();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(event.target.value);
    video.currentTime = time;
    showControlsTemporarily();
  };

  const move = (second: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime += second;
    showControlsTemporarily();
  };

  const handleFullScreen = () => {
    if (!playerRoot.current) return;
    if (!screenfull.isEnabled) return;

    screenfull.toggle(playerRoot.current);
    showControlsTemporarily();
  };

  const changeQuality = (level: number) => {
    if (hlsInstance) {
      console.log(level);
      hlsInstance.nextLevel = level;
      setSelectedQuality(level);
    }
  };

  const toggleSubtitle = () => {
    if (!hlsInstance) return;
    hlsInstance.subtitleDisplay = !playerStatus.showSubtitle;
    setPlayerStatus((preState) => ({
      ...preState,
      showSubtitle: hlsInstance.subtitleDisplay,
    }));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <div
        className={`w-1/2 relative text-white ${
          playerStatus.isControllerShow ? "" : "cursor-none"
        }`}
        ref={playerRoot}
        onMouseEnter={() =>
          setPlayerStatus((preState) => ({
            ...preState,
            isControllerShow: true,
          }))
        }
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() =>
          setPlayerStatus((preState) => ({
            ...preState,
            isControllerShow: false,
          }))
        }
      >
        <div
          className="relative z-0"
          onClick={() => {
            togglePlay();
          }}
        >
          <video ref={videoRef} width="100%" />
        </div>
        <div
          className={`px-4 pb-3 w-full absolute bottom-0 text-xs backdrop-blur-sm z-10 ${
            playerStatus.isControllerShow
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          } duration-200`}
        >
          <div className="w-full h-4 relative">
            <span className="bg-gray-500 h-1 block w-full absolute top-0 rounded-sm"></span>
            <span
              className="bg-gray-300 h-1 block absolute top-0 rounded-sm w-full"
              style={{
                width: `${(playerStatus.load / playerStatus.duration) * 100}%`,
              }}
            ></span>
            <input
              type="range"
              min={0}
              max={playerStatus.duration || 0}
              step={0.1}
              value={playerStatus.seek || 0}
              onChange={handleSeek}
              disabled={playerStatus.duration == 0}
              className="h-1 block absolute top-0 rounded-sm w-full bg-transparent z-10"
            />
          </div>
          <div className="flex justify-between">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  togglePlay();
                }}
              >
                {playerStatus.isPlay ? (
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 320 512"
                    fill="white"
                  >
                    <path d="M48 64C21.5 64 0 85.5 0 112L0 400c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48L48 64zm192 0c-26.5 0-48 21.5-48 48l0 288c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-288c0-26.5-21.5-48-48-48l-32 0z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                    fill="white"
                  >
                    <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                  </svg>
                )}
              </button>
              <div className="flex gap-2 items-center">
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 320 512"
                  fill="white"
                >
                  <path d="M320 64c0-12.6-7.4-24-18.9-29.2s-25-3.1-34.4 5.3L131.8 160 64 160c-35.3 0-64 28.7-64 64l0 64c0 35.3 28.7 64 64 64l67.8 0L266.7 471.9c9.4 8.4 22.9 10.4 34.4 5.3S320 460.6 320 448l0-384z" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={playerStatus.volume}
                  onChange={(e) => {
                    handleVolumeChange(parseFloat(e.target.value));
                  }}
                  className="h-1"
                />
              </div>
              <div>
                {formatTime(playerStatus.seek)}/
                {formatTime(playerStatus.duration)}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={toggleSubtitle}>
                {playerStatus.showSubtitle ? (
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                    fill="white"
                  >
                    <path d="M0 96C0 60.7 28.7 32 64 32l448 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM200 208c14.2 0 27 6.1 35.8 16c8.8 9.9 24 10.7 33.9 1.9s10.7-24 1.9-33.9c-17.5-19.6-43.1-32-71.5-32c-53 0-96 43-96 96s43 96 96 96c28.4 0 54-12.4 71.5-32c8.8-9.9 8-25-1.9-33.9s-25-8-33.9 1.9c-8.8 9.9-21.6 16-35.8 16c-26.5 0-48-21.5-48-48s21.5-48 48-48zm144 48c0-26.5 21.5-48 48-48c14.2 0 27 6.1 35.8 16c8.8 9.9 24 10.7 33.9 1.9s10.7-24 1.9-33.9c-17.5-19.6-43.1-32-71.5-32c-53 0-96 43-96 96s43 96 96 96c28.4 0 54-12.4 71.5-32c8.8-9.9 8-25-1.9-33.9s-25-8-33.9 1.9c-8.8 9.9-21.6 16-35.8 16c-26.5 0-48-21.5-48-48z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 576 512"
                    fill="white"
                  >
                    <path d="M512 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l448 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM200 208c14.2 0 27 6.1 35.8 16c8.8 9.9 24 10.7 33.9 1.9s10.7-24 1.9-33.9c-17.5-19.6-43.1-32-71.5-32c-53 0-96 43-96 96s43 96 96 96c28.4 0 54-12.4 71.5-32c8.8-9.9 8-25-1.9-33.9s-25-8-33.9 1.9c-8.8 9.9-21.6 16-35.8 16c-26.5 0-48-21.5-48-48s21.5-48 48-48zm144 48c0-26.5 21.5-48 48-48c14.2 0 27 6.1 35.8 16c8.8 9.9 24 10.7 33.9 1.9s10.7-24 1.9-33.9c-17.5-19.6-43.1-32-71.5-32c-53 0-96 43-96 96s43 96 96 96c28.4 0 54-12.4 71.5-32c8.8-9.9 8-25-1.9-33.9s-25-8-33.9 1.9c-8.8 9.9-21.6 16-35.8 16c-26.5 0-48-21.5-48-48z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  move(-10);
                }}
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="white"
                >
                  <path d="M48.5 224L40 224c-13.3 0-24-10.7-24-24L16 72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8L48.5 224z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  move(10);
                }}
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="white"
                >
                  <path d="M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  handleFullScreen();
                }}
              >
                {playerStatus.isFullScreen ? (
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    fill="white"
                  >
                    <path d="M160 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 320c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0z" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="white"
                  >
                    <path d="M32 32C14.3 32 0 46.3 0 64l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <select
        value={selectedQuality}
        onChange={(e) => {
          changeQuality(Number(e.target.value));
        }}
      >
        {qualities.map((q) => (
          <option key={q.level} value={q.level}>
            {q.name} / {q.codec}
          </option>
        ))}
      </select>
    </div>
  );
}

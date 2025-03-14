import { PictureInPicture } from "@phosphor-icons/react";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import screenfull from "screenfull";

interface PlayerStatus {
  isPlay: boolean;
  showSubtitle: boolean;
  volume: number;
  isMuted: boolean;
  duration: number;
  seek: number;
  load: number;
  isFullScreen: boolean;
  isPip: boolean;
  isControllerShow: boolean;
  showSettings: boolean;
  showAudioDes: boolean;
}

interface Qualitiy {
  level: number;
  name: string;
  codec?: string;
  bitrate?: number;
}

type PropsType = {
  src: string;
};

export default function Player({ src }: PropsType) {
  //   const src =
  //     "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8";
  // const src =
  //   "https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8";
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
    isMuted: false,
    duration: 1,
    seek: 0,
    load: 0,
    isFullScreen: false,
    isPip: false,
    isControllerShow: true,
    showSettings: false,
    showAudioDes: false,
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

      video
        .play()
        .then(() =>
          setPlayerStatus((preState) => ({
            ...preState,
            isPlay: true,
          }))
        )
        .catch((e) =>
          setPlayerStatus((preState) => ({
            ...preState,
            isPlay: false,
          }))
        );

      hls.subtitleDisplay = playerStatus.showSubtitle;
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!video) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          move(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          move(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolumeDelta(0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolumeDelta(-0.05);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          handleFullScreen();
          break;
      }
    };

    const onExitPip = () => {
      setPlayerStatus((preState) => ({
        ...preState,
        isPip: false,
      }));
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", setVideoDuration);
    video.addEventListener("progress", updateBuffered);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("leavepictureinpicture", onExitPip);

    setHlsInstance(hls);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("progress", updateBuffered);
      video.removeEventListener("loadedmetadata", setVideoDuration);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("leavepictureinpicture", onExitPip);

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

  const changeVolumeDelta = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVol = video.volume + delta;

    if (newVol < 0) video.volume = 0;
    else if (1 < newVol) video.volume = 1;
    else video.volume += delta;

    setPlayerStatus((preState) => ({
      ...preState,
      volume: video.volume,
    }));
    localStorage.setItem("playerVolume", video.volume.toString());
    showControlsTemporarily();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setPlayerStatus((preState) => ({
      ...preState,
      isMuted: video.muted,
    }));
    showControlsTemporarily();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(event.target.value);
    video.currentTime = time;
    setPlayerStatus((preState) => ({
      ...preState,
      seek: time,
    }));
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

  const toggleSubtitle = () => {
    if (!hlsInstance) return;
    console.log(!hlsInstance.subtitleDisplay, !playerStatus.showSubtitle);
    hlsInstance.subtitleDisplay = !hlsInstance.subtitleDisplay;
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

  const handleChangeLevel = (level: number) => {
    if (hlsInstance) {
      console.log(level);
      hlsInstance.nextLevel = level;
      setSelectedQuality(level);
      setPlayerStatus((preState) => ({
        ...preState,
        showSettings: !preState.showSettings,
      }));
    }
  };

  const toggleSettings = () => {
    setPlayerStatus((preState) => ({
      ...preState,
      showSettings: !preState.showSettings,
    }));
  };

  const handlePip = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      videoRef.current?.requestPictureInPicture();
    }
    setPlayerStatus((preState) => ({
      ...preState,
      isPip: !document.pictureInPictureElement,
    }));
  };

  return (
    <div
      className={`relative text-white bg-black ${
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
      tabIndex={0}
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
        className={`w-full absolute bottom-0 text-xs z-10 ${
          playerStatus.isControllerShow
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        } duration-200`}
      >
        <div
          className={`px-4 mb-1 duration-200 absolute right-0 bottom-[45px] ${
            playerStatus.showSettings ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ul className="h-40 overflow-y-scroll inline-block bg-black rounded-lg p-1 text-sm">
            {qualities.map((q) => (
              <li
                key={q.level}
                value={q.level}
                onClick={() => handleChangeLevel(q.level)}
                className={`cursor-pointer my-1 hover:bg-gray-200 rounded-sm ${
                  selectedQuality === q.level ? "bg-blue-500" : ""
                }`}
              >
                {q.name} / {q.codec}
              </li>
            ))}
          </ul>
        </div>
        <div className="backdrop-blur-sm px-4 pb-3">
          <div className="w-full h-4 relative">
            <span className="bg-gray-500 h-1 block w-full absolute top-0 rounded-sm"></span>
            <span
              className="bg-gray-300 h-1 block absolute top-0 rounded-sm w-full"
              style={{
                width: `${(playerStatus.load / playerStatus.duration) * 100}%`,
              }}
            ></span>
            <span
              className="bg-red-300 h-1 block absolute top-0 rounded-sm w-full z-10"
              style={{
                width: `${(playerStatus.seek / playerStatus.duration) * 100}%`,
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
              className="h-1 block absolute top-0 rounded-sm w-full opacity-0 z-20"
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
              <div
                className="flex gap-2 items-center"
                onMouseEnter={() =>
                  setPlayerStatus((preState) => ({
                    ...preState,
                    showAudioDes: true,
                  }))
                }
                onMouseLeave={() =>
                  setPlayerStatus((preState) => ({
                    ...preState,
                    showAudioDes: false,
                  }))
                }
              >
                <button onClick={toggleMute}>
                  {playerStatus.isMuted ? (
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 576 512"
                      fill="white"
                    >
                      <path d="M301.1 34.8C312.6 40 320 51.4 320 64l0 384c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352 64 352c-35.3 0-64-28.7-64-64l0-64c0-35.3 28.7-64 64-64l67.8 0L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 320 512"
                      fill="white"
                    >
                      <path d="M320 64c0-12.6-7.4-24-18.9-29.2s-25-3.1-34.4 5.3L131.8 160 64 160c-35.3 0-64 28.7-64 64l0 64c0 35.3 28.7 64 64 64l67.8 0L266.7 471.9c9.4 8.4 22.9 10.4 34.4 5.3S320 460.6 320 448l0-384z" />
                    </svg>
                  )}
                </button>
                <div
                  className={`relative duration-200 h-4 ${
                    playerStatus.showAudioDes ? "w-20" : "w-0"
                  }`}
                >
                  <span className="bg-gray-300 h-1 block absolute top-1/2 -translate-y-1/2 left-0 rounded-sm w-full"></span>
                  <span
                    className="bg-red-300 h-1 block absolute top-1/2 -translate-y-1/2 left-0 rounded-sm w-1/2 z-10"
                    style={{
                      width: `${playerStatus.volume * 100}%`,
                    }}
                  ></span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={playerStatus.volume}
                    onChange={(e) => {
                      handleVolumeChange(parseFloat(e.target.value));
                    }}
                    className="opacity-0 absolute h-1 w-full top-1/2 -translate-y-1/2 left-0 z-20"
                  />
                </div>
              </div>
              <div>
                {formatTime(playerStatus.seek)}
                {" / "}
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
              <button onClick={toggleSettings}>
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="white"
                >
                  <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
                </svg>
              </button>
              <button onClick={handlePip}>
                {playerStatus.isPip ? (
                  <PictureInPicture size={16} weight="fill" />
                ) : (
                  <PictureInPicture size={16} weight="bold" />
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
    </div>
  );
}

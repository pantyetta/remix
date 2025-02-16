import Hls from "hls.js";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";

interface PlayerStatus {
  isPlay: boolean;
  volume: number;
  duration: number;
  seek: number;
  load: number;
  isFullScreen: boolean;
}

export default function Index() {
  const url =
    "https://devstreaming-cdn.apple.com/videos/streaming/examples/adv_dv_atmos/main.m3u8";
  const [isClient, setIsClient] = useState(false);

  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    isPlay: false,
    volume: 0.5,
    duration: 1,
    seek: 0,
    load: 0,
    isFullScreen: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  let player: ReactPlayer;

  const ref = (dom: ReactPlayer) => {
    player = dom;
  };

  const move = (second: number) => {
    player.seekTo(player.getCurrentTime() + second);
  };

  const test = useRef(null);

  const minSec = (second: number) => {
    let hour = 0;
    let min = 0;
    let sec = 0;

    // hour = second / 3600;
    min = Math.floor(second / 60);
    sec = second % 60;
    return `${min}:${sec}`;
  };

  const handleFullScreen = () => {
    if (!test.current) return;
    if (!screenfull.isEnabled) return;

    screenfull.toggle(test.current);
  };

  useEffect(() => {
    setPlayerStatus((preState) => ({
      ...preState,
      isFullScreen: screenfull.isFullscreen,
    }));
  }, [screenfull.isFullscreen]);

  return (
    <div className="w-1/2 relative text-white" ref={test}>
      {isClient ? (
        <div
          className="relative z-0"
          onClick={() => {
            setPlayerStatus((preState) => ({
              ...preState,
              isPlay: !playerStatus.isPlay,
            }));
          }}
        >
          <ReactPlayer
            ref={ref}
            url={url}
            // controls
            loop
            playing={playerStatus.isPlay}
            width="100%"
            height="auto"
            volume={playerStatus.volume}
            onProgress={(e) => {
              setPlayerStatus((preState) => ({
                ...preState,
                seek: e.playedSeconds,
                load: e.loadedSeconds,
              }));
            }}
            onDuration={(e) => {
              setPlayerStatus((preState) => ({
                ...preState,
                duration: e,
              }));
            }}
          />
        </div>
      ) : (
        <p>Loading...</p>
      )}
      <div className="px-4 pb-3 w-full absolute bottom-0 text-xs backdrop-blur-sm z-10">
        <div className="w-full h-4 relative">
          <span className="bg-gray-500 h-1 block w-full absolute top-0 rounded-sm"></span>
          <span
            className="bg-gray-300 h-1 block  absolute top-0 rounded-sm"
            style={{
              width: `${(playerStatus.load / playerStatus.duration) * 100}%`,
            }}
          ></span>
          <span
            className="bg-red-300 h-1 block absolute top-0 rounded-sm"
            style={{
              width: `${(playerStatus.seek / playerStatus.duration) * 100}%`,
            }}
          ></span>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                setPlayerStatus((preState) => ({
                  ...preState,
                  isPlay: !playerStatus.isPlay,
                }));
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
            <div className="flex gap-2">
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
                  setPlayerStatus((preState) => ({
                    ...preState,
                    volume: parseFloat(e.target.value),
                  }));
                }}
              />
            </div>
            <div>
              {minSec(Math.floor(playerStatus.seek))}/
              {minSec(Math.floor(playerStatus.duration))}
            </div>
          </div>
          <div className="flex gap-2 items-center">
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
  );
}

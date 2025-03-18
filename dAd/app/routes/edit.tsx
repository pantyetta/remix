import {
  Active,
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  pointerWithin,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Over } from "@dnd-kit/core/dist/store";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useEffect, useState } from "react";
import { Droppable } from "~/components/Droppable";
import { Sortable } from "~/components/Sortable";
import { SortableItem } from "~/components/SortableItem";
import { v4 as uuidv4 } from "uuid";
import { Button } from "~/components/ui/button";
import { SortableDrop } from "~/components/SortableDrop";

const sampleAnimeData = {
  id: "animes",
  name: "Anime",
  series: [
    {
      id: "series-A",
      title: "シリーズ A",
      season: [
        {
          id: "season-A-1",
          title: "シーズン A 1期",
          episodes: [
            { id: "E1", title: "Episode 1-1" },
            { id: "E2", title: "Episode 1-2" },
            { id: "E3", title: "Episode 1-3" },
          ],
        },
        {
          id: "season-A-2",
          title: "シーズン A 2期",
          episodes: [
            { id: "E4", title: "Episode 2-1" },
            { id: "E5", title: "Episode 2-2" },
          ],
        },
      ],
    },
    {
      id: "series-B",
      title: "シリーズ B",
      season: [
        {
          id: "season-B-1",
          title: "シーズン B 1期",
          episodes: [
            { id: "E6", title: "Episode 1" },
            { id: "E7", title: "Episode 2" },
            { id: "E8", title: "Episode 3" },
          ],
        },
        {
          id: "season-B-2",
          title: "シーズン B 2期",
          episodes: [
            { id: "E10", title: "Episode 1" },
            { id: "E11", title: "Episode 2" },
            { id: "E12", title: "Episode 3" },
          ],
        },
      ],
    },
  ],
};

type EpisodeDetail = {
  id: string;
  title: string;
};
type SeasonDetail = {
  id: string;
  title: string;
  episodes: EpisodeDetail[];
};
type SeriesDetail = {
  id: string;
  title: string;
  season: SeasonDetail[];
};
type AnimeDetail = {
  id: string;
  name: string;
  series: SeriesDetail[];
};
type AnimeIndexes = {
  series: string;
  season: string;
};

export default function Edit() {
  const [animeData, setanimeData] = useState<AnimeDetail>(sampleAnimeData);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [editAnimeId, seteditAnimeId] = useState<AnimeIndexes>({
    series: animeData.series[0]?.id,
    season: animeData.series[0]?.season[0]?.id,
  });
  const [isSelectSeason, setIsSelectSeason] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );

  function habdleDragStart(event: DragStartEvent): void {
    const { active } = event;
    if (!active) return;
    setActiveId(active.id);

    setIsSelectSeason(
      animeData.series.some((series) =>
        series.season.some((season) => season.id == active.id)
      )
    );
  }

  // 別のシリーズにシーズンを移動
  function handleDragOver(event: DragOverEvent): void {
    const data = getData(event, animeData);
    if (!data) return;

    const { from, to } = data;
    if (from.containerId === to.containerId) return;

    const fromList = animeData.series.find(
      (series) => series.id == from.containerId
    );
    const toList = animeData.series.find(
      (series) => series.id == to.containerId
    );

    if (!fromList || !toList) return;

    const moveSeason = fromList.season.find(
      (season) => season.id === from.items[from.index]
    );
    if (!moveSeason) return;

    const newFromSeason = fromList.season.filter(
      (season) => season.id !== moveSeason.id
    );

    const newToSeason = [
      ...toList.season.slice(0, to.index),
      moveSeason,
      ...toList.season.slice(to.index),
    ];

    setanimeData((prevData) => {
      return {
        ...prevData,
        series: animeData.series.map((series) => {
          if (series.id === from.containerId)
            return { ...series, season: newFromSeason };

          if (series.id === to.containerId)
            return { ...series, season: newToSeason };

          return series;
        }),
      };
    });
  }

  // 同じコンテナ内の移動 & 別のシーズンにエピソード移動
  function handleDragEnd(event: DragEndEvent): void {
    setActiveId(null);
    const data = getData(event, animeData);
    if (!data) return;

    const { from, to } = data;

    // 別のシーズンにエピソード移動
    if (from.containerId !== to.containerId) {
      const FromList = animeData.series
        .flatMap((series) => series.season)
        .find((series) => series.id == from.containerId);
      if (!FromList) return;

      const toList = animeData.series
        .flatMap((series) => series.season)
        .find((series) => series.id + "-menu" == to.containerId);
      if (!toList) return;

      if (toList.episodes.some((ep) => ep.id == from.items[from.index])) return;

      const moveEpisode = FromList.episodes[from.index];
      if (!moveEpisode) return;

      const newFromEpisode = FromList.episodes.filter(
        (episodes) => episodes.id !== moveEpisode.id
      );

      const newToEpisode = [
        ...toList.episodes.slice(0, to.index),
        moveEpisode,
        ...toList.episodes.slice(to.index),
      ];

      setanimeData((prevData) => {
        return {
          ...prevData,
          series: prevData.series.map((series) => ({
            ...series,
            season: series.season.map((season) => {
              if (season.id === from.containerId)
                return { ...season, episodes: newFromEpisode };

              if (season.id + "-menu" === to.containerId)
                return { ...season, episodes: newToEpisode };

              return season;
            }),
          })),
        };
      });
      return;
    }

    const season = animeData.series
      .flatMap((series) => series.season)
      .find((season) => season.id == from.containerId);

    if (season) {
      // エピソードの並び替え
      const newEpisondes = arrayMove(season.episodes, from.index, to.index);

      setanimeData((prevData) => {
        return {
          ...prevData,
          series: prevData.series.map((series) => ({
            ...series,
            season: series.season.map((season) => ({
              ...season,
              episodes:
                season.id === from.containerId ? newEpisondes : season.episodes,
            })),
          })),
        };
      });
    } else {
      // シーズンの並び替え
      const series = animeData.series.find(
        (series) => series.id == from.containerId
      );
      if (!series) return;

      const newSeason = arrayMove(series.season, from.index, to.index);

      setanimeData((prevData) => {
        return {
          ...prevData,
          series: prevData.series.map((series) => ({
            ...series,
            season: series.id === from.containerId ? newSeason : series.season,
          })),
        };
      });
    }
  }

  function getData(
    event: { active: Active; over: Over | null },
    animeData: AnimeDetail
  ) {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.id === over.id) return;
    const fromData = active.data.current?.sortable;
    if (!fromData) return;
    const toData = over.data.current?.sortable;
    const toDataNotSortable = {
      containerId: over.id,
      index: NaN,
      items: NaN,
    };
    return {
      from: fromData,
      to: toData ?? toDataNotSortable,
    };
  }

  //   const customClosestCorners: CollisionDetection = (args) => {
  // const cornerCollisions = closestCorners(args);
  // // 一番近いリストのコンテナを取得
  // const listIds = new Set(animeData.lists.map((list) => list.id));
  // const closestContainer = cornerCollisions.find((c) => {
  //   return listIds.has(c.id.toString());
  // });
  // if (!closestContainer) return cornerCollisions;
  // // closestContainerの中のチケットのみを取得
  // const collisions = cornerCollisions.filter(({ data }) => {
  //   if (!data) return false;
  //   const droppableData = data.droppableContainer?.data?.current;
  //   if (!droppableData) return false;
  //   const { containerId } = droppableData.sortable;
  //   return closestContainer.id === containerId;
  // });
  // // 中身のチケットがない場合は、closestContainerを返す
  // if (collisions.length === 0) {
  //   return [closestContainer];
  // }
  // // 中身のチケットがある場合は、collisionsを返す
  // return collisions;
  //   };

  function handleAddColumn(): void {
    const currentData = animeData.series;
    const id = uuidv4();
    const newData = {
      id,
      title: "List " + id,
      season: [],
    };
    currentData.push(newData);
    setanimeData({ ...animeData, series: currentData });
  }

  const nowEditSeason = animeData.series
    .flatMap((series) => series.season)
    .find((season) => season.id == editAnimeId.season) || {
    id: "none",
    title: "none anime data",
    episodes: [],
  };

  const SortableComponent = isSelectSeason ? Sortable : SortableDrop;

  const SeasonList = (series: SeriesDetail) => (
    <div className="flex flex-col gap-8 p-4 border min-w-44">
      <p>{series.title}</p>
      {series.season.map((season) => (
        <SortableComponent
          key={season.id}
          id={season.id}
          onClick={() =>
            seteditAnimeId({
              series: series.id,
              season: season.id,
            })
          }
          className={`${editAnimeId.season == season.id ? "bg-blue-300" : ""}`}
        >
          <SortableItem itemId={season.id} />
        </SortableComponent>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-center items-center w-screen h-screen gap-8">
        <DndContext
          sensors={sensors}
          onDragStart={habdleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          //   collisionDetection={customClosestCorners}
          collisionDetection={pointerWithin}
          // collisionDetection={closestCenter}
          id={animeData.id}
        >
          <div className="flex flex-col justify-center items-center gap-8 relative">
            {animeData.series.map((series, index) => (
              <div key={series.id} className="space-y-2">
                <SortableContext
                  items={series.season}
                  key={series.id}
                  id={series.id}
                  strategy={verticalListSortingStrategy}
                >
                  {isSelectSeason ? (
                    <Droppable key={series.id} id={series.id}>
                      <SeasonList
                        id={series.id}
                        title={series.title}
                        season={series.season}
                      />
                    </Droppable>
                  ) : (
                    <SeasonList
                      id={series.id}
                      title={series.title}
                      season={series.season}
                    />
                  )}
                </SortableContext>
              </div>
            ))}
          </div>
          <div>
            <SortableContext
              items={nowEditSeason.episodes}
              key={nowEditSeason.id}
              id={nowEditSeason.id}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-8 p-4 border min-w-44 w-[600px]">
                <p>{nowEditSeason.title}</p>
                {nowEditSeason.episodes.map((episode) => (
                  <Sortable key={episode.id} id={episode.id}>
                    <SortableItem itemId={episode.id} />
                  </Sortable>
                ))}
              </div>
            </SortableContext>
          </div>
          <DragOverlay>
            {activeId ? <SortableItem itemId={activeId} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
      <Button
        onClick={handleAddColumn}
        className="w-full h-20 fixed bottom-0 border flex justify-center items-cente"
      >
        Add column
      </Button>
    </div>
  );
}

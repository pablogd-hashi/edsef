"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { YearbookWithRelations } from "@/lib/services/yearbook.service";
import type { LocationData } from "@/components/yearbook/location-picker";

type MediaLink = {
  media: {
    id: string;
    type: string;
    title?: string | null;
    width?: number | null;
    height?: number | null;
  };
};

type UploadedMedia = {
  id: string;
  type: string;
  title?: string | null;
};

type YearbookEditorContextValue = {
  yearbook: YearbookWithRelations;
  addMilestone: (m: YearbookWithRelations["milestones"][number]) => void;
  addStory: (s: YearbookWithRelations["stories"][number]) => void;
  addTimelineEntry: (t: YearbookWithRelations["timeline"][number]) => void;
  addMusic: (track: YearbookWithRelations["music"][number]) => void;
  removeMusic: (id: string) => void;
  updateMusic: (id: string, data: Partial<YearbookWithRelations["music"][number]>) => void;
  addParentNote: (note: YearbookWithRelations["parentNotes"][number]) => void;
  addVideoTimelineEntry: (entry: YearbookWithRelations["timeline"][number]) => void;
  appendMilestoneMedia: (milestoneId: string, asset: UploadedMedia) => void;
  appendTimelineMedia: (entryId: string, asset: UploadedMedia) => void;
  appendStoryMedia: (storyId: string, asset: UploadedMedia) => void;
  appendSectionMedia: (
    sectionType: YearbookWithRelations["attachments"][number]["sectionType"],
    asset: UploadedMedia
  ) => void;
  updateMilestoneLocation: (
    milestoneId: string,
    locationId: string | null,
    location?: LocationData | null
  ) => void;
  updateTimelineLocation: (
    entryId: string,
    locationId: string | null,
    location?: LocationData | null
  ) => void;
};

const YearbookEditorContext = createContext<YearbookEditorContextValue | null>(null);

function toMediaLink(asset: UploadedMedia): MediaLink {
  return {
    media: {
      id: asset.id,
      type: asset.type,
      title: asset.title ?? null,
      width: null,
      height: null,
    },
  };
}

export function YearbookEditorProvider({
  initial,
  children,
}: {
  initial: YearbookWithRelations;
  children: React.ReactNode;
}) {
  const [yearbook, setYearbook] = useState(initial);
  // router.refresh() sends a fresh server snapshot — adopt it so edits made
  // outside this provider (gallery reorder/delete, imports) show up.
  const [syncedInitial, setSyncedInitial] = useState(initial);
  if (initial !== syncedInitial) {
    setSyncedInitial(initial);
    setYearbook(initial);
  }

  const patch = useCallback(
    (fn: (y: YearbookWithRelations) => YearbookWithRelations) => setYearbook(fn),
    []
  );

  const value = useMemo<YearbookEditorContextValue>(
    () => ({
      yearbook,
      addMilestone: (m) =>
        patch((y) => ({
          ...y,
          milestones: [...y.milestones, { ...m, media: m.media ?? [], location: m.location ?? null }],
        })),
      addStory: (s) =>
        patch((y) => ({
          ...y,
          stories: [...y.stories, { ...s, attachments: s.attachments ?? [] }],
        })),
      addTimelineEntry: (t) =>
        patch((y) => ({
          ...y,
          timeline: [...y.timeline, { ...t, media: t.media ?? [], location: t.location ?? null }],
        })),
      addMusic: (track) => patch((y) => ({ ...y, music: [...y.music, track] })),
      removeMusic: (id) =>
        patch((y) => ({ ...y, music: y.music.filter((t) => t.id !== id) })),
      updateMusic: (id, data) =>
        patch((y) => ({
          ...y,
          music: y.music.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      addParentNote: (note) =>
        patch((y) => ({
          ...y,
          parentNotes: [...y.parentNotes, { ...note, attachments: note.attachments ?? [] }],
        })),
      addVideoTimelineEntry: (entry) =>
        patch((y) => ({
          ...y,
          timeline: [...y.timeline, { ...entry, media: entry.media ?? [] }],
        })),
      appendMilestoneMedia: (milestoneId, asset) =>
        patch((y) => ({
          ...y,
          milestones: y.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, media: [...(m.media ?? []), toMediaLink(asset) as (typeof m.media)[number]] }
              : m
          ),
        })),
      appendTimelineMedia: (entryId, asset) =>
        patch((y) => ({
          ...y,
          timeline: y.timeline.map((t) =>
            t.id === entryId
              ? { ...t, media: [...(t.media ?? []), toMediaLink(asset) as (typeof t.media)[number]] }
              : t
          ),
        })),
      appendStoryMedia: (storyId, asset) =>
        patch((y) => ({
          ...y,
          stories: y.stories.map((s) =>
            s.id === storyId
              ? {
                  ...s,
                  attachments: [
                    ...(s.attachments ?? []),
                    {
                      id: `local-${asset.id}`,
                      order: s.attachments?.length ?? 0,
                      media: toMediaLink(asset).media,
                    } as YearbookWithRelations["stories"][number]["attachments"][number],
                  ],
                }
              : s
          ),
        })),
      appendSectionMedia: (sectionType, asset) =>
        patch((y) => ({
          ...y,
          attachments: [
            ...y.attachments,
            {
              id: `local-${asset.id}`,
              sectionType,
              order: y.attachments.filter((a) => a.sectionType === sectionType).length,
              media: toMediaLink(asset).media,
            } as YearbookWithRelations["attachments"][number],
          ],
        })),
      updateMilestoneLocation: (milestoneId, locationId, location) =>
        patch((y) => ({
          ...y,
          milestones: y.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  locationId,
                  location: location
                    ? ({ ...m.location, ...location } as (typeof m.location))
                    : null,
                }
              : m
          ),
        })),
      updateTimelineLocation: (entryId, locationId, location) =>
        patch((y) => ({
          ...y,
          timeline: y.timeline.map((t) =>
            t.id === entryId
              ? {
                  ...t,
                  locationId,
                  location: location
                    ? ({ ...t.location, ...location } as (typeof t.location))
                    : null,
                }
              : t
          ),
        })),
    }),
    [yearbook, patch]
  );

  return (
    <YearbookEditorContext.Provider value={value}>{children}</YearbookEditorContext.Provider>
  );
}

export function useYearbookEditor() {
  const ctx = useContext(YearbookEditorContext);
  if (!ctx) throw new Error("useYearbookEditor requires YearbookEditorProvider");
  return ctx;
}

export function useYearbookEditorOptional() {
  return useContext(YearbookEditorContext);
}

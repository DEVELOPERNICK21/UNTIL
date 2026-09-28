'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  Ios69SizeId,
  PlatformTarget,
  Slide,
  StoreCopy,
  TemplateId,
  TemplateOptions,
} from '../types';
import {
  DEFAULT_COPY,
  DEFAULT_OPTIONS,
} from '../types';
import { COPY_LIMITS, isCopyOverLimit } from '../limits';
import {
  IOS_69_SIZES,
  aspectWarning,
  getOutputSizes,
} from '../storeSpecs';
import { TEMPLATE_META } from '../templates';
import { buildExportZip, downloadBlob } from '../export/buildZip';
import { PreviewCanvas } from './PreviewCanvas';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function filesToSlides(files: FileList | File[]): Promise<Slide[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
  const slides: Slide[] = [];
  for (const file of list) {
    const url = URL.createObjectURL(file);
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error(file.name));
      img.src = url;
    });
    slides.push({
      id: uid(),
      imageUrl: url,
      fileName: file.name,
      naturalWidth: dims.w,
      naturalHeight: dims.h,
      headline: '',
      subtext: '',
      aspectWarning: aspectWarning(dims.w, dims.h),
    });
  }
  return slides;
}

function CharCounter({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={over ? 'text-[var(--red)]' : 'text-[var(--text-secondary)]'}>
      {value.length}/{limit}
    </span>
  );
}

export function AsoStudioApp() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>('text-over-screen');
  const [ios69SizeId, setIos69SizeId] = useState<Ios69SizeId>('1290x2796');
  const [targets, setTargets] = useState<PlatformTarget[]>([
    'ios-6.9',
    'android-phone',
  ]);
  const [options, setOptions] = useState<TemplateOptions>(DEFAULT_OPTIONS);
  const [copy, setCopy] = useState<StoreCopy>(DEFAULT_COPY);
  const [masterIconUrl, setMasterIconUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [batchHeadline, setBatchHeadline] = useState('');
  const [batchSubtext, setBatchSubtext] = useState('');

  const activeSlide =
    slides.find((s) => s.id === activeSlideId) ?? slides[0] ?? null;

  const outputSizes = useMemo(
    () => getOutputSizes(ios69SizeId, targets),
    [ios69SizeId, targets],
  );

  const previewSize = outputSizes[0] ?? {
    width: 1290,
    height: 2796,
    label: 'Preview',
    id: 'preview',
    folder: '',
    target: 'ios-6.9' as PlatformTarget,
  };

  /** Scaled canvas for live editing (export still uses full store pixels). */
  const livePreview = useMemo(() => {
    const maxW = 360;
    const scale = maxW / previewSize.width;
    return {
      width: maxW,
      height: Math.round(previewSize.height * scale),
    };
  }, [previewSize.width, previewSize.height]);

  const copyOver = isCopyOverLimit(copy);
  const canExport =
    slides.length > 0 && targets.length > 0 && !copyOver && !exporting;

  const onUploadScreenshots = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const next = await filesToSlides(files);
    setSlides((prev) => {
      const merged = [...prev, ...next];
      if (!activeSlideId && merged[0]) setActiveSlideId(merged[0].id);
      return merged;
    });
    if (next[0]) setActiveSlideId(next[0].id);
  }, [activeSlideId]);

  const onUploadIcon = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (masterIconUrl) URL.revokeObjectURL(masterIconUrl);
    setMasterIconUrl(URL.createObjectURL(file));
  }, [masterIconUrl]);

  const updateActive = useCallback(
    (patch: Partial<Slide>) => {
      if (!activeSlide) return;
      setSlides((prev) =>
        prev.map((s) => (s.id === activeSlide.id ? { ...s, ...patch } : s)),
      );
    },
    [activeSlide],
  );

  const applyBatchText = () => {
    setSlides((prev) =>
      prev.map((s) => ({
        ...s,
        headline: batchHeadline || s.headline,
        subtext: batchSubtext || s.subtext,
      })),
    );
  };

  const removeSlide = (id: string) => {
    setSlides((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.imageUrl);
      const next = prev.filter((s) => s.id !== id);
      if (activeSlideId === id) setActiveSlideId(next[0]?.id ?? null);
      return next;
    });
  };

  const toggleTarget = (t: PlatformTarget) => {
    setTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleExport = async () => {
    if (!canExport) return;
    setExporting(true);
    setExportError(null);
    try {
      const blob = await buildExportZip({
        slides,
        templateId,
        options,
        ios69SizeId,
        targets,
        copy,
        masterIconUrl,
      });
      downloadBlob(blob, `aso-studio-export-${Date.now()}.zip`);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-[var(--divider)] bg-[var(--bg-alt)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-secondary)]';
  const labelClass = 'mb-1 flex items-center justify-between text-xs text-[var(--text-secondary)]';

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--divider)] pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            Internal tool · not indexed
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">ASO Studio</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--text-secondary)]">
            Upload screenshots, pick a template, edit copy, export a ZIP for App
            Store and Play.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport}
          className="rounded-lg bg-[var(--offer)] px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          {exporting ? 'Exporting…' : 'Export ZIP'}
        </button>
      </header>

      {exportError && (
        <p className="rounded-lg border border-[var(--red)]/40 bg-[var(--red)]/10 px-3 py-2 text-sm text-[var(--red)]">
          {exportError}
        </p>
      )}
      {copyOver && (
        <p className="rounded-lg border border-[var(--amber)]/40 bg-[var(--amber)]/10 px-3 py-2 text-sm text-[var(--amber)]">
          One or more store copy fields are over the character limit. Export is
          blocked until you trim them.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Left: upload + slides + template */}
        <aside className="flex flex-col gap-5">
          <section className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
            <h2 className="mb-3 text-sm font-medium">1. Upload</h2>
            <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--divider)] px-3 py-6 text-center text-sm text-[var(--text-secondary)] hover:border-[var(--offer)]">
              <span>Drop screenshots or click</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onUploadScreenshots(e.target.files)}
              />
            </label>
            <label className="flex cursor-pointer flex-col gap-1 text-xs text-[var(--text-secondary)]">
              Optional 1024×1024 icon
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="text-sm"
                onChange={(e) => onUploadIcon(e.target.files)}
              />
              {masterIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={masterIconUrl}
                  alt="Master icon"
                  className="mt-2 h-16 w-16 rounded-xl object-cover"
                />
              )}
            </label>
          </section>

          <section className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
            <h2 className="mb-3 text-sm font-medium">Slides ({slides.length})</h2>
            {slides.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No screenshots yet.
              </p>
            ) : (
              <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                {slides.map((s, i) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSlideId(s.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs ${
                        activeSlide?.id === s.id
                          ? 'border-[var(--offer)] bg-[var(--offer-bg)]'
                          : 'border-[var(--divider)]'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.imageUrl}
                        alt=""
                        className="h-10 w-6 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {i + 1}. {s.fileName}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="text-[var(--text-secondary)] hover:text-[var(--red)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(s.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            removeSlide(s.id);
                          }
                        }}
                      >
                        ✕
                      </span>
                    </button>
                    {s.aspectWarning && (
                      <p className="mt-1 text-[10px] text-[var(--amber)]">
                        {s.aspectWarning}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
            <h2 className="mb-3 text-sm font-medium">2. Template</h2>
            <div className="flex flex-col gap-2">
              {TEMPLATE_META.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`rounded-lg border px-3 py-2 text-left ${
                    templateId === t.id
                      ? 'border-[var(--offer)] bg-[var(--offer-bg)]'
                      : 'border-[var(--divider)]'
                  }`}
                >
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {t.blurb}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Center: preview + slide editor */}
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Preview</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {previewSize.label} · export at full res
              </p>
            </div>
            {activeSlide ? (
              <div className="mx-auto max-w-[320px] overflow-hidden rounded-2xl border border-[var(--divider)] shadow-lg">
                <PreviewCanvas
                  slide={activeSlide}
                  templateId={templateId}
                  options={options}
                  width={livePreview.width}
                  height={livePreview.height}
                />
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-[var(--divider)] text-sm text-[var(--text-secondary)]">
                Upload a screenshot to preview
              </div>
            )}
          </div>

          {activeSlide && (
            <div className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
              <h2 className="mb-3 text-sm font-medium">Slide text</h2>
              <div className="mb-3 grid gap-3">
                <label>
                  <span className={labelClass}>Headline</span>
                  <input
                    className={fieldClass}
                    value={activeSlide.headline}
                    onChange={(e) => updateActive({ headline: e.target.value })}
                    placeholder="Catch the day"
                  />
                </label>
                <label>
                  <span className={labelClass}>Subtext</span>
                  <input
                    className={fieldClass}
                    value={activeSlide.subtext}
                    onChange={(e) => updateActive({ subtext: e.target.value })}
                    placeholder="Day % on your home screen"
                  />
                </label>
              </div>
              <div className="border-t border-[var(--divider)] pt-3">
                <p className="mb-2 text-xs text-[var(--text-secondary)]">
                  Batch apply to all slides
                </p>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    className={fieldClass}
                    value={batchHeadline}
                    onChange={(e) => setBatchHeadline(e.target.value)}
                    placeholder="Headline for all"
                  />
                  <input
                    className={fieldClass}
                    value={batchSubtext}
                    onChange={(e) => setBatchSubtext(e.target.value)}
                    placeholder="Subtext for all"
                  />
                  <button
                    type="button"
                    onClick={applyBatchText}
                    className="rounded-lg border border-[var(--divider)] px-3 py-2 text-sm hover:border-[var(--offer)]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {slides.length > 0 && (
            <div className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
              <h2 className="mb-3 text-sm font-medium">Export sizes</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {outputSizes.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-[var(--divider)] px-3 py-2 text-xs"
                  >
                    <div className="font-medium">{s.label}</div>
                    <div className="text-[var(--text-secondary)]">
                      {s.width}×{s.height} · {s.folder}/
                    </div>
                  </li>
                ))}
              </ul>
              {slides.length > 1 && (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSlideId(s.id)}
                      className="overflow-hidden rounded-lg border border-[var(--divider)]"
                    >
                      <PreviewCanvas
                        slide={s}
                        templateId={templateId}
                        options={options}
                        width={Math.round(livePreview.width / 2)}
                        height={Math.round(livePreview.height / 2)}
                        className="pointer-events-none"
                      />
                      <span className="block truncate px-1 py-1 text-[10px] text-[var(--text-secondary)]">
                        {i + 1}. {previewSize.width}×{previewSize.height}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: options + copy + cheat sheet */}
        <aside className="flex flex-col gap-5">
          <section className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
            <h2 className="mb-3 text-sm font-medium">Style</h2>
            <div className="grid gap-3 text-sm">
              <label className="flex items-center justify-between gap-2">
                <span>Device frame</span>
                <input
                  type="checkbox"
                  checked={options.showDeviceFrame}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      showDeviceFrame: e.target.checked,
                    }))
                  }
                />
              </label>
              <label>
                <span className={labelClass}>Text position</span>
                <select
                  className={fieldClass}
                  value={options.textPosition}
                  onChange={(e) =>
                    setOptions((o) => ({
                      ...o,
                      textPosition: e.target.value as 'top' | 'bottom',
                    }))
                  }
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>iOS 6.9″ size</span>
                <select
                  className={fieldClass}
                  value={ios69SizeId}
                  onChange={(e) =>
                    setIos69SizeId(e.target.value as Ios69SizeId)
                  }
                >
                  {(Object.keys(IOS_69_SIZES) as Ios69SizeId[]).map((id) => (
                    <option key={id} value={id}>
                      {IOS_69_SIZES[id].label}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className={labelClass}>Platforms</span>
                <div className="flex flex-col gap-1">
                  {(
                    [
                      ['ios-6.9', 'iOS 6.9″'],
                      ['android-phone', 'Android phone'],
                    ] as const
                  ).map(([id, label]) => (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={targets.includes(id)}
                        onChange={() => toggleTarget(id)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['backgroundFrom', 'BG from'],
                    ['backgroundTo', 'BG to'],
                    ['headline', 'Headline'],
                    ['subtext', 'Subtext'],
                    ['frame', 'Frame'],
                    ['bezel', 'Bezel'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="text-xs">
                    <span className="mb-1 block text-[var(--text-secondary)]">
                      {label}
                    </span>
                    <input
                      type="color"
                      value={options.brandColors[key]}
                      onChange={(e) =>
                        setOptions((o) => ({
                          ...o,
                          brandColors: {
                            ...o.brandColors,
                            [key]: e.target.value,
                          },
                        }))
                      }
                      className="h-8 w-full cursor-pointer rounded border border-[var(--divider)] bg-transparent"
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--divider)] bg-[var(--card-lighter)] p-4">
            <h2 className="mb-3 text-sm font-medium">Store copy</h2>
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
              {COPY_LIMITS.map((field) => (
                <label key={field.key}>
                  <span className={labelClass}>
                    {field.label}
                    <CharCounter value={copy[field.key]} limit={field.limit} />
                  </span>
                  {field.limit >= 400 ? (
                    <textarea
                      className={`${fieldClass} min-h-[88px]`}
                      value={copy[field.key]}
                      onChange={(e) =>
                        setCopy((c) => ({ ...c, [field.key]: e.target.value }))
                      }
                    />
                  ) : (
                    <input
                      className={fieldClass}
                      value={copy[field.key]}
                      onChange={(e) =>
                        setCopy((c) => ({ ...c, [field.key]: e.target.value }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="sticky bottom-4 rounded-xl border border-[var(--divider)] bg-[var(--bg-alt)] p-4">
            <h2 className="mb-2 text-sm font-medium">Limits cheat sheet</h2>
            <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
              <li>iOS name / subtitle · 30</li>
              <li>iOS promo · 170 · keywords · 100</li>
              <li>iOS / Play description · 4000</li>
              <li>Play title · 30 · short · 80</li>
              <li>iOS 6.9″ · 1290×2796 (or picker)</li>
              <li>Play phone · 1080×1920</li>
              <li>iOS icon · 1024 · Play · 512</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

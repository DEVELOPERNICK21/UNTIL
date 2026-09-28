import JSZip from 'jszip';
import type { Slide, StoreCopy, TemplateId, TemplateOptions, Ios69SizeId, PlatformTarget } from '../types';
import { getOutputSizes } from '../storeSpecs';
import { renderSlideToBlob, resizeIconToBlob } from './renderSlide';

function padIndex(i: number) {
  return String(i + 1).padStart(2, '0');
}

function buildCopyMarkdown(copy: StoreCopy): string {
  return `# Store listing copy

## iOS App Store

**Name** (${copy.iosAppName.length}/30)
${copy.iosAppName}

**Subtitle** (${copy.iosSubtitle.length}/30)
${copy.iosSubtitle}

**Promotional text** (${copy.iosPromotionalText.length}/170)
${copy.iosPromotionalText}

**Keywords** (${copy.iosKeywords.length}/100)
${copy.iosKeywords}

**Description** (${copy.iosDescription.length}/4000)

${copy.iosDescription}

## Google Play

**Title** (${copy.androidTitle.length}/30)
${copy.androidTitle}

**Short description** (${copy.androidShortDescription.length}/80)
${copy.androidShortDescription}

**Full description** (${copy.androidFullDescription.length}/4000)

${copy.androidFullDescription}
`;
}

export async function buildExportZip(params: {
  slides: Slide[];
  templateId: TemplateId;
  options: TemplateOptions;
  ios69SizeId: Ios69SizeId;
  targets: PlatformTarget[];
  copy: StoreCopy;
  masterIconUrl: string | null;
}): Promise<Blob> {
  const { slides, templateId, options, ios69SizeId, targets, copy, masterIconUrl } =
    params;
  const zip = new JSZip();
  const sizes = getOutputSizes(ios69SizeId, targets);

  for (const size of sizes) {
    const folder = zip.folder(size.folder);
    if (!folder) continue;
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const blob = await renderSlideToBlob({
        templateId,
        options,
        imageUrl: slide.imageUrl,
        imageWidth: slide.naturalWidth,
        imageHeight: slide.naturalHeight,
        headline: slide.headline,
        subtext: slide.subtext,
        width: size.width,
        height: size.height,
      });
      folder.file(`${padIndex(i)}-${size.width}x${size.height}.png`, blob);
    }
  }

  if (masterIconUrl) {
    const iosIcon = await resizeIconToBlob(masterIconUrl, 1024);
    const androidIcon = await resizeIconToBlob(masterIconUrl, 512);
    zip.folder('icons/ios')?.file('AppIcon-1024.png', iosIcon);
    zip.folder('icons/android')?.file('icon-512.png', androidIcon);
  }

  const copyFolder = zip.folder('copy');
  copyFolder?.file('store-listing.json', JSON.stringify(copy, null, 2));
  copyFolder?.file('store-listing.md', buildCopyMarkdown(copy));

  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

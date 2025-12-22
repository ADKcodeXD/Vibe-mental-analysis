import { useState, RefObject } from 'react';
import html2canvas from 'html2canvas';

export const useImageExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportImage = async (containerRef: RefObject<HTMLElement | null>, filename: string = 'report') => {
    if (!containerRef.current) return;
    setIsExporting(true);

    try {
      // Small delay to ensure any layout shifts or icon renders are settled
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = containerRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#fdfaff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth + 100,
        windowHeight: element.scrollHeight + 100,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // 1. Radical Color Sanitizer: html2canvas fails on oklch(), oklab(), and lab() colors.
          const problematicFunctions = ['oklch(', 'oklab(', 'lab('];
          const fallbackColor = '#6366f1'; // Indigo-500 fallback

          // BRUTE FORCE: Replace all problematic strings in the entire document body HTML
          // This catches inline styles, custom attributes, and even some data-uris if they contain these strings.
          let bodyHtml = clonedDoc.body.innerHTML;
          problematicFunctions.forEach(fn => {
            const regex = new RegExp(fn.replace('(', '\\(') + '[^)]+\\)', 'g');
            bodyHtml = bodyHtml.replace(regex, fallbackColor);
          });
          clonedDoc.body.innerHTML = bodyHtml;

          // 2. Clear all backdrop-filters and fix opacity/transforms
          clonedDoc.querySelectorAll('*').forEach((el: any) => {
             if (!(el instanceof HTMLElement || el instanceof SVGElement)) return;
             const style = window.getComputedStyle(el);
             
             // Check if computed style still has problematic colors (e.g. from external stylesheets not in innerHTML)
             const val = style.backgroundColor + style.color + style.borderColor + style.backgroundImage;
             if (problematicFunctions.some(fn => val.includes(fn))) {
                el.style.setProperty('background-color', fallbackColor, 'important');
                el.style.setProperty('color', fallbackColor, 'important');
             }

             if (style.backdropFilter !== 'none' || (style as any).webkitBackdropFilter !== 'none') {
                el.style.backdropFilter = 'none';
                (el.style as any).webkitBackdropFilter = 'none';
                if (el.className?.includes?.('bg-white/')) el.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
             }
             if (style.opacity === '0') el.style.opacity = '1';
             if (style.transform && style.transform !== 'none') el.style.transform = 'none';
          });

          // 3. Fix SVG icons (Lucide)
          clonedDoc.querySelectorAll('svg').forEach((svg: any) => {
            if (!svg.getAttribute('width')) svg.setAttribute('width', svg.getBoundingClientRect().width || '24');
            if (!svg.getAttribute('height')) svg.setAttribute('height', svg.getBoundingClientRect().height || '24');
            svg.style.display = 'inline-block';
          });

          // 4. Global Style Tag Purge: Catch CSS variables using problematic colors
          clonedDoc.querySelectorAll('style').forEach(tag => {
            let css = tag.innerHTML;
            problematicFunctions.forEach(fn => {
               const regex = new RegExp(fn.replace('(', '\\(') + '[^)]+\\)', 'g');
               css = css.replace(regex, fallbackColor);
            });
            // Also catch color-mix(in lab, ...) or similar
            css = css.replace(/color-mix\(in [^,]+,/g, 'rgba(99, 102, 241, 0.5),'); 
            tag.innerHTML = css;
          });

          // 5. Force background
          const container = clonedDoc.querySelector('[class*="max-w-6xl"]');
          if (container) (container as HTMLElement).style.backgroundColor = '#fdfaff';
        }
      });

      const link = document.createElement('a');
      link.download = `${filename}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 0.9);
      link.click();
    } catch (err: any) {
      console.error("Critical: Failed to generate report image", err);
      const errorMsg = err?.message || "Unknown rendering error";
      alert(`Export failed: ${errorMsg}\n\nPlease try again or take a manual screenshot. (Error Code: E03)`);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportImage, isExporting };
};

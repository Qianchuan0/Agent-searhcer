import { useState, useEffect } from 'react';

/**
 * 响应式断点判定：宽度 < breakpoint 视为移动端。
 * 提取自 app/page.tsx / utils/getLayout.tsx / research/[id]/page.tsx 三处重复的 checkIfMobile。
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

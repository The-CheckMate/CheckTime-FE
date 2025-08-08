'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export default function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 backdrop-blur transition-colors duration-300',
        scrolled
          ? 'bg-white/95 border-b border-black/10'
          : 'bg-white/80 border-b border-black/5',
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-black font-semibold text-base"
        >
          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm bg-gradient-to-br from-indigo-400 to-purple-500">
            ⏰
          </div>
          Check Time
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600 font-medium">
          <Link href="#" className="hover:text-black transition-colors">
            실시간 랭킹
          </Link>
          <Link href="#" className="hover:text-black transition-colors">
            반응속도 게임
          </Link>
          <Link href="#" className="hover:text-black transition-colors">
            북마크
          </Link>
          <Link href="#" className="hover:text-black transition-colors">
            도움말
          </Link>
        </nav>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLoginClick}
            className="bg-black text-white hover:bg-black/80 px-4 py-2 rounded-md text-sm transition"
          >
            로그인
          </button>
        </div>
      </div>
    </header>
  );
}

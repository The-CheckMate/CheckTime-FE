'use client';

import Header from '@/components/ui/Header';
import SearchForm from '@/components/ServerSearchForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import KoreanStandardTime from '@/components/KoreanStandaradTime';
import LoginModal from '@/components/auth/LoginModal';
import SignupModal from '@/components/auth/SignupModal';

export default function Home() {
  const router = useRouter();
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleSubmit = (url: string) => {
    router.push(`/result?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <Header onLoginClick={() => setLoginOpen(true)} />

      {/* Hero */}
      <section className="text-center py-16">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-600 text-sm font-medium px-3 py-1 rounded-full mb-6">
          ✨ 정확한 서버 시간 확인 서비스
        </div>
        <h1 className="text-6xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-black to-gray-600 text-transparent bg-clip-text mb-6">
          티켓팅 성공을 위한
          <br />
          정확한 시간 동기화
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
          서버와의 시간 차이를 실시간으로 확인하고, 완벽한 타이밍으로 티켓팅에
          성공하세요.
        </p>
      </section>

      {/* URL Input */}
      <section className="max-w-xl mx-auto">
        <SearchForm onSubmit={handleSubmit} />
      </section>

      {/* Current Time */}
      <section className="max-w-3xl mx-auto mb-20 p-10">
        <KoreanStandardTime showToggle={false} />
      </section>

      {/* 로그인 모달 */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSignupClick={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
        onSubmit={async ({ email, password }) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/login`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              },
            );
            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || '로그인 실패');
            }

            // JWT 토큰 저장 (accessToken, refreshToken)
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);

            console.log('로그인 성공', data.data.user);
            // 필요 시 사용자 상태 관리 (예: Context/Redux/SWR)
            setLoginOpen(false);
          } catch (err) {
            alert(err instanceof Error ? err.message : '로그인 중 오류 발생');
          }
        }}
      />

      {/* 회원가입 모달 */}
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onLoginClick={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
        onSubmit={async ({ username, email, password }) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/api/auth/register`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
              },
            );
            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || '회원가입 실패');
            }

            console.log('회원가입 성공', data.data.user);
            alert('회원가입이 완료되었습니다. 로그인 해주세요.');
            setSignupOpen(false);
          } catch (err) {
            alert(err instanceof Error ? err.message : '회원가입 중 오류 발생');
          }
        }}
      />
    </div>
  );
}

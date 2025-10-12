'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTop10Rankings,
  getMyRank,
  saveReactionTimeRecord,
} from '@/libs/api/reactionRanking';

type Phase = 'idle' | 'ready' | 'go' | 'tooSoon' | 'result';

// 단일 모드: 0.5s ~ 5s
const DELAY_RANGE: [number, number] = [500, 5000];

// TOP 10 랭킹 항목 타입
interface RankEntry {
  user_id: number;
  username: string;
  user_best_time: string;
  rank: string;
}

// 내 랭킹 정보 타입
interface MyRankInfo {
  user_id: number;
  username: string;
  user_best_time: string;
  best_rank: string;
}

export default function Page() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [records, setRecords] = useState<number[]>([]);
  const [current, setCurrent] = useState<number | null>(null);

  const [topRankings, setTopRankings] = useState<RankEntry[]>([]);
  const [myRankInfo, setMyRankInfo] = useState<MyRankInfo | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTsRef = useRef<number | null>(null);

  // 랭킹 데이터를 불러오는 함수 (두 API를 동시에 호출)
  const fetchAllRankings = async () => {
    try {
      const [top10Res, myRankRes] = await Promise.all([
        getTop10Rankings(),
        getMyRank(),
      ]);

      if (top10Res.success) {
        setTopRankings(top10Res.data.topRankings);
      }
      if (myRankRes.success) {
        setMyRankInfo(myRankRes.rank);
      }
    } catch (error) {
      console.error('랭킹 정보를 불러오는데 실패했습니다:', error);
    }
  };

  // 페이지가 처음 로드될 때 랭킹 정보를 불러옵니다.
  useEffect(() => {
    fetchAllRankings();
  }, []);

  // 평균
  const average = useMemo(() => {
    if (records.length === 0) return null;
    const sum = records.reduce((a, b) => a + b, 0);
    return Math.round(sum / records.length);
  }, [records]);

  const resetWaitingTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleStart = () => {
    if (phase === 'ready' || phase === 'go') return;
    setCurrent(null);
    setPhase('ready');

    const [min, max] = DELAY_RANGE;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;

    resetWaitingTimer();
    timerRef.current = setTimeout(() => {
      setPhase('go');
      startTsRef.current = performance.now();
    }, delay);
  };

  const handleCircleClick = async () => {
    if (phase === 'ready') {
      // 너무 빨리 클릭
      resetWaitingTimer();
      setPhase('tooSoon');
      startTsRef.current = null;
      return;
    }
    if (phase === 'go' && startTsRef.current != null) {
      const rt = Math.round(performance.now() - startTsRef.current);
      setCurrent(rt);
      setRecords((prev) => [...prev, rt]);
      setPhase('result');
      startTsRef.current = null;

      // 측정 완료 후 서버에 기록 저장 및 랭킹 갱신
      try {
        const saveResult = await saveReactionTimeRecord(rt);
        if (saveResult.success) {
          console.log('기록이 저장되었습니다.');
          if (saveResult.isNewBest) {
            alert('🎉 새로운 최고 기록입니다!');
          }
          // 기록 저장 후 최신 랭킹 정보를 다시 불러오기
          fetchAllRankings();
        }
      } catch (error) {
        console.error('기록 저장에 실패했습니다:', error);
      }
    }
  };

  const handleReset = () => {
    resetWaitingTimer();
    setPhase('idle');
    setCurrent(null);
    setRecords([]);
  };

  const circleColor =
    phase === 'go'
      ? 'bg-red-500'
      : phase === 'tooSoon'
      ? 'bg-red-100'
      : 'bg-gray-100';

  const statusText =
    phase === 'idle'
      ? '게임 시작을 기다리는 중...'
      : phase === 'ready'
      ? '빨간색으로 바뀌면 바로 클릭하세요!'
      : phase === 'go'
      ? '지금! 클릭!'
      : phase === 'tooSoon'
      ? '너무 빨랐어요! (다시 시작)'
      : current != null
      ? `${current} ms`
      : '결과 없음';

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">반응속도 테스트</h1>
          <p className="text-sm text-gray-600">
            티켓팅 성공을 위한 반응속도 측정을 시작하세요!
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 좌측: 메인 카드 */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* 원형 영역 */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleCircleClick}
                  className={[
                    'flex h-64 w-64 items-center justify-center rounded-full border text-gray-700',
                    circleColor,
                    phase === 'go'
                      ? 'border-green-300'
                      : phase === 'tooSoon'
                      ? 'border-red-300'
                      : 'border-gray-200',
                    'select-none',
                  ].join(' ')}
                >
                  <span className="text-center text-gray-700">
                    {statusText}
                  </span>
                </button>

                {/* 안내 텍스트 */}
                <p className="mt-6 text-center text-sm text-gray-600">
                  아래 버튼을 눌러 게임을 시작하세요
                </p>

                {/* 버튼들 */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleStart}
                    disabled={phase === 'ready' || phase === 'go'}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    게임 시작
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    기록 초기화
                  </button>
                </div>
              </div>
            </div>

            {/* 팁 카드 */}
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span>🎯 반응속도 향상 팁</span>
              </h3>
              <ul className="space-y-1 text-sm text-amber-900">
                <li>
                  🟡 화면을 집중해서 보고, 빨간색으로 바뀌는 순간 즉시 클릭!
                </li>
                <li>
                  🟡 마우스나 터치패드를 편안하게 잡고 준비 자세를 취하세요.
                </li>
                <li>
                  🟡 너무 일찍 클릭하지 마세요. 성급한 클릭은 실패로 처리됩니다.
                </li>
                <li>🟡 꾸준한 연습이 평균 반응속도 향상의 핵심입니다.</li>
              </ul>
            </div>
          </section>

          {/* 우측: 통계 카드 */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span>📍 현재 기록</span>
              </h3>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-3xl font-bold tracking-tight">
                  {current != null ? `${current}` : '— — —'}
                </p>
                <p className="text-xs text-gray-500">밀리초 (ms)</p>
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-lg font-semibold">
                  {average != null ? `${average} ms` : '— — —'}
                </p>
                <p className="text-xs text-gray-500">평균 반응속도</p>
              </div>
            </div>

            {/* '내 순위' 카드 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <span>📊 내 순위</span>
              </h3>
              {myRankInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        최고 기록
                      </p>
                      <p className="text-lg font-bold">
                        {Math.round(parseFloat(myRankInfo.user_best_time))} ms
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">
                        전체 순위
                      </p>
                      <p className="text-lg font-bold">
                        #{myRankInfo.best_rank}
                      </p>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-400">
                    {myRankInfo.username} 님
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-500">
                  아직 측정 기록이 없습니다.
                </div>
              )}
            </div>

            {/*'TOP 10' 랭킹 보드*/}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span>🏆 TOP 10</span>
              </h3>
              {topRankings.length > 0 ? (
                <ul className="space-y-2">
                  {topRankings.map((user) => (
                    <li
                      key={user.user_id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-600 w-6 text-center">
                          {user.rank}
                        </span>
                        <span className="font-medium text-gray-800">
                          {user.username}
                        </span>
                      </div>
                      <span className="font-bold text-indigo-600">
                        {Math.round(parseFloat(user.user_best_time))} ms
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-center text-gray-500">
                  랭킹 정보가 없습니다.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

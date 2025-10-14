// 알림 대기 상태 표시 (타이머)
'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlarmData } from './AlarmModal';

interface AlertSetting {
  type: string;
  time: number;
  message: string;
  priority?: string;
}

interface IntervalCalculationResult {
  success: boolean;
  data: {
    optimalRefreshTime: string;
    refreshInterval: number;
    alertSettings: AlertSetting[];
    confidence: number;
    networkAnalysis: {
      condition: string;
      averageRTT: number;
    };
  };
}

interface AlarmCountdownProps {
  alarm: AlarmData;
  onComplete?: () => void;
  finalUrl?: string; // 검색 결과의 최종 URL
}

export default function AlarmCountdown({
  alarm,
  onComplete,
  finalUrl,
}: AlarmCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [intervalResult, setIntervalResult] =
    useState<IntervalCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showAlertTime, setShowAlertTime] = useState(false);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  // 빨간색 배경 효과 (전체 화면)
  useEffect(() => {
    if (alarm.options.red && (showAlertTime || showRefreshMessage)) {
      // 전체 화면을 빨간색으로 변경
      document.body.style.backgroundColor = '#ef4444'; // bg-red-500
      document.body.style.transition = 'background-color 0.3s ease';
    } else {
      // 원래 배경색으로 복원
      document.body.style.backgroundColor = '';
      document.body.style.transition = 'background-color 0.3s ease';
    }

    // 컴포넌트 언마운트 시 원래 배경색으로 복원
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.transition = '';
    };
  }, [alarm.options.red, showAlertTime, showRefreshMessage]);

  // 소리 재생 함수 (5초간 삡 소리)
  const playAlarmSound = useCallback(() => {
    if (!alarm.options.sound) return;

    // AudioContext를 사용하여 삡 소리 생성
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz 삡 소리
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 5,
    ); // 5초간 감소

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 5);
  }, [alarm.options.sound]);

  // 메시지 표시 시 소리 재생
  useEffect(() => {
    if ((showAlertTime || showRefreshMessage) && !hasPlayedSound) {
      playAlarmSound();
      setHasPlayedSound(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAlertTime, showRefreshMessage, hasPlayedSound]);

  // Interval 계산 API 호출
  const calculateInterval = async (
    targetUrl: string,
    targetTime: string,
    userAlertOffsets: number[],
  ) => {
    try {
      setIsCalculating(true);
      const response = await fetch(
        '${process.env.NEXT_PUBLIC_API_BASE}/interval/calculate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUrl,
            targetTime,
            userAlertOffsets:
              userAlertOffsets.length > 0 ? userAlertOffsets : undefined,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        setIntervalResult(result);
        return result;
      } else {
        throw new Error(result.error || 'Interval 계산 실패');
      }
    } catch (error) {
      console.error('Interval 계산 오류:', error);
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  // 알림 메시지 체크
  const checkAlertMessages = useCallback(() => {
    if (
      intervalResult?.data?.optimalRefreshTime &&
      !hasPlayedSound &&
      !showRefreshMessage
    ) {
      // optimalRefreshTime을 기준으로 정확한 시점 계산
      const optimalTime = new Date(intervalResult.data.optimalRefreshTime);
      const now = new Date();
      const timeUntilOptimal = Math.floor(
        (optimalTime.getTime() - now.getTime()) / 1000,
      );

      // optimalRefreshTime 시점에 도달하면 "지금 새로고침하세요!" 표시하고 카운트다운 숨김
      if (timeUntilOptimal <= 0 && timeUntilOptimal >= -1) {
        console.log('🔔 optimalRefreshTime 도달: 지금 새로고침하세요!');

        setShowRefreshMessage(true); // "지금 새로고침하세요!" 표시
        setShowCountdown(false); // 카운트다운 숨김
        // 소리는 useEffect에서 재생
      }
    }
  }, [intervalResult, hasPlayedSound, showRefreshMessage]);

  // 남은 시간을 HH:MM:SS로 포맷팅
  const formatTime = (totalSeconds: number) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      '0',
    );
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours} : ${minutes} : ${seconds}`;
  };

  useEffect(() => {
    const initializeCountdown = async () => {
      const now = new Date();
      const target = new Date();

      target.setHours(parseInt(alarm.time.hour));
      target.setMinutes(parseInt(alarm.time.minute));
      target.setSeconds(parseInt(alarm.time.second));
      target.setMilliseconds(0);

      let seconds = Math.floor((target.getTime() - now.getTime()) / 1000);
      if (seconds < 0) seconds = 0;
      setRemainingSeconds(seconds);

      // 디버깅: 시간 계산 확인
      console.log('🕐 시간 계산:', {
        now: now.toISOString(),
        target: target.toISOString(),
        seconds: seconds,
        hours: Math.floor(seconds / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
      });

      // Interval 계산 사용 시 API 호출 (한 번만)
      if (alarm.options.useIntervalCalculation && finalUrl && !hasCalculated) {
        setHasCalculated(true);
        const result = await calculateInterval(
          finalUrl,
          target.toISOString(),
          alarm.options.customAlertOffsets,
        );

        if (result?.success) {
          // 디버깅: Interval 계산 결과 확인
          console.log('🎯 Interval 계산 결과:', {
            optimalRefreshTime: result.data.optimalRefreshTime,
            refreshInterval: result.data.refreshInterval,
            alertSettings: result.data.alertSettings,
          });

          // Interval 계산 결과에 따른 알림 스케줄링
          scheduleIntervalAlerts();
        }
      } else if (!alarm.options.useIntervalCalculation) {
        // 기본 알림 스케줄링
        scheduleDefaultAlerts(alarm.options.preAlerts);
      }

      const interval = setInterval(() => {
        seconds -= 1;
        setRemainingSeconds(seconds);

        // 알림 메시지 체크
        checkAlertMessages();

        // 기본 알림 모드: 사전 알림 시간에 도달했을 때 체크
        if (
          !alarm.options.useIntervalCalculation &&
          alarm.options.preAlerts.length > 0
        ) {
          alarm.options.preAlerts.forEach((alertSeconds) => {
            if (seconds === alertSeconds) {
              console.log(`🔔 ${alertSeconds}초 전 알림 도달`);
              setShowCountdown(false); // 카운트다운 숨김
              setShowAlertTime(true); // 알림 시간 메시지 표시
              setRemainingSeconds(0);
              // 소리는 여기서 재생하지 않음 - 메시지 표시 시에만 재생
              // onComplete 호출하지 않고 여기서 멈춤
            }
          });
        }

        // 카운트다운은 항상 목표 시간까지 계속 진행
        if (seconds <= 0) {
          clearInterval(interval);
          setRemainingSeconds(0);

          // 기본 알림 모드에서 사전 알림이 없을 때도 "알림 시간입니다!" 표시
          if (!alarm.options.useIntervalCalculation) {
            setShowCountdown(false);
            setShowAlertTime(true);
            // 소리는 useEffect에서 재생
          } else {
            onComplete?.();
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    };

    initializeCountdown();
  }, [alarm, onComplete, finalUrl, checkAlertMessages, hasCalculated]);

  // Interval 계산 결과에 따른 알림 스케줄링
  const scheduleIntervalAlerts = () => {
    // 알림을 즉시 표시하지 않고, 빈 배열로 초기화
    setAlertMessages([]);
    console.log('🎯 Interval 알림 스케줄링 준비 완료');
  };

  // 기본 알림 스케줄링
  const scheduleDefaultAlerts = (preAlerts: number[]) => {
    // 기본 알림 메시지 생성
    const alerts: string[] = [];

    preAlerts.forEach((alertSeconds) => {
      if (alertSeconds === 60) {
        alerts.push('1분 전 알림');
      } else if (alertSeconds === 30) {
        alerts.push('30초 전 알림');
      } else if (alertSeconds === 10) {
        alerts.push('10초 전 알림');
      } else {
        alerts.push(`${alertSeconds}초 전 알림`);
      }
    });

    setAlertMessages(alerts);
    console.log('🎯 기본 알림 스케줄링:', alerts);
  };

  return (
    <div className="my-8 text-center">
      <div className="max-w-lg rounded-2xl mx-auto">
        {/* Interval 계산 상태 */}
        {isCalculating && (
          <div className="mb-4 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">네트워크 분석 중...</span>
            </div>
          </div>
        )}

        {/* 카운트다운 타이머 */}
        {showCountdown && (
          <div className="text-4xl font-bold tracking-widest text-black">
            {remainingSeconds !== null
              ? remainingSeconds > 0
                ? formatTime(remainingSeconds)
                : alarm.options.useIntervalCalculation
                ? '' // Interval 옵션 사용자는 목표 시간에 도달해도 메시지 표시 안함
                : ''
              : '대기 중...'}
          </div>
        )}

        {/* 기본 알림 모드: 사전 알림 시간 도달 시 메시지 표시 */}
        {!alarm.options.useIntervalCalculation && showAlertTime && (
          <div className="text-4xl font-bold tracking-widest text-red-600">
            알림 시간입니다!
          </div>
        )}

        {/* Interval 모드: optimalRefreshTime 도달 시 메시지 표시 */}
        {alarm.options.useIntervalCalculation && showRefreshMessage && (
          <div className="text-4xl font-bold tracking-widest text-red-600">
            지금 새로고침하세요!
          </div>
        )}

        {/* 알림 메시지 */}
        {alertMessages.length > 0 && (
          <div className="mt-4 text-xs text-gray-600">
            {alertMessages.map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
        )}

        {/* Interval 계산 사용 시 추가 정보 */}
        {alarm.options.useIntervalCalculation && intervalResult && (
          <div className="mt-4 text-xs text-gray-600">
            <div>
              최적 새로고침:{' '}
              {(intervalResult.data.refreshInterval / 1000).toFixed(1)}초 전
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

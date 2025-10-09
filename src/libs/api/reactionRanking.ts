import { AuthUtils } from '@/libs/auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// API 요청을 위한 기본 fetch 함수
async function fetchApi(path: string, options: RequestInit = {}) {
  const headers = new Headers({
    ...AuthUtils.getAuthHeaders(),
    ...options.headers,
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 반응속도 기록을 서버에 저장합니다.
 * @param refreshTime 측정된 반응속도 (ms)
 */
export const saveReactionTimeRecord = (refreshTime: number) => {
  return fetchApi('/refresh-records', {
    method: 'POST',
    body: JSON.stringify({ refreshTime }),
  });
};

/**
 * 내 주변 순위 정보를 가져옵니다.
 * @param range 조회할 순위 범위
 */
export const getNearbyRankings = (range: number) => {
  alert(`getNearbyRankings 함수 실행! Range: ${range}`); // 👈 이 줄을 추가!

  // 템플릿 리터럴을 사용해 range 쿼리 파라미터를 추가합니다.
  return fetchApi(`/refresh-records/nearby?range=${range}`, {
    method: 'GET',
  });
};

/**
 * TOP 10 랭킹 정보를 가져옵니다.
 */
export const getTop10Rankings = () => {
  return fetchApi('/refresh-records/stats', {
    method: 'GET',
  });
};

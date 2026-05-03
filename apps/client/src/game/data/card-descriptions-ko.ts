export interface CardDescriptionKo {
  value: number;
  nameEn: string;
  nameKo: string;
  shortNameKo: string;
  symbol: string;
  effect: string;
  flavor?: string;
  gradientTop: number;
  gradientBottom: number;
}

const CARD_DESCRIPTIONS: CardDescriptionKo[] = [
  // Value 0
  {
    value: 0,
    nameEn: "Jester",
    nameKo: "광대 다리우스",
    shortNameKo: "광대",
    symbol: "\u{1F3AD}",
    effect: "플레이어 1명을 선택합니다. 그 플레이어가 이번 라운드에서 승리하면, 당신이 토큰을 획득합니다.",
    flavor: "그의 웃음 뒤에는 계략이 숨어있다.",
    gradientTop: 0x555555,
    gradientBottom: 0x333333,
  },
  {
    value: 0,
    nameEn: "Assassin",
    nameKo: "암살자",
    shortNameKo: "암살자",
    symbol: "\u{1F5E1}",
    effect: "수동: 경비병에게 정확히 지목당하면, 대신 경비병 플레이어가 탈락합니다.",
    flavor: "어둠 속에서 기다리는 자.",
    gradientTop: 0x444444,
    gradientBottom: 0x1a1a1a,
  },
  // Value 1
  {
    value: 1,
    nameEn: "Guard",
    nameKo: "경비병",
    shortNameKo: "경비병",
    symbol: "\u{2694}",
    effect: "대상 1명과 1이 아닌 카드 이름을 선택합니다. 맞추면 대상이 탈락합니다.",
    flavor: "궁정을 지키는 충실한 병사.",
    gradientTop: 0x5b9bd5,
    gradientBottom: 0x2e5a88,
  },
  // Value 2
  {
    value: 2,
    nameEn: "Priest",
    nameKo: "사제 토마스",
    shortNameKo: "사제",
    symbol: "\u{1F54A}",
    effect: "대상 1명의 손패를 몰래 확인합니다.",
    flavor: "신의 눈으로 진실을 본다.",
    gradientTop: 0x8b7bdb,
    gradientBottom: 0x4a3a8a,
  },
  {
    value: 2,
    nameEn: "Cardinal",
    nameKo: "추기경 베스퍼",
    shortNameKo: "추기경",
    symbol: "\u{271D}",
    effect: "2명의 플레이어가 손패를 교환하게 하고, 그 중 1명의 패를 확인합니다.",
    flavor: "교회의 권위 앞에 비밀은 없다.",
    gradientTop: 0x9b6bdb,
    gradientBottom: 0x5a3a9a,
  },
  // Value 3
  {
    value: 3,
    nameEn: "Baron",
    nameKo: "남작 탈루스",
    shortNameKo: "남작",
    symbol: "\u{2696}",
    effect: "대상 1명과 손패를 비교합니다. 값이 낮은 쪽이 탈락합니다.",
    flavor: "힘의 대결은 피할 수 없다.",
    gradientTop: 0xe63946,
    gradientBottom: 0x8b1a25,
  },
  {
    value: 3,
    nameEn: "Baroness",
    nameKo: "남작부인 피오나",
    shortNameKo: "남작부인",
    symbol: "\u{1F441}",
    effect: "1~2명의 플레이어 손패를 몰래 확인합니다.",
    flavor: "그녀의 시선에서 벗어날 수 없다.",
    gradientTop: 0xd63a4a,
    gradientBottom: 0x7b1a2a,
  },
  // Value 4
  {
    value: 4,
    nameEn: "Handmaid",
    nameKo: "시녀 수잔나",
    shortNameKo: "시녀",
    symbol: "\u{1F6E1}",
    effect: "다음 턴까지 보호받습니다. 아무도 당신을 대상으로 지정할 수 없습니다.",
    flavor: "충성스러운 시녀의 헌신적 보호.",
    gradientTop: 0x4acd4a,
    gradientBottom: 0x2a7a2a,
  },
  {
    value: 4,
    nameEn: "Sycophant",
    nameKo: "아첨꾼 모리스",
    shortNameKo: "아첨꾼",
    symbol: "\u{1F3AF}",
    effect: "플레이어 1명을 선택합니다. 다음에 대상이 필요한 카드는 반드시 그 플레이어를 지목해야 합니다.",
    flavor: "남의 불행은 그의 기회.",
    gradientTop: 0x3acd3a,
    gradientBottom: 0x1a7a1a,
  },
  // Value 5
  {
    value: 5,
    nameEn: "Prince",
    nameKo: "왕자 아르노",
    shortNameKo: "왕자",
    symbol: "\u{1F451}",
    effect: "아무 플레이어 1명(자신 포함)이 손패를 버리고 새 카드를 뽑습니다.",
    flavor: "왕자의 명령은 절대적이다.",
    gradientTop: 0xffa040,
    gradientBottom: 0xb86a20,
  },
  {
    value: 5,
    nameEn: "Count",
    nameKo: "백작 군트람",
    shortNameKo: "백작",
    symbol: "\u{1F396}",
    effect: "즉시 효과 없음. 버린 패 더미에 있는 백작 1장당 라운드 종료 시 손패 값 +1.",
    flavor: "그의 영향력은 보이지 않게 쌓인다.",
    gradientTop: 0xe89020,
    gradientBottom: 0xa86010,
  },
  // Value 6
  {
    value: 6,
    nameEn: "King",
    nameKo: "왕 아르노 4세",
    shortNameKo: "왕",
    symbol: "\u{1F934}",
    effect: "대상 1명과 손패를 교환합니다.",
    flavor: "왕의 권위로 모든 것을 차지한다.",
    gradientTop: 0xffd700,
    gradientBottom: 0xb8960a,
  },
  {
    value: 6,
    nameEn: "Constable",
    nameKo: "경찰 빅토르",
    shortNameKo: "경찰",
    symbol: "\u{1F396}",
    effect: "즉시 효과 없음. 이 카드가 버린 패 더미에 있을 때 탈락하면 토큰을 획득합니다.",
    flavor: "법의 수호자는 죽어서도 정의를 지킨다.",
    gradientTop: 0xe8c800,
    gradientBottom: 0xa89000,
  },
  // Value 7
  {
    value: 7,
    nameEn: "Countess",
    nameKo: "백작부인 빌헬미나",
    shortNameKo: "백작부인",
    symbol: "\u{1F48E}",
    effect: "왕(6) 또는 왕자(5)와 함께 들고 있으면 반드시 이 카드를 내야 합니다. 효과 없음.",
    flavor: "그녀의 비밀은 영원히 감춰져야 한다.",
    gradientTop: 0xba55d3,
    gradientBottom: 0x6a2a7a,
  },
  {
    value: 7,
    nameEn: "Dowager Queen",
    nameKo: "태후 투미아",
    shortNameKo: "태후",
    symbol: "\u{1F451}",
    effect: "대상 1명과 손패를 비교합니다. 값이 높은 쪽이 탈락합니다.",
    flavor: "젊은이의 야망은 경험 앞에 무릎 꿇는다.",
    gradientTop: 0xa845c3,
    gradientBottom: 0x5a2a6a,
  },
  // Value 8
  {
    value: 8,
    nameEn: "Princess",
    nameKo: "공주 아네트",
    shortNameKo: "공주",
    symbol: "\u{1F478}",
    effect: "이 카드를 어떤 이유로든 버리면 즉시 탈락합니다.",
    flavor: "공주의 사랑을 잃으면 모든 것을 잃는다.",
    gradientTop: 0xff85c0,
    gradientBottom: 0xb8406a,
  },
  // Value 9
  {
    value: 9,
    nameEn: "Bishop",
    nameKo: "주교 비니치오",
    shortNameKo: "주교",
    symbol: "\u{2657}",
    effect: "숫자와 대상을 선택합니다. 맞추면 토큰을 획득하고, 대상은 패를 버리고 다시 뽑을 수 있습니다.",
    flavor: "신의 뜻을 아는 자.",
    gradientTop: 0x20c8d1,
    gradientBottom: 0x107a80,
  },
];

/**
 * Get Korean card description by value and English name.
 * Falls back to matching by value only if exact name match fails.
 */
export function getCardDescriptionKo(
  value: number,
  nameEn: string
): CardDescriptionKo | undefined {
  // Try exact match first (value + name substring)
  const exactMatch = CARD_DESCRIPTIONS.find(
    (d) => d.value === value && nameEn.toLowerCase().includes(d.nameEn.toLowerCase())
  );
  if (exactMatch) return exactMatch;

  // Fallback: first match by value
  return CARD_DESCRIPTIONS.find((d) => d.value === value);
}

/**
 * Get all card descriptions (for help modal table).
 */
export function getAllCardDescriptions(): CardDescriptionKo[] {
  return CARD_DESCRIPTIONS;
}

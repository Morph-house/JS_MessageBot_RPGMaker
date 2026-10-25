////////////////////////////////////////////////////////////////////////////////
// 제작자/저작권자 : 카카오톡 봇 커뮤니티 - 로젠다로 , Morph's House - 모프
// 커뮤니티 : https://cafe.naver.com/nameyee,
// 개발자 블로그 : https://blog.naver.com/highkrs
// 소스 버전 : v1.0
// 관련 소스는 무료 배포용입니다.
// 사용, 복사, 수정을 허용하되 저작권자를 반드시 표기해야합니다.
// 해당 소스의 오류, 버그로 인하여 발생한 손해 및 어떠한 클래임도 책임지지 않습니다.
// 해당 소스로 상업적/불법적인 행위로 발생한 모든 책임을 지지 않습니다.
////////////////////////////////////////////////////////////////////////////////

const Version = "1.9.9";
const def_Log = false;
const dummy = "\u200b".repeat(500);
const ShortCutCount = 5;            // 단축키 하나에 들어갈수 있는 명령어 갯수
const TimeStempFlag = false;        // 수행시간을 출력 유무를 설정 (false : 실행x, true : 실행o)
const EvalFlag = false;             // 이발코드 활성화 유무  (false : 실행x, true : 실행o)
const ProtectMacro = true;         // 매크로 방지 활성화 유무  (false : 실행x, true : 실행o)
const SendErrorMsg = false;         // 메인방에 오류메시지 전달 유무 (false : 실행x, true : 실행o)
const MacroMaxCount = 150;          // 매크로 방지시 명령어 max 카운터
const MacroCodeLength = 4;          // 매크로 방지코드 길이 (최대 4개)
const CommandDelay = 100;           // 명령어당 딜레이 시간 1000 >> 1초
const CommandLockTime = 2 * 60 * 1000; // 명령어당 락 걸림 시간 디폴트 10분

const SaveDelay = false;             // 세이브 딜레이를 쓸지 말지 정하는 설정 ture : 사용함, false : 사용안함
const SaveMaxCount = 5;             // 세이브 빈도수 (횟수) >> 작을수록 세이브를 빈번하게 한다.
const SaveCycle = 3;                // 세이브 사이클 주기 (초) >> 세이브 딜레이 타임 : 클수록 세이브를 늦게 한다.

const SkillSpace = 5;               // 공격 스킬 공간 갯수
const HealSkillSpace = 3;           // 힐 스킬 공간 갯수

const MainRoomName = ["GameRoom", "botroom"];    // 메인방 이름들 [mainroom , sub mainroom, ..... sub mainroom]
const MainRoomAlarm = [true, false];            // 메인방 갯수대로 입력 메인룸에 3개 입력되어 여기도 3개 입력 필수
const GameRoomURL = "https://open.kakao.com/o/sGLpeKwb";
const DumpTimeOut = 5 * 60 * 1000;  // 메모리덤핑 타임아웃
const CommandPrefix = "!";           // 명령어 접두어
const PartyPrefix = "$";           // 파티말 접두어
const MasterPrefix = "@";           // 마스터 명령어 접두어
const RandStatCount = 500;            // 캐릭 생성시 랜덤 스텟 횟수
const MaxHuntingCount = 50;          // 최대 사냥 횟수
const MaxHuntingTrunCount = 300;     // 1회 사냥 턴수
const DieRune = 100;                 // 죽었을때 지불해야 할 룬
const DefaultAP = 100;               // 초기 기본 Ap 수치
const MiningDefaultSpeed = 1 * 60 * 1000;  // 채굴시간 (ms)
const MiningMaxCount = 720;        // 최대 채굴 갯수
const FellingDefaultSpeed = 1 * 60 * 1000;  // 벌목시간 (ms)
const FellingMaxCount = 720;        // 최대 벌목 갯수
const StoningDefaultSpeed = 1 * 60 * 1000;  // 벌목시간 (ms)
const StoningMaxCount = 720;        // 최대 벌목 갯수
const GettingDefaultSpeed = 1 * 60 * 1000;  // 채집시간 (ms)
const GettingMaxCount = 720;        // 채집 벌목 갯수
const UserJoinBattleYN = true;       // 유저 전투 참여 여부
const CurrUserLocationInfo = true;       // 현위치 정보 보여주기 유무
const RateWeight = 100;             // 배율 수치의 가중치 (크리율, 회피율 등등)
const MinAttackSpeedCounter = 500;   // 전투시 어택스피드 최소 길이 Bar 길이
const MaxAttackSpeedRate = 3;        // 전투시 어택스피드 배율
const CriticalDamageRate = 1.2;     // 디폴트 크리티컬 데미지 배율
const IncCriticalMaxDamage = 3;     // 크리티컬 최대 배수 ex> 3 : 최대 3배
const HealSkillIncRate = 2;         // 힐량 증가 폭
const BattleCount = 200;            // 결투장 배틀 횟수
const BettingRuneLimit = 50000;     // 최고 배팅 한도
const MercenaryCount = 3;           // 용병 고용 한도
const MercenaryExpWeight = 1;       // 용병 경험치 가중치 1 ~ ... 1이 가장 많이 획득 2면 1/2 3이면 1/3 토막난다.
const MercenaryHealSkillRate = 50;  // 용병 힐스킬 쓸때 체력 비율 ex> 60 이면 남은 체력 60% 미만일경우 힐을 쓴다.
const MonsterHealSkillRate = 50;    // 몬스터 힐스킬 쓸때 체력 비율 ex> 60 이면 남은 체력 60% 미만일경우 힐을 쓴다.
const EatRiceMaxRune = 10;           // 식사하기 1인가격
const LodgeMaxRune = 50;            // 숙박하기 1인 가격
const ColosseumRune = 200;           // 결투장 도전 가격
const ClanMinPersonCount = 3;       // 클랜원 최소 인원
const ClanPointPerDonation = 100;   // 클랜 기부 룬/기부 비율
const ClanConfirmRune = 1000000;    // 클랜 인증 가격
const LoanMaxRune = 1000000;        // 대출 최대 액수
const RankingCount = 30;            // 결투장 Top 랭킹 갯수
const WorldBossHuntingCount = 50;   // 월드보스 턴 횟수
const WorldBossAutoSommon = 120;     // 월드보스 자동 소환 주기 (분) ex> 10이면 10분마다 월드보스를 소환하려고 시도한다.
const AlchemyRune = 1000000;        // 연금술에 필요한 룬가격
const AlchemyCount = 10;            // 연금술 1회 시도 갯수
const CouponIndex = "71";           // 연금술 쿠폰 인덱스 (반드시 쌍따옴표 안에 표시)
const RuneConsume = true;           // 마석흡수 사용 유무 true : 사용함, false : 사용안함
const BuffCount = 5;                // 적용받을수 있는 총 버프 갯수
const LimitRuneConsume = 250;       // 마석흡수 한도
const ResetHomeWorkTime = 5;        // 숙제퀘스트 초기화 되는 시간 0시 ~ 23시
const ResetHomeWorkWeek = 1;        // 숙제퀘스트 초기화 되는 요일 0:일, 1:월, 2:화, 3:수, 4:목, 5:금, 6:토

const ExplorerRune1 = 10000;        // 탐험가 랜덤뽑기 룬가격 1단계
const ExplorerRune2 = 100000;       // 탐험가 랜덤뽑기 룬가격 2단계
const ExplorerRune3 = 1000000;      // 탐험가 랜덤뽑기 룬가격 3단계
const AutoHTMaxCount = 2000;        // 자동사냥 최대 사냥 갯수
const AutoHTSpeed = 60 * 1000;      // 자동사냥 기본 속도
const AutoHTBossRate = 0.1;         // 자동사냥 기본 보스 만날 확률
const AutoHTDropItemAmount = 1;     // 1 >> 100% ,2 >> 200% , 3 >> 300%

const AutoHTSpeedWgt = 0.5;            // dex 1당 가중치  (초)
const AutoHTBossRateWgt = 0.01;         // lub 1당 가중치 (%)
const AutoHTDropItemAmountWgt = 0.1;     // str 1당 가중치 (0.1 >> 10%)

const MPrice_Gap = 0.1;         // 0.1 >> 10%
const MPrice_PutLimit = 10;      // 거래소에 올릴수 있는 물품 갯수
const MPrice_Surtax = 0.1;      // 부가세 0.1 >> 10%
const MPrice_Fee = 0.2;         // 수수료 0.2 >> 20%
const MPrice_Average = 20;      // 최근 20개 평균으로 시장가를 정한다.
const MPrice_Minimum = 10;      // 거래소 최소가격

const Strength_DownRate = 50;   // 강화 실패시 강화 Level 다운 확률

const Pet_Name = "수호수";
const Pet_Meet_Comment = "거대한 성유물의 그림자가 드리워진 황량한 유적의 틈새. 그곳에 주변의 메마른 풍경과 어울리지 않는 수호수 @name이 당신을 바라봅니다. "; // 펫을 만날때 문구 @name은 반드시 기입하시기 바랍니다.
const Pet_Store_Familiarity = 30; // 창고 사용 가능 친밀도
const Pet_Buff_Familiarity = [100, 200, 500, 1000, 3000, 8000, 16000]; // 버프 갯수 친밀도 100에 도달하면 1개 200에 도달하면 2개 이런식이다.[1개, 2개, 3개, 4개 ....]
const Pet_ConversationTime = 300 * 60 * 1000;// 대화 /선물 텀
const Pet_StoreRune = 1000;// 한번 창고를 열떄 드는 비용
const Pet_AwakeRune = 1000000; // 펫 각성 1회 비용

const House_MoveRune = 50000000; // 이전비용
const House_DefualtEnvironment = 100; // 기본 집 환경도
const House_WarpGateCount = 3; //워프게이트 (가구 effect가 go 인 가구) 설치시 주어지는 워프저장 갯수
const House_SaveLocationCount = 1; //기록보관소 (가구 effect가 savelocation인 가구) 설치시 주어지는 워프 저장 갯수

const Fish_RARE_GRADE = ["US", "MS", "RS", "GS"]; // 레어 물고기 등급 지정
const Fish_Streaming_GRADE = [ "GS"];           // 축하 물고기 등급 지정
const Fishing_Enroll_Price = 50000; // 낚시 등록 룬 가격
const Fishing_Defualt_TimeTerm = 30;    // 낚시 물고기 잡는 기본 시간
const Fishing_Defualt_SizeRate = 0;    // 낚시 기본 사이즈업 비율
const Fishing_Defualt_UniqueRate = 0;   // 낚시 기본 유니크 물고기 낚일 비율
const Fishing_Ranking_Count = 100;      // 랭킹 최대 갯수
const Fishing_AllRanking_Count = 300;   // 랭킹 all 최대 갯수

const Gamble_ExchangeRate = 100; // 1코인당 100룬
const Gamble_MinCoin = 100; //  최소 100 코인이 있어야 입장 가능
const Gamble_Ante = 10; // 배팅 시작 금액
const Gamble_PlayerTime = 30 * 1000 ; // 자신의 턴의 소비 시간 기본 30초

const CALC_DPT_TURN = 100; // 전투력 측정에 필요한 턴수
const CLAC_DPT_DEFUALT_ASPD = 500; // 전투력 측정에 필요한 기본 어택스피드
const CLAC_DPT_DEFUALT_CRI = 500; // 전투력 측정에 필요한 기본 크리수치

const Library_Reading_Rune = 10000; // 한번 열람시 작가가 획득되는 돈

const SummonSkill_Defualt_Cnt = 1;
const SummonSkill_NextLv_Cnt = [30, 70, 110, 150, 200];

const PartyMemberCount = 5; // 파티인원 맴버 최대수

const DungeonCrossCount = 3; // 던전 갈림길 최대 갯수
const DungeonComplexity = 2; // 던전 복잡도 Level >>> 1이면 한번 꼬움, 2면 두번 꼬움 0이면 안꼬움
const DungeonHuntingCount = 300; // 던전 총 사냥 턴수

const StockFee = 0.1;           // 주식 판매시 수수료
const StockCalcTime = 60 * 60 * 1000; // 주식 갱신 시간 주기

const AutoAPRecovery = true; // True 이면 자동 AP 회복을 적용함, false이면 자동 Ap 회복 적용 안함
const AutoAPRecoveryTime = 2 * 60 * 1000; // AP 회복 주기 
const AutoAPRecoveryCount = 1;  // AP 회복량 

const OccupyDayofWeek = 6; // 0:일, 1:월, 2:화, 3:수, 4:목, 5:금, 6:토 >> 클랜전 요일 설정
const OccupyStartTime = 20; //24시간제로 0~23 까지 가능함 (단위 시간)
const OccupyTime = 60; // 클랜전 진행 시간 (단위 분)

const DeckMaxCount = 10; // 만들 수 있는 카드배틀 덱 갯수
const MaxCardCount = 30; // 한 덱에 가득 채울수 있는 카드 수
const MinCardCOunt = 20; // 한 덱에 최소 카드 수
const SameCardmax = 3; // 한덱에 같은 카드의 최대 갯수

const TermsofService = "헛짓거리 하면 영구정지임."; // 이용약관

const DigitalNumber = {
    _0 : ['■■■', '■□■', '■□■', '■□■', '■■■'],
    _1 : ['□□■', '□□■', '□□■', '□□■', '□□■'],
    _2 : ['■■■', '□□■', '■■■', '■□□', '■■■'],
    _3 : ['■■■', '□□■', '■■■', '□□■', '■■■'],
    _4 : ['■□■', '■□■', '■■■', '□□■', '□□■'],
    _5 : ['■■■', '■□□', '■■■', '□□■', '■■■'],
    _6 : ['■■■', '■□□', '■■■', '■□■', '■■■'],
    _7 : ['■■■', '□□■', '□□■', '□□■', '□□■'],
    _8 : ['■■■', '■□■', '■■■', '■□■', '■■■'],
    _9 : ['■■■', '■□■', '■■■', '□□■', '■■■']
};

const Deck = ["♠A","♠2","♠3","♠4","♠5","♠6","♠7","♠8","♠9","♠10","♠J","♠Q","♠K",
              "♦A","♦2","♦3","♦4","♦5","♦6","♦7","♦8","♦9","♦10","♦J","♦Q","♦K",
              "♣A","♣2","♣3","♣4","♣5","♣6","♣7","♣8","♣9","♣10","♣J","♣Q","♣K",
              "♥A","♥2","♥3","♥4","♥5","♥6","♥7","♥8","♥9","♥10","♥J","♥Q","♥K"];

const HomeworkType = {
    Attendance:"attendance",
    Mine:"mine",
    Getting:"getting",
    Stone:"stone",
    Tree:"tree",
    Hunting:"hunting",
    VictoryRoulette:"victoryroulette",
    Fight:"fight",
    Manufacture:"manufacture",
    Create:"create",
    Produce:"produce",
    Dungeon:"dungeon",
    WorldbossRune:"worldbossrune",
    Fieldboss:"fieldboss"
};
const HomeworkKind = {
    EveryDay:"everyday",
    Week:"week"
}

const rootPath = "sdcard/Kmjbot/";
const backupPath = "sdcard/Kmjbot/";
// const rootPath = "sdcard/TopofGod/";
// const backupPath = "sdcard/TopofGod/";
const LibraryPath = "Library/";
const SleepFolder = "SleepAccount/";
const SleepMatchingTable = "MatchingTable.txt";
const fileNameList = { UserList:"Users/UserList.txt",
                       ExchangeList:"Users/ExchangeList.txt",
                       MarketPrice:"Users/MarketPrice.txt",
                       PostList:"Users/PostList.txt",
                       CharactorList:"Charactor/CharactorList.txt",
                       CharOption:"Charactor/CharOption.txt",
                       MercenaryList:"Charactor/MercenaryList.txt",
                       RecordList:"Charactor/RecordList.txt",
                       RelationList:"Charactor/RelationList.txt",
                       RankingList:"Charactor/RankingList.txt",
                       ExplorerList:"Charactor/ExplorerList.txt",
                       AutoObtainList:"Charactor/AutoObtainList.txt",
                       PetList:"Charactor/PetList.txt",
                       GambleList:"Charactor/GambleList.txt",
                       WorldBossStatus:"WorldBoss/WorldBossStatus.txt",
                       ClanList:"Clan/ClanList.txt",
                       HomeList:"Charactor/HomeList.txt",
                       FisherManList:"Charactor/FisherManList.txt",
                       FishRankingList:"Users/FishRankingList.txt",
                       AttendanceList:"Users/AttendanceList.txt",
                       Job:"Users/Job.txt",
                       BookList:"Users/BookList.txt",
                       PartyList:"Users/PartyList.txt",
                       Event:"Setting/Event.txt",
                       HWResetTimer:"Setting/HWResetTimer.txt",
                       SleepMatchingTable:"Setting/MatchingTable.txt",
                       UserStockList:"Charactor/UserStockList.txt",
                       CurrentStock:"Users/CurrentStock.txt",
                       HomeworkList:"Charactor/HomeworkList.txt",
                       CardDeckList:"Charactor/CardDeckList.txt"
                    };
const DBNameTypeName = "txt";
const DBNameList = { Species:"DB/Species." + DBNameTypeName,
                    WearItem:"DB/WearItem." + DBNameTypeName,
                    SundryItem:"DB/SundryItem." + DBNameTypeName,
                    FunctionalityItem:"DB/FunctionalityItem." + DBNameTypeName,
                    Monster:"DB/Monster." + DBNameTypeName,
                    Nation:"DB/Nation." + DBNameTypeName,
                    City:"DB/City." + DBNameTypeName,
                    Facility:"DB/Facility." + DBNameTypeName,
                    Field:"DB/Field." + DBNameTypeName,
                    Dungeon:"DB/Dungeon." + DBNameTypeName,
                    DungeonMap:"DB/DungeonMap." + DBNameTypeName,
                    Skill:"DB/Skill." + DBNameTypeName,
                    Menufacture:"DB/Menufacture." + DBNameTypeName,
                    HighMenufacture:"DB/HighMenufacture." + DBNameTypeName,
                    Sale:"DB/Sale." + DBNameTypeName,
                    Skillsale:"DB/Skillsale." + DBNameTypeName,
                    Cc:"DB/CC." + DBNameTypeName,
                    Mercenary:"DB/Mercenary." + DBNameTypeName,
                    Hire:"DB/Hire." + DBNameTypeName,
                    Property:"DB/Property." + DBNameTypeName,
                    WorldBoss:"DB/WorldBoss." + DBNameTypeName,
                    WorldBossLoc:"DB/WorldBossLoc." + DBNameTypeName,
                    Mine:"DB/Mine." + DBNameTypeName,
                    Analyze:"DB/Analyze." + DBNameTypeName,
                    Person:"DB/Person." + DBNameTypeName,
                    Quest:"DB/Quest." + DBNameTypeName,
                    Conversation:"DB/Conversation." + DBNameTypeName,
                    ClanBuff:"DB/ClanBuff." + DBNameTypeName,
                    NationMove:"DB/NationMove." + DBNameTypeName,
                    Loan:"DB/Loan." + DBNameTypeName,
                    Deposit:"DB/Deposit." + DBNameTypeName,
                    Camping:"DB/Camping." + DBNameTypeName,
                    Alchemy:"DB/Alchemy." + DBNameTypeName,
                    OriginChar:"DB/OriginChar." + DBNameTypeName,
                    Exchange:"DB/Exchange." + DBNameTypeName,
                    BattleBuff:"DB/BattleBuff." + DBNameTypeName,
                    Strength:"DB/Strength." + DBNameTypeName,
                    StrengthList:"DB/StrengthList." + DBNameTypeName,
                    Decompose:"DB/Decompose." + DBNameTypeName,
                    PetFamily:"DB/PetFamily." + DBNameTypeName,
                    PetBuff:"DB/PetBuff." + DBNameTypeName,
                    Tower:"DB/Tower." + DBNameTypeName,
                    TowerMob:"DB/TowerMob." + DBNameTypeName,
                    Tree:"DB/Tree." + DBNameTypeName,
                    Stone:"DB/Stone." + DBNameTypeName,
                    Getting:"DB/Getting." + DBNameTypeName,
                    Building:"DB/Building." + DBNameTypeName,
                    Request:"DB/Request." + DBNameTypeName,
                    Recipe:"DB/Recipe." + DBNameTypeName,
                    Fish:"DB/Fish." + DBNameTypeName,
                    Fishing:"DB/Fishing." + DBNameTypeName,
                    SaleCoin:"DB/SaleCoin." + DBNameTypeName,
                    Attendance:"DB/Attendance." + DBNameTypeName,
                    SummonSkill:"DB/SummonSkill." + DBNameTypeName,
                    SummonMonster:"DB/SummonMonster." + DBNameTypeName,
                    Summonsale:"DB/Summonsale." + DBNameTypeName,
                    SaleCapital:"DB/SaleCapital." + DBNameTypeName,
                    Stock:"DB/Stock." + DBNameTypeName,
                    News:"DB/News." + DBNameTypeName,
                    RandBox:"DB/RandBox." + DBNameTypeName,
                    Tutorial:"DB/Tutorial." + DBNameTypeName,
                    Package:"DB/Package." + DBNameTypeName,
                    Homework:"DB/Homework." + DBNameTypeName
                };

const WearItem_Kind = {Far_Weapon:"fw",
                       Near_Weapon:"nw",
                       Magic_Weapon:"mw",
                       Wear:"wr",
                       Assis_Arrow:"aa",
                       Assis_Shield:"as",
                       TwoHand_Weapon:"tw"};

const ITEM_KIND = {WEARITEM:"WearItem",
                   SUNDRYITEM:"SundryItem",
                   FUNCTIONALITYITEM:"FunctionalityItem"};

const NearAttack = "str + str + dex";
const FarAttack = "str + dex + dex";
const MagicAttack = "int + int + (( com + spr) / 2)";
const Defense = "(con + con + str)/2";
const AttackSpeed = "(agi + agi + dex)/5";
const Accuracy = "(dex + dex + int)/3";
const Avoid = "(agi + dex)/2";
const Critical = "luk";
const Friendly = "(com + com + spr)/2";
const Godevil = "(com + spr + spr)/2";
const Technic = "(ept / 5) + Math.min(ept, str)";
const Wisdom = "(ept / 5) + Math.min(ept, int)";
const Insight = "(ept / 5) + Math.min(ept, agi)";
const Hp = "(con * 7) + (str * 3) + (dex * 2) + int";
const Mp = "int * 2";
const Sp = "str + dex";
const Dp = "com + spr";
const Ap = "con + ((str + dex + int + com + spr) / 5)";


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

const libConst = Bridge.getScopeOf("Const.js"); // const 변수들 Lib

var fix = libConst.CommandPrefix;
function Directions(_room, _msg, _replier, _isGroupChat) {
   if (libConst.MainRoomName.indexOf(_room) !== -1) {
      if (_msg === fix + "명령어") {
         _replier.reply("[명령어 목록]\n" +
            "   " + fix + "ID확인\n" +
            "   " + fix + "방정보\n" +
            "   " + fix + "도감\n" +
            "   " + fix + "리스트\n" +
            "   " + fix + "재료\n" +
            "   " + fix + "유저리스트\n" +
            "   " + fix + "랭킹\n" +
            "   " + fix + "낚시랭킹\n" +
            "   " + fix + "결장랭킹\n" +
            "   " + fix + "중계시작\n" +
            "   " + fix + "중계종료\n" +
            "   " + fix + "코드입력\n" +
            "   " + fix + "이벤트\n" +
            "   " + fix + "약관\n"
         );
         return true;
      }
      else {
          switch(_msg) {
            case fix + "ID확인":
                _replier.reply("사용법 : " + fix + "ID확인 [내가 사용할 ID]");
                return true;
            case fix + "도감":
                _replier.reply("사용법 : " + fix + "도감 [검색명]");
                return true;
            case fix + "리스트":
                _replier.reply("사용법 : " + fix + "리스트 [카테고리]\n\n" +
                               "[카테고리]\n" +
                               "  - 장비템\n" +
                               "  - 잡템\n" +
                               "  - 기능성템\n" +
                               "  - 종족\n" +
                               "  - 몬스터\n" +
                               "  - 용병\n" +
                               "  - 스킬\n" +
                               "  - 특성\n" +
                               "  - 상태이상\n" +
                               "  - 나라\n" +
                               "  - 마을\n" +
                               "  - 필드\n" + 
                               "  - 소환스킬\n" + 
                               "  - 소환수\n" +
                               "  - CC\n" +
                               "  - 클랜버프\n" +
                               "  - 대출\n" +
                               "  - 예금\n" +
                               "  - 주식\n");
                return true;
            case fix + "랭킹":
                _replier.reply("사용법 : " + fix + "랭킹 [능력치명]\n\n" +
                               "[랭킹종류]\n" +
                               "  - 공격력\n" +
                               "  - 마법력\n" +
                               "  - 방어력\n" +
                               "  - 공격속도\n" +
                               "  - 정확도\n" +
                               "  - 회피력\n" +
                               "  - 치명률\n" +
                               "  - 체력\n" +
                               "  - 마력\n" +
                               "  - 기력\n" +
                               "  - 행동력\n" +
                               "  - 기술력\n" +
                               "  - 지혜\n" +
                               "  - 통찰력\n");
                return true;
            case fix + "재료":
                _replier.reply("사용법 : " + fix + "재료 [아이템명]");
                return true;
            case fix + "낚시랭킹":
               _replier.reply("사용법 : " + fix + "낚시랭킹 [물고기 명] or [all]");
               return true;
            case fix + "중계시작":
               _replier.reply("사용법 : " + fix + "중계시작 [게임 명]\n\n" +
                              "[게임종류]\n" +
                              "  - 홀덤\n");
               return true;
            case fix + "중계종료":
               _replier.reply("사용법 : " + fix + "중계종료 [게임 명]\n\n" +
                              "[게임종류]\n" +
                              "  - 홀덤\n");
               return true;
          }
      }

   }
   else {
       if(_isGroupChat) return true;
       switch(_msg) {
           case fix + "명령어":
               _replier.reply(
                  "[명령어]\n" +
                  "   " + fix + "관리  (게임 관리 명령어)\n" +
                  "   " + fix + "게임  (게임 플레이 명령어)\n" +
                  "   " + fix + "설정  (게임 설정 명령어)\n" +
                  "   " + fix + "작가  (작가 명령어)\n" +
                  "   " + fix + "사서  (도서관 사서 명령어. 사서 권한 필요)\n" +
                  "   " + fix + "운영  (게임 운영 명령어. 운영자 권한 필요)\n" +
                  "   " + fix + "내권한  (게임에서 받은 권한을 확인)\n" +
                  "   " + fix + "방정보 (현재 카카오톡 방 정보를 확인)\n" +
                  "   " + fix + "약관"
               );
               return true;
          case fix + "관리":
              _replier.reply(
                 "[관리 명령어]" + libConst.dummy + "\n" +
                 "   " + fix + "등록      (게임 계정 등록 명령어)\n" +
                 "   " + fix + "PW변경    (비밀번호 변경 명령어)\n" +
                 "   " + fix + "로그인    (로그인 명령어)\n" +
                 "   " + fix + "로그아웃  (로그아웃 명령어)\n" +
                 "   " + fix + "키등록    (보안키를 설정하는 명령어)\n" +
                 "   " + fix + "활성화    (휴면된 계정을 되살림)\n" +
                 "   " + fix + "연동코드  (메인방과 연동할수 있는 코드를 발급함)\n" +
                 "   " + fix + "계정정보  (내 현재 계정 정보를 확인)\n\n" +
                 "[캐릭터 생성 명령어]\n" +
                 "   " + fix + "캐릭생성  (게임내 캐릭터 생성)\n" +
                 "   " + fix + "종족정보  (게임내 종족 설명)\n" +
                 "   " + fix + "종족선택  (종족 선택 명령어)\n" +
                 "   " + fix + "랜덤스텟  (캐릭터의 스테이터스를 결정)\n" +
                 "   " + fix + "스텟확정  (스테이터스를 확정)\n" +
                 "   " + fix + "캐릭삭제  (게임내 캐릭터를 삭제)\n\n" +
                 "[친구 명령어]\n" +
                 "   " + fix + "친구추가  (친구를 추가할 수 있음)\n" +
                 "   " + fix + "친구삭제  (등록된 친구를 삭제)\n" +
                 "   " + fix + "친구      (친구 목록 확인)\n" +
                 "   /(ID)      (친구에게 메시지 전달)"
              );
              return true;
          case fix + "등록":
              _replier.reply("사용법 : " + fix + "등록 [내가 사용할 Password]");
              return true;
          case fix + "PW변경":
              _replier.reply("사용법 : " + fix + "PW변경 [기존PW] [새로운PW]");
              return true;
          case fix + "로그인":
              _replier.reply("사용법 : " + fix + "로그인 [Password]");
              return true;
          case fix + "키등록":
              _replier.reply("사용법 : " + fix + "키등록 [Password]");
              return true;
          case fix + "종족정보":
              _replier.reply("사용법 : " + fix + "종족정보 [종족명]");
              return true;
          case fix + "종족선택":
              _replier.reply("사용법 : " + fix + "종족선택 [종족명]");
              return true;
          case fix + "단축키설정":
              _replier.reply("사용법 : " + fix + "단축키설정 [단축키 넘버] [명령어]");
              return true;
          case fix + "단축키삭제":
              _replier.reply("사용법 : " + fix + "단축키삭제 [단축키 넘버]");
              return true;
          case fix + "친구추가":
              _replier.reply("사용법 : " + fix + "친구추가 [친구ID]");
              return true;
          case fix + "친구삭제":
              _replier.reply("사용법 : " + fix + "친구삭제 [친구ID]");
              return true;
          case "/":
              _replier.reply("사용법 : /친구ID [할말]");
              return true;
       }
   }
   return false;
}
function PlayDirection(_room, _msg, _replier) {
    switch(_msg) {
        case fix + "게임":
           _replier.reply(
             "[게임 메뉴]" +libConst.dummy + "\n" +
              "   " + fix + "가이드      (내 위치 및 할수 있는 행동에 대해서 보여줌)\n" +
              "   " + fix + "튜토        (내 위치에서 튜토리얼을 보여줌)\n" +
              "   " + fix + "가방        (내 인벤토리, 장착 정보를 확인)\n" +
              "   " + fix + "스킬        (현재 내 보유 스킬을 확인)\n" +
              "   " + fix + "스텟        (현재 내 스테이터스를 확인)\n" +
              "   " + fix + "특성        (현재 보유 특성을 확인)\n" +
              "   " + fix + "장착        (장비 아이템을 입는다)\n" +
              "   " + fix + "탈착        (장비 아이템을 벗는다)\n" +
              "   " + fix + "룬          (현재 보유 룬 확인)\n" +
              "   " + fix + "코인        (현재 보유 코인 확인)\n" +
              "   " + fix + "사용        (사용가능 아이템을 사용함)\n" +
              "   " + fix + "재료        (제작 아이템의 재료를 검색)\n" +
              "   " + fix + "도감        (아이템, 몬스터, 마을 등을 검색)\n" +
              "   " + fix + "리스트      (아이템, 몬스터, 마을 등의 목록 검색)\n" +
              "   " + fix + "퀘스트      (수락한 퀘스트 목록)\n" +
              "   " + fix + "숙제        (일일퀘, 주간퀘 등을 확인)\n" +
              "   " + fix + "완료하기    (퀘스트를 완료하기 위한 명령어)\n" +
              "   " + fix + "포기하기    (퀘스트를 포기하기 위한 명령어)\n" +
              "   " + fix + "기록        (유저의 플레이 기록을 보여줌)\n" +
              "   " + fix + "통행증      (보유중인 통행증 리스트를 보여줌)\n" +
              (libConst.RuneConsume?"   " + fix + "마석흡수    (룬으로 스테이터스를 향상)\n":"") +
              "   " + fix + "용병        (보유중인 용병 리스트)\n" +
              "   " + fix + "캠핑        (아이템을 소모하여 HP/AP 회복)\n" +
              "   " + fix + "마이홈      (보유중인 자신의 집 정보 확인)\n" +
              "   " + fix + "버프        (현재 자신의 버프 리스트를 확인)\n" +
              "   " + fix + "레시피      (자신이 습득한 레시피 목록을 확인)\n" +
              "   " + fix + "출석        (하루에 한번 게임에 출석후 보상 획득)\n" +
              "   " + fix + "자동정산    (자동 채굴/채광/벌목/채집 을 완료)\n" +
              "   " + fix + "내계좌      (현재 내 주식 정보를 확인)\n" +
              (libConst.AutoAPRecovery?"   " + fix + "포인트회복    (시간으로 누적된 AP 회복)\n":"") +
              "\n" +
              "[탐험가 메뉴]\n" +
              "   " + fix + "탐험가      (보유중인 탐험가 정보를 확인)\n" +
              "   " + fix + "탐험가잠금  (획득한 탐험가를 삭제하지 않도록 잠금)\n" +
              "   " + fix + "탐험가풀기  (잠궈진 탐험가를 잠금해제)\n" +
              "   " + fix + "탐험가복귀  (사냥 보낸 탐험가를 복귀시킴)\n" +
              "\n" +
              "[낚시 메뉴]\n" +
              "   " + fix + "낚시장착    (낚시 장비를 착용한다)\n" +
              "   " + fix + "낚시탈착    (낚시 장비를 해제한다)\n" +
              "   " + fix + "낚시랭킹    (현재 잡은 물고기의 랭킹을 확인)\n" +
              "   " + fix + "낚시기록    (내가 잡은 물고기의 기록을 확인)\n" +
              "\n" +
              "[" + libConst.Pet_Name + " 메뉴]\n" +
              "   " + fix + libConst.Pet_Name + "      (자신의 " + libConst.Pet_Name + "정보를 확인)\n" +
              "   " + fix + "선물하기    (" + libConst.Pet_Name + "의 호감도를 올리기 위한 선물 정보 확인)\n" +
              "   " + fix + "선물       (" +libConst.Pet_Name+ "에게 선물을 함)\n" +
              "   " + fix + "아공간     (" + libConst.Pet_Name + "가 제공하는 창고)\n" +
              "   " + fix + "맡기기     (아공간에 물건을 맡김)\n" +
              "   " + fix + "꺼내기     (아공간에 물건을 꺼냄)\n" +
              "\n" +
              "[클랜 메뉴]\n" +
              "   " + fix + "클랜창설    (클랜을 만들기 위한 메뉴)\n" +
              "   " + fix + "창단원요청  (클랜 창단원을 초대 함)\n" +
              "   " + fix + "클랜        (현재 내가 가입한 클랜 정보를 확인)\n" +
              "   " + fix + "룬기부      (클랜창고에 룬을 기부)\n" +
              "   " + fix + "템기부      (클랜창고에 아이템을 기부)\n" +
              "   " + fix + "클랜항목    (현재 클랜의 리스트를 확인)\n" +
              "   " + fix + "클랜신청    (가입하고자 하는 클랜에 가입신청)\n" +
              "   " + fix + "신청대기항목 (현재 내가 신청한 클랜들의 리스트를 확인)\n" +
              "   " + fix + "클랜영입    (자신의 클랜에 신청한 유저들을 영입)\n" +
              "   " + fix + "클랜탈퇴    (현재 가입된 클랜에서 탈퇴)\n" +
              "   " + fix + "클랜추방    (자신의 클랜에서 특정 유저를 추방)\n" +
              "   " + fix + "클랜양도    (클랜 마스터를 다른 유저에게 전가)\n" +
              "   " + fix + "진급        (클랜원들의 직급을 한단계 올린다)\n" +
              "   " + fix + "강등        (클랜원들의 직급을 한단계 내린다)\n" +
              "\n" +
              "[파티 메뉴]\n" +
              "   " + fix + "파티        (내 파티 정보를 확인 함)\n" +
              "   " + fix + "파티목록    (파티의 목록을 보여줌)\n" +
              "   " + fix + "파티생성    (신규 파티를 생성함)\n" +
              "   " + fix + "파티해산    (파티를 해산함)\n" +
              "   " + fix + "파티신청    (파티 가입을 신청)\n" +
              "   " + fix + "파티수락    (현재 신청 리스트의 인원의 파티 가입을 수락)\n" +
              "   " + fix + "파티거절    (현재 신청 리스트의 인원의 파티 가입을 거절)\n" +
              "   " + fix + "파티강퇴    (파티원을 강퇴)\n" +
              "   " + fix + "파티장양도  (파티장을 다른 유저에게 양도)\n" +
              "   " + fix + "파티탈퇴    (가입되어 있는 파티에서 나옴)\n"
           );
           return true;
        case fix + "설정":
           _replier.reply(
             "[설정 메뉴]" +libConst.dummy + "\n" +
              "   " + fix + "정보보호    (정보보호 여부를 조회)\n" +
              "   " + fix + "정보보호켜기 (랭킹에 자신의 정보를 노출 중지)\n" +
              "   " + fix + "정보보호끄기 (랭킹에 자신의 정보를 노출 시킴)\n\n" +
              "   " + fix + "스킬설정    (사냥 스킬설정에 대한 설명 제공)\n" +
              "   " + fix + "스킬설정     (스킬을 입력)\n" +
              "   " + fix + "힐스킬설정   (스킬을 입력)\n" +
              "   " + fix + "큐어스킬설정 (스킬을 입력)\n" +
              "   " + fix + "스킬설정제거 (스킬설정을 제거)\n\n" +
              "   " + fix + "소환설정    (소환 스킬설정에 대한 설명 제공)\n" +
              "   " + fix + "소환설정추가 (소환 스킬을 입력)\n" +
              "   " + fix + "소환설정제거 (소환 스킬설정을 제거)\n\n" +
              "   " + fix + "결장설정    (결투장 스킬설정에 대한 설명 제공)\n" +
              "   " + fix + "결장설정    (스킬을 입력)\n" +
              "   " + fix + "결장설정제거 (결장설정을 제거)\n\n" +
              "   " + fix + "결장소환설정    (결장소환 스킬설정에 대한 설명 제공)\n" +
              "   " + fix + "결장소환설정추가 (결장소환 스킬을 입력)\n" +
              "   " + fix + "결장소환설정제거 (결장소환 스킬설정을 제거)\n\n" +
              "   " + fix + "포션설정    (사냥 포션설정에 대한 설명 제공)\n" +
              "   " + fix + "hp포션설정  (체력 포션을 입력)\n" +
              "   " + fix + "mp포션설정  (마나 포션을 입력)\n" +
              "   " + fix + "sp포션설정  (기력 포션을 입력)\n" +
              "   " + fix + "dp포션설정  (정신력 포션을 입력)\n" +
              "   " + fix + "행동력설정  (행동력에 대한 설명 제공)\n" +
              "   " + fix + "ap포션설정  (행동력 포션을 입력)\n" +
              "   " + fix + "포션설정제거 (포션설정을 제거)\n\n" +
              "   " + fix + "캠핑설정    (캠핑에 대한 설명 제공)\n" +
              "   " + fix + "캠핑장비설정 (캠핑장비를 입력)\n" +
              "   " + fix + "캠핑음식설정 (캠핑음식을 입력)\n\n" +
              "   " + fix + "단축키 (복잡한 명령어를 단축키로 등록함)\n" +
              "   " + fix + "단축키설정 (단축키를 등록)\n" +
              "   " + fix + "단축키삭제 (설정된 단축키를 제거)\n\n" +
              "   " + fix + "용병설정 (용병설정에 대한 설명 제공)\n" +
              "   " + fix + "용병출전 (용병을 출전시킴)\n" +
              "   " + fix + "용병휴식 (용병을 휴식시킴)\n\n" +
              "   " + fix + "전투로그켜기 (전투로그를 다 보여줌)\n" +
              "   " + fix + "전투로그끄기 (전투로그를 간소화 함)\n" +
              "   " + fix + "전투로그설정 (전투로그 설정 조회)\n"
           );
           return true;
       case fix + "작가":
          _replier.reply(
            "[작가 메뉴]" +libConst.dummy + "\n" +
             "   " + fix + "내글목록  (내가 쓰고있는 글의 목록을 가져온다.)\n" +
             "   " + fix + "내글보기  (내가 쓰고있는 글 내용을 가져온다.)\n" +
             "   " + fix + "새글     (새로운 글을 쓰기위한 명령어)\n" +
             "   " + fix + "불러오기 (이전에 썼던 글을 불러온다.)\n" +
             "   " + fix + "글쓰기   (글을 작성)\n" +
             "   " + fix + "글삭제    (내가 쓰고있는 글을 삭제한다.)\n" +
             "   " + fix + "책제거    (내가 쓰고있는 책을 삭제한다.)\n" +
             "   " + fix + "검수등록  (현재 쓴 글을 검수등록 한다.)\n"
          );
          return true;
      case fix + "사서":
           _replier.reply(
             "[사서 메뉴]" +libConst.dummy + "\n" +
              "(주의)해당 메뉴는 운영자에게 사서 권한을 받은사람만 사용가능합니다.\n" +
              "   " + fix + "검수    (다음 등록 대기중인 글을 읽는다.)\n" +
              "   " + fix + "패스    (현재 읽은 글을 통과 시킨다.)\n" +
              "   " + fix + "리젝    (현재 읽은 글을 리젝 시킨다.)\n"
           );
           return true;
       case fix + "운영":
           _replier.reply("[게임 운영 명령어]" +libConst.dummy + "\n" +
             "(주의)해당 메뉴는 운영자에게 부운영자 권한을 받은사람만 사용가능합니다.\n" +
             "  " + fix + "리로드 (게임 전체 컴파일)\n" +
             "  " + fix + "시작 (Main.js 스크립트를 켠다.)\n" +
             "  " + fix + "중단 (Main.js 스크립트를 끈다.)\n" +
             "  " + fix + "공지 (게임 플레이어에게 전체 공지)\n" +
             "  " + fix + "휴면전환 (장기미접속 캐릭터를 휴면 처리)\n" +
             "  " + fix + "관리자 (임명직 리스트를 보여줌)\n" +
             "  " + fix + "관리자임명 (부 관리자를 임명)\n" +
             "  " + fix + "관리자해임 (부 관리자를 해임)\n" +
             "  " + fix + "사서임명 (사서를 임명)\n" +
             "  " + fix + "사서해임 (사서를 해임)\n\n" +
             "[이벤트 명령어]\n" +
             "  " + fix + "룬드랍이벤 (룬 드랍에 대한 이벤트 설정)\n" +
             "  " + fix + "템드랍이벤 (템 드랍에 대한 이벤트 설정)\n" +
             "  " + fix + "이벤목록 (현재 설정된 이벤트 목록을 확인)\n" +
             "  " + fix + "이벤생성 (새로운 이벤트 생성)\n" +
             "  " + fix + "이벤삭제 (기존 이벤트를 삭제)\n" +
             "  " + fix + "이벤켜기 (이벤트를 실행한다.)\n" +
             "  " + fix + "이벤끄기 (이벤트를 종료한다.)\n" +
             "  " + fix + "이벤설명 (이벤트의 설명을 추가한다.)\n" +
             "  " + fix + "이벤아이템 (이벤트의 아이템을 추가한다.)\n" +
             "  " + fix + "이벤몹추가 (이벤트에 적용될 몬스터를 추가한다.)\n" +
             "  " + fix + "이벤몹제거 (이벤트에 적용될 몬스터를 제거한다.)\n"
          );
          return true;
       case fix + "홀덤":
           _replier.reply("[홀덤 메뉴]" +libConst.dummy + "\n" +
                          "   " + fix + "팟참가    (홀덤 게임 대기열에 본인을 추가)\n" +
                          "   " + fix + "팟나가기  (홀덤 나가기 예약)\n" +
                          "   " + fix + "팟시작    (대기열에 있는 인원으로 게임을 시작)\n" +
                          "   " + fix + "팟강퇴    (자신의 턴에 잠수탄 인원을 강퇴함)\n" +
                          "   " + fix + "레이즈    (기본 2배 레이즈로 고정)\n" +
                          "   " + fix + "콜        (앞서 배팅된 코인만큼 코인을 냄)\n" +
                          "   " + fix + "폴드      (코인을 내지 않고 팟을 포기)\n\n" +
                          "[홀덤 족보]\n" +
                          "   1. 로열스트레이트플러쉬\n  L 스트레이트플러쉬인데 숫자가 A,K,♠,♠,10 인 경우\n" +
                          "   2. 스트레이트플러쉬\n  L 스트레이트인 5장이 패턴도 같을 경우\n" +
                          "   3. 포카드\n  L 같은 숫자 4장을 모았을 경우\n" +
                          "   4. 풀하우스\n  L 같은 숫자 3장 + 같은 숫자2장 을 모았을 경우\n" +
                          "   5. 플러쉬\n  L 같은 패턴 5장 모았을 경우\n" +
                          "   6. 스트레이트\n  L 숫자가 순서대로 연결되는 카드 5장을 모았을 경우\n" +
                          "   7. 트리플\n  L 같은 숫자 3장을 모았을 경우\n" +
                          "   8. 투페어\n  L 원페어가 2개 일 경우\n" +
                          "   9. 원페어\n  L 같은 숫자 2장을 모았을 경우\n"
                          );
           return false;
        case fix + "이동":
           _replier.reply("사용법 : " + fix + "이동 [이동 가능한 지역] or [이동 가능한 인덱스]");
           return true;
        case fix + "사냥":
           _replier.reply("사용법 : " + fix + "사냥 [사냥할 횟수]");
           return true;
        case fix + "보스소환":
           _replier.reply("사용법 : " + fix + "보스소환 [사냥할 횟수]");
           return true;
        case fix + "구매":
           _replier.reply("사용법 : " + fix + "구매 [갯수] [아이템명]");
           return true;
        case fix + "판매":
           _replier.reply("사용법 : " + fix + "판매 [갯수] [아이템명]");
           return true;
        case fix + "감정":
           _replier.reply("사용법 : " + fix + "감정 [갯수] [아이템명]");
           return true;
        case fix + "영입":
           _replier.reply("사용법 : " + fix + "영입 [용병이름]");
           return true;
        case fix + "이적":
           _replier.reply("사용법 : " + fix + "이적 [용병 인덱스]");
           return true;
        case fix + "전직":
           _replier.reply("사용법 : " + fix + "전직 [용병 인덱스] [진급명]");
           return true;
        case fix + "장착":
           _replier.reply("사용법 : " + fix + "장착 [아이템명]");
           return true;
        case fix + "탈착":
           _replier.reply("사용법 : " + fix + "탈착 [아이템명]");
           return true;
        case fix + "재료":
           _replier.reply("사용법 : " + fix + "재료 [아이템명]");
           return true;
        case fix + "제조":
           _replier.reply("사용법 : " + fix + "제조 [갯수] [아이템명]");
           return true;
        case fix + "제작":
           _replier.reply("사용법 : " + fix + "제작 [갯수] [아이템명]");
           return true;
        case fix + "합성":
           _replier.reply("사용법 : " + fix + "합성 [갯수] [아이템명]");
           return true;
        case fix + "축복":
           _replier.reply("사용법 : " + fix + "축복 [축복명]");
           return true;
        case fix + "도감":
           _replier.reply("사용법 : " + fix + "도감 [검색명]");
           return true;
        case fix + "리스트":
           _replier.reply("사용법 : " + fix + "리스트 [카테고리]\n\n" +
                        "[카테고리]\n" +
                        "  - 장비템\n" +
                        "  - 잡템\n" +
                        "  - 기능성템\n" +
                        "  - 종족\n" +
                        "  - 몬스터\n" +
                        "  - 용병\n" +
                        "  - 스킬\n" +
                        "  - 특성\n" +
                        "  - 상태이상\n" +
                        "  - 나라\n" +
                        "  - 마을\n" +
                        "  - 필드\n" + 
                        "  - 던전\n" +
                        "  - 소환스킬\n" +
                        "  - 소환수\n" +
                        "  - CC\n" +
                        "  - 클랜버프\n" +
                        "  - 대출\n" +
                        "  - 예금\n" +
                        "  - 주식\n");
           return true;
        case fix + "대화":
           _replier.reply("사용법 : " + fix + "대화 [NPC명]");
           return true;
        case fix + "룰렛":
           _replier.reply(
              "[룰렛 하기]\n\n" +
              "  - (흑/적, 상/중/하, 1~9) 배팅이 가능합니다.\n" +
              "  - (배팅 배율) : 흑/적 -> 2배, 상/중/하 -> 3배, 1~9 -> 9배\n" +
              "  - (명령어 사용법) : " + fix + "배팅 [배팅할 금액] [배팅 위치]\n\n" +
              "  - 사용 예 ex1> " + fix + "배팅 1000 흑\n" +
              "  - 사용 예 ex2> " + fix + "배팅 5000 상\n" +
              "  - 사용 예 ex3> " + fix + "배팅 800 6\n\n" +
              " >> 예1은 1000 룬을 흑에 배팅한다는 의미입니다.\n" +
              " >> 예2는 5000 룬을 7~9에 배팅한다는 의미입니다.\n" +
              " >> 예3은 800 룬을 6에 배팅한다는 의미입니다.\n\n" +
              "[2개 조건으로 배팅가능]\n\n" +
              "  - 흑/적 조건과 다른 조건을 조합해서 배팅 가능합니다.\n" +
              "  - 배율은 두조건의 배율을 곱한 값입니다.\n" +
              "  - 사용 예 ex4> " + fix + "배팅 2000 적7\n" +
              "  - 사용 예 ex5> " + fix + "배팅 3000 적하\n" +
              " >> 예4는 2000 룬을 적색 7에 배팅한다는 의미입니다. 배율은 2 x 9 = 18배\n" +
              " >> 예5는 3000 룬을 흑색 1~3에 배팅한다는 의미입니다. 배율은 2 x 3 = 6배\n"
           );
           return true;
        case fix + "제물기부":
           _replier.reply("사용법 : " + fix + "제물기부 [룬액수]");
           return true;
        case fix + "사용":
           _replier.reply("사용법 : " + fix + "사용 [아이템명]");
           return true;
        case fix + "마석흡수":
            if(libConst.RuneConsume) {
                _replier.reply("사용법 : " + fix + "마석흡수 [스텟이름]\n\n" +
                     "[스텟명]\n" +
                     "   - 힘\n" +
                     "   - 체질\n" +
                     "   - 민첩\n" +
                     "   - 재주\n" +
                     "   - 지능\n" +
                     "   - 운\n\n" +
                     "ex> " + fix + "마석흡수 힘 or " + fix + "마석흡수 재주"
                );
            }
           return true;
        case fix + "연성":
           _replier.reply("사용법 : " + fix + "연성 [연성 횟수]");
           return true;
        case fix + "쿠폰연성":
           _replier.reply("사용법 : " + fix + "쿠폰연성 [연성 횟수]");
           return true;
        case fix + "클랜창설":
           _replier.reply("사용법 : " + fix + "클랜창설 [클랜명]");
           return true;
        case fix + "창단원요청":
           _replier.reply("사용법 : " + fix + "창단원요청 [유저명]");
           return true;
        case fix + "수락":
           _replier.reply("사용법 : " + fix + "수락 [클랜명]");
           return true;
        case fix + "거절":
           _replier.reply("사용법 : " + fix + "거절 [클랜명]");
           return true;
        case fix + "룬기부":
           _replier.reply("사용법 : " + fix + "룬기부 [룬액수]");
           return true;
        case fix + "클랜신청":
           _replier.reply("사용법 : " + fix + "클랜신청 [클랜명]");
           return true;
        case fix + "클랜영입":
           _replier.reply("사용법 : " + fix + "클랜영입 [클랜 신청대기 인원]");
           return true;
        case fix + "클랜추방":
           _replier.reply("사용법 : " + fix + "클랜추방 [클랜원]");
           return true;
        case fix + "진급":
           _replier.reply("사용법 : " + fix + "진급 [클랜원]");
           return true;
        case fix + "강등":
           _replier.reply("사용법 : " + fix + "강등 [클랜원]");
           return true;
        case fix + "스킬설정":
          _replier.reply("[스킬 설정방법]\n공격/마법 스킬은 총 " + libConst.SkillSpace + "개, 힐스킬층 총 " + libConst.HealSkillSpace + "개, 상태이상제거 스킬 1개 설정가능하며 전투시 해당 설정이 발동 됩니다.\n\n" +
                         "사용법 : " + fix + "스킬설정 [슬롯넘버] [스킬명]\n" + 
                         "사용법 : " + fix + "힐스킬설정 [슬롯넘버] [남은HP%] [스킬명]\n" + 
                         "사용법 : " + fix + "큐어스킬설정 [스킬명]\n\n" + 
                         
                         "ex1> " + fix + "스킬설정 2 내려치기\n\n" +
                         "명령어 스킬설정은 스킬은 2번 슬롯에 내려치기를 설정합니다.\n\n" + 
                         "ex> " + fix + "힐스킬설정 3 60 힐\n\n" +
                         "명령어 힐스킬설정 3번 슬롯에 나 또는 아군의 피가 60% 이하가되면 발동하는 힐스킬 설정합니다..\n\n" +
                         "ex> " + fix + "큐어스킬설정 큐어\n\n" +
                         "명령어 큐어스킬설정는 나 또는 아군이 상태이상이 걸려 있다면 스킬을 발동시킵니다.");
          return false;
        case fix + "힐스킬설정":
           _replier.reply("사용법 : " + fix + "힐스킬설정 [슬롯넘버] [남은HP%] [스킬명]");
           return true;
        case fix + "큐어스킬설정":
           _replier.reply("사용법 : " + fix + "큐어스킬설정 [스킬명]");
           return true;
        case fix + "결장설정":
            _replier.reply("[결투장 스킬 설정방법]\n공격/마법 스킬은 총 " + libConst.SkillSpace + "개 세팅이 가능하며, 전투시 해당 설정이 발동 됩니다.\n\n" +
                        "사용법 : " + fix + "결장설정 [슬롯넘버] [스킬명]\n\n" + 
                        "ex1> " + fix + "결장설정 2 내려치기\n\n" +
                        "위 명령어는 스킬은 2번 슬롯에 내려치기를 설정합니다.");
            return false;
        case fix + "hp포션설정":
           _replier.reply("사용법 : " + fix + "hp포션설정 [남은HP%] [아이템명]");
           return true;
        case fix + "mp포션설정":
           _replier.reply("사용법 : " + fix + "mp포션설정 [남은MP%] [아이템명]");
          return true;
        case fix + "sp포션설정":
           _replier.reply("사용법 : " + fix + "sp포션설정 [남은SP%] [아이템명]");
           return true;
        case fix + "ap포션설정":
            _replier.reply("사용법 : " + fix + "ap포션설정 [아이템명]");
            return true;
        case fix + "캠핑장비설정":
           _replier.reply("사용법 : " + fix + "캠핑장비설정 [아이템명]");
           return true;
        case fix + "캠핑음식설정":
           _replier.reply("사용법 : " + fix + "캠핑음식설정 [아이템명]");
           return true;
        case fix + "탐험가영입":
           _replier.reply("명령어 : " + fix + "탐험가영입 [종류], ex> " + fix + "탐험가영입 고급\n\n" +
                          "  - 한번 영입에 드는 룬\n" +
                          "   L 초급 : "+libConst.ExplorerRune1 + " rune, 범위 : C~A등급까지\n" +
                          "   L 중급 : "+libConst.ExplorerRune2 + " rune, 범위 : B~S등급까지\n" +
                          "   L 고급 : "+libConst.ExplorerRune3 + " rune, 범위 : A~SS등급까지\n" +
                          "  - 기존에 탐험가가 있다면 기존 탐험가와 교체 영입됩니다.");
           return true;
        case fix + "물품등록":
          _replier.reply("명령어 : " + fix + "물품등록 [개당 판매금액(룬)] [갯수] [아이템명], ex> " + fix + "물품등록 10000 10 다이아 원석");
          return false;
        case fix + "물품거래":
          _replier.reply("명령어 : " + fix + "물품거래 [갯수] [아이템명], ex> " + fix + "물품거래 10 다이아 원석");
          return false;
        case fix + "일반강화":
          _replier.reply("명령어 : " + fix + "일반강화 [아이템명(+강화레벨)]");
          return true;
        case fix + "안전강화":
          _replier.reply("명령어 : " + fix + "안전강화 [아이템명(+강화레벨)]");
          return true;
        case fix + "안전강화":
           _replier.reply("명령어 : " + fix + "안전강화 [아이템명(+강화레벨)]");
           return true;
        case fix + "대출하기":
            _replier.reply("대출 명령어 : " + fix + "대출 [금액] [대출명]\n\n ex> " + fix + "대출 1000000 시즈대출\n\n 위 명령어는 시즈대출로 1000000 룬을 대출하겠다는 소리입니다.");
            return false;
        case fix + "예금하기":
            _replier.reply("예금 명령어 : " + fix + "예금 [금액] [예금명]\n\n ex> " + fix + "예금 1000000 미리네예금\n\n 위 명령어는 미리네예금으로 1000000 룬을 저금하겠다는 소리입니다.");
            return false;
        case fix + "구매하기":
            _replier.reply("구매 명령어 : " + fix + "구매 [갯수] [아이템명]\n\n ex> " + fix + "구매 5 소형 HP포션\n\n 위 명령어는 소형 HP포션을 5개 구매한다는 의미 입니다.");
            return false;
        case fix + "교환하기":
            _replier.reply("교환 명령어 : " + fix + "교환 [갯수] [아이템명]\n\n ex> " + fix + "교환 5 소형 HP포션\n\n 위 명령어는 소형 HP포션을 5개 교환한다는 의미 입니다.");
            return false;
        case fix + "판매하기":
            _replier.reply("판매 명령어 : " + fix + "판매 [갯수] [아이템명]\n\n ex> " + fix + "판매 5 소형 HP포션\n\n 위 명령어는 소형 HP포션을 5개 판매한다는 의미 입니다.");
            return false;
        case fix + "감정하기":
            _replier.reply("감정 명령어 : " + fix + "감정 [갯수] [아이템명]\n\n ex> " + fix + "감정 5 포이즌 페이퍼\n\n 위 명령어는 포이즌 페이퍼를 5개 감정한다는 의미 입니다.");
            return false;
        case fix + "스킬배우기":
            _replier.reply("스킬배우기 명령어 : " + fix + "배우기 [스킬명]\n\n ex> " + fix + "배우기 더블 어택\n\n 위 명령어는 더블 어택을 배우는 명령어 입니다.");
            return false;
        case fix + "소환배우기":
            _replier.reply("소환배우기 명령어 : " + fix + "배우기 [스킬명]\n\n ex> " + fix + "배우기 임프 소환\n\n 위 명령어는 임프 소환을 배우는 명령어 입니다.");
            return false;
        case fix + "제조하기":
            _replier.reply("제조 명령어 : " + fix + "제조 [갯수] [아이템명]\n\n ex> " + fix + "제조 2 슬라임 에테르\n\n 위 명령어는 슬라임 에테르을 2개 만든다는 의미 입니다.\n\n" +
                           "재료 보기 : " + fix + "재료 [아이템명]\n\n ex> " + fix + "재료 슬라임 에테르\n\n 위 명령어는 슬라임 에테르를 만드는 재료를 확인합니다.");
            return false;
        case fix + "장비제작":
            _replier.reply("제작 명령어 : " + fix + "제작 [아이템명]\n\n ex> " + fix + "제작 슬레임 이어링\nex2> " + fix + "고급제작 라이탄의 궁극의 반지\n\n 첫번째 예제는 일반제작으로 슬레임 이어링을 만들고, 두번쨰 예제는 고급제작으로 라이탄의 궁국의 반지를 만든다는 의미 입니다.\n\n" +
                           "재료 보기 : " + fix + "재료 [아이템명]\n\n ex> " + fix + "재료 슬레임 이어링\n\n 위 명령어는 슬라임 이어링을 만드는 재료를 확인합니다.");
            return false;
        case fix + "강화하기":
            _replier.reply("[강화하기 가이드]\n\n" +
                       "1. 강화의 종류 : 일반강화, 안전강화\n" +
                       "2. 일반강화 설명 : 일정 금액과 일정 재료를 사용하여 확률에 따라 강화를 시도한다. 실패 가능성이 있으며, 실패시 확률적으로 강화 단계가 하락합니다.\n" +
                       "2-1. 일반강화 명령어 : " + fix + "일반강화 [아이템명(+강화레벨)]\n\n ex> " + fix + "일반강화 로브 or " + fix + "일반강화 로브+2\n\n 위 명령어는 로브를 강화한다는 의미입니다.\n" +
                       "3. 안전강화 설명 : 일반강화보다 더 많은 재화를 사용하여 (상당히 높은 확률/100% 확률)로 강화를 시도합니다.\n" +
                       "3-1. 안전강화 명령어 : " + fix + "안전강화 [아이템명(+강화레벨)]\n\n ex> " + fix + "안전강화 로브 or " + fix + "안전강화 로브+2\n\n 위 명령어는 로브를 강화한다는 의미입니다.\n");
            return false;
        case fix + "장비분해":
            _replier.reply("장비분해 명령어 : " + fix + "분해 [아이템명]\n\n ex> " + fix + "분해 슬레임 이어링+2\n\n 위 명령어는 슬레임 이어링+2를 분해한다는 의미 입니다.\n\n");
            return false;
        case fix + "분해":
            _replier.reply("명령어 : " + fix + "분해 [갯수] [아이템명(+강화레벨)]");
            return true;
        case fix + "교감하기":
            _replier.reply("명령어 : " + fix + "교감하기 [" + libConst.Pet_Name + "이름]");
            return true;
        case fix + "선물":
            _replier.reply("명령어 : " + fix + "선물 [아이템명]");
            return true;
        case fix + "맡기기":
            _replier.reply("명령어 : " + fix + "맡기기 [all 또는 아이템명 또는 카테고리] or " + fix + "맡기기 [갯수] [아이템명]");
            return true;
        case fix + "꺼내기":
            _replier.reply("명령어 : " + fix + "꺼내기 [all 또는 아이템명 또는 카테고리] or " + fix + "꺼내기 [갯수] [아이템명]");
            return true;
        case fix + "단축키설정":
            _replier.reply("명령어 : " + fix + "단축키설정 [1~9키 중 하나] [1개 명령어]");
            return true;
        case fix + "단축키삭제":
            _replier.reply("명령어 : " + fix + "단축키삭제 [1~9키 중 하나]");
            return true;
        case fix + "용병출전":
            _replier.reply("명령어 : " + fix + "용병출전 [용병 인덱스]");
            return true;
        case fix + "용병휴식":
            _replier.reply("명령어 : " + fix + "용병휴식 [용병 인덱스]");
            return true;
        case fix + "환전하기":
            _replier.reply("환율 : " + libConst.Gamble_ExchangeRate + "rune >> 1coin\n\n명령어 : " + fix + "환전하기 [코인 갯수]");
            return true;
        case fix + "건축":
            _replier.reply("명령어 : " + fix + "건축 [도시명]");
            return true;
        case fix + "창고넣기":
            _replier.reply("명령어 : " + fix + "창고넣기 [all 또는 아이템명] or " + fix + "창고넣기 [갯수] [아이템명]");
            return true;
        case fix + "창고꺼내기":
            _replier.reply("명령어 : " + fix + "창고꺼내기 [all 또는 아이템명] or " + fix + "창고꺼내기 [갯수] [아이템명]");
            return true;
        case fix + "이전":
            _replier.reply("명령어 : " + fix + "이전 [도시명]");
            return true;
        case fix + "배치":
            _replier.reply("명령어 : " + fix + "배치 [가구명]");
            return true;
        case fix + "수거":
            _replier.reply("명령어 : " + fix + "수거 [가구명]");
            return true;
        case fix + "의뢰수주":
            _replier.reply("명령어 : " + fix + "의뢰수주 [의뢰 인덱스]");
            return true;
        case fix + "코인교환":
            _replier.reply("명령어 : " + fix + "코인교환 [갯수] [아이템명]");
            return false;
        case fix + "소환사등록":
            _replier.reply("명령어 : " + fix + "소환사등록 [타입]\n\n(선택 가능한 타입)\n" +
                           " L 원소계통\n" +
                           " L 자연계통\n" +
                           " L 신성계통\n" +
                           " L 혼돈계통\n");
            return true;
        case fix + "계통변경":
            _replier.reply("명령어 : " + fix + "계통변경 [타입]\n\n(주의 요망)계통 변경시 지금까지 습득했던 소환 스킬이 모두 삭제 됩니다.\n\n(선택 가능한 타입)\n" +
                           " L 원소계통\n" +
                           " L 자연계통\n" +
                           " L 신성계통\n" +
                           " L 혼돈계통\n");
            return true;
        case fix + "자동채굴":
            _replier.reply("명령어 : " + fix + "자동채굴 [템 갯수] [아이템명]");
            return true;
        case fix + "자동채광":
            _replier.reply("명령어 : " + fix + "자동채광 [템 갯수] [아이템명]");
            return true;
        case fix + "자동채집":
            _replier.reply("명령어 : " + fix + "자동채집 [템 갯수] [아이템명]");
            return true;
        case fix + "자동벌목":
            _replier.reply("명령어 : " + fix + "자동벌목 [템 갯수] [아이템명]");
            return true;
    }
    return false;
}

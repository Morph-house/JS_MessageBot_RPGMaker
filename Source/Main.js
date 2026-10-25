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
const helper = Bridge.getScopeOf("Helper.js"); // 도움말 객체
const libObject = Bridge.getScopeOf("Object.js"); // object 객체
const libCommon = Bridge.getScopeOf("Common.js"); // 일반 function Lib

var login_Manager = Bridge.getScopeOf("LoginManager.js").LoginManager(); // 로그인 담당 객체
var event_Manager = Bridge.getScopeOf("GameManager.js").event_manager; // 이벤트 담당 객체
var homework_Manager = Bridge.getScopeOf("ETCManager.js").HomeworkManager(); // 숙제 퀘스트 객체
var charactor_Manager = Bridge.getScopeOf("CharactorManager.js").CharactorManager(event_Manager, homework_Manager); // 캐릭터 담당 객체
var relation_Manager = Bridge.getScopeOf("RelationManager.js").RelationManager(); // 친구추가 및 삭제 담당 객체
var clan_Manager = Bridge.getScopeOf("ClanManager.js").ClanManager(charactor_Manager, homework_Manager); // 클랜 담당 객체
var post_Manager = Bridge.getScopeOf("GameManager.js").post_manager; // 우편 담당 객체
var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체
var exchange_Manager = Bridge.getScopeOf("ExchangeManager.js").ExchangeManager(charactor_Manager); // 거래소 담당 객체
var gamble_Manager = Bridge.getScopeOf("GambleManager.js").GambleManager(charactor_Manager);
var cardbattle_Manager = Bridge.getScopeOf("CardBattleManager.js").CardBattleManager();
var fishing_Manager = Bridge.getScopeOf("FishingManager.js").FishingManager(charactor_Manager);
var party_Manager = Bridge.getScopeOf("PartyManager.js").PartyManager(charactor_Manager);
var appoint_Manager = Bridge.getScopeOf("GameManager.js").appoint_manager; // 임명 담당 객체
var stock_Manager = Bridge.getScopeOf("StockManager.js").StockManager(charactor_Manager); // 주식 담당 객체
var library = Bridge.getScopeOf("ETCManager.js").Library(charactor_Manager, appoint_Manager); // 도서관 객체

var Master = Bridge.getScopeOf("GameManager.js").Master;

var PlayingList = []; // 도배 방지 {room, flag:(Y or N)}
var CharList = ["1","2","3","4","5","6","7","8","9","0"];

var fix = libConst.CommandPrefix;

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    // 카카오톡 알림 구조는 Wisp 가 읽어 response() 로 넘겨준다. 여기서는 메시지만 처리한다
    onMessage(room, msg, sender, isGroupChat, replier, imageDB, packageName);
}

function onMessage(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    libCommon.saveSession(room, replier);
    
    if(msg.indexOf(fix + "eval") === 0) {
        if(libConst.EvalFlag)
            replier.reply(eval(msg.substring(6, msg.length)));
    }
    else if(msg === fix + "약관") {
        replier.reply("[이용 약관]\n\n" + libConst.TermsofService);
    }
    else if(msg === fix + "방정보") {
        replier.reply("방이름 : " + room + "\n" +
                       "메시지 보낸사람 : " + sender + "\n" +
                       "앱 패키지명 : " + packageName + "\n" +
                       "그룹 채팅 여부 : " + isGroupChat + "\n" +
                       "방 분류 : " + (libConst.MainRoomName.indexOf(room) !== -1?(libConst.MainRoomName.indexOf(room) === 0?"메인방":"서브 메인방"):(isGroupChat?"사용이 불가능한 방":"게임 플레이 방")) + "\n" +
                       "RPG 게임 버전 : " + libConst.Version + "\n" +
                       "게임 플레이 방 이동 URL : " + libConst.GameRoomURL
                     );
        return;
    }
    else {
        if (helper.Directions(room, msg, replier, isGroupChat)) {
            CheckQuest(room, sender, msg, java.lang.String(imageDB.getProfileImage()).hashCode(), replier);
            return;
        }
        if (libConst.MainRoomName.indexOf(room) !== -1)
           MainCmd(room, msg, sender, replier, java.lang.String(imageDB.getProfileImage()).hashCode());
        else {
            if(isGroupChat) return;
            if(msg.indexOf(fix) === 0) {
                var code = libConst.ProtectMacro?checkMacro(room, msg):"";
                if(code !== "") {
                    replier.reply("매크로 방지 중입니다. 매크로 방지 언어를 입력하시기 바랍니다.\n\n  - 매크로 코드 : \n\n" + mkDigital(code) + libConst.dummy);
                    return;
                }
                else if(code === "complate") {
                    replier.reply("매크로 방지가 해제되었습니다.");
                    return;
                }
                else if(checkDuplication(room)) {
                    replier.reply("현재 명령어를 실행중입니다. 다음에 다시 시도해 주시기 바랍니다." );
                    return;
                }
                setDuplication(room, replier, "Y");
                java.lang.Thread.sleep(libConst.CommandDelay);
            }
            try {
                UserCmd(room, msg, sender, replier, java.lang.String(imageDB.getProfileImage()).hashCode());
            }
            catch(e) {
                var error = "ID : " + room + "\nmsg : " + msg + "\nerrorTitle : " + e.name + "\nerrorMsg : " + e.message + "\nerrorStack : " + e.stack;
                replier.reply("[명령어 에러]\n\n" + error + "\n\n해당 에러메시지를 운영자에게 전달 바랍니다.");
                if(libConst.SendErrorMsg)
                    libCommon.replyID(libConst.MainRoomName[0], error);
            }
            finally {
                if(msg.indexOf(fix) === 0) {
                    java.lang.Thread.sleep(200);
                    setDuplication(room, replier, "N");
                }
            }
        }
    }
}
function MainCmd(_room, _msg, _sender, _replier, _image) {
    var rplyStr = "", i, splitMsg, name, itemName, obj, menufacture, meter, array, charlist, temp, flag, code, id;
    if (_msg.indexOf(fix + "ID확인") === 0) {
        if (login_Manager.contain(_msg.split(" ")[1]) !== -1)
            _replier.reply("이미 등록된 ID입니다.");
        else {
            _replier.reply("사용가능한 ID입니다.\n해당 아이디로 1:1채팅방을 열어주시기 바랍니다.\n\n실수로 다른 ID로 등록시 삭제 요청은 운영자에게 메시지 부탁드립니다.");
        }
    }
    else if (_msg.indexOf(fix + "도감") === 0) {
        splitMsg = _msg.split(" ");
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(db_Manager.Dictionary(name));
    }
    else if (_msg.indexOf(fix + "리스트") === 0) {
        splitMsg = _msg.split(" ");
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(db_Manager.DictionaryList(name));
    }
    else if (_msg.indexOf(fix + "재료") === 0) {
        splitMsg = _msg.split(" ");
        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        rplyStr += "["+ itemName + " 의 재료 검색]\n\n";
        obj = db_Manager.getItemByName(itemName);
        menufacture = db_Manager.getMenufacture(obj.obj.index, obj.kind);
        for(i = 0; i < menufacture.material.length; ++i) {
            meter = menufacture.material[i];
            rplyStr += "   L " + db_Manager.getItem(meter.itemkind, meter.itemIdx).name + " x " + meter.count + "\n";
        }
        rplyStr += "   L " + menufacture.needrune + " (rune)";
        _replier.reply(rplyStr);
    }
    else if (_msg === fix + "결장랭킹") {
        _replier.reply(charactor_Manager.RankingInfoforMainRoom());
    }
    else if (_msg === fix + "유저리스트") {
        charlist = charactor_Manager.getCharactorList("user");
        charlist.sort(function(a,b) {
            return a.species > b.species ? -1 : (a.species < b.species ? 1 : 0);
        });
        temp = "";
        rplyStr += "[유저 현황] 총원 : " + charlist.length + "명" + libConst.dummy + "\n\n";
        for(i = 0; i < charlist.length; ++i) {
            obj = charlist[i];
            if(temp !== obj.species) {
                rplyStr += "\n[" + obj.species +"]\n";
                temp = obj.species;
            }
            name = clan_Manager.getMyClanName(obj.name);
            rplyStr += "  - " + (name === ""?"":"[" + name + "] ") + obj.name + "(" + login_Manager.getLoginTime(obj.name) + ")\n";
        }
        _replier.reply(rplyStr);
    }
    else if (_msg.indexOf(fix + "랭킹") === 0) {
        splitMsg = _msg.split(" ");
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        temp = "";
        switch(name){
            case "공격력":
                temp = "attack";
                break;
            case "마법력":
                temp = "magic";
                break;
            case "방어력":
                temp = "defense";
                break;
            case "공격속도":
                temp = "atkspeed";
                break;
            case "정확도":
                temp = "accuracy";
                break;
            case "회피력":
                temp = "avoid";
                break;
            case "치명률":
                temp = "critical";
                break;
            case "친화력":
                temp = "friendly";
                break;
            case "신마력":
                temp = "godevil";
                break;
            case "체력":
                temp = "hp";
                break;
            case "마력":
                temp = "mp";
                break;
            case "기력":
                temp = "sp";
                break;
            case "정신력":
                temp = "dp";
                break;
            case "행동력":
                temp = "ap";
                break;
            case "기술력":
                temp = "technic";
                break;
            case "지혜":
                temp = "wisdom";
                break;
            case "통찰력":
                temp = "insight";
                break;
            case "룬":
                temp = "rune";
                break;
        }
        if(temp === "") {
            _replier.reply("능력치명을 정확히 입력해주시기 바랍니다.");
            return;
        }

        if(temp === "technic" || temp === "wisdom" || temp === "insight") {
            flag = "vitality";
        }
        else {
            flag = "ability";
        }
        charlist = charactor_Manager.getCharactorList(temp);
        charlist.sort(function(a,b) {
            if(temp === "hp" || temp === "mp" || temp === "sp" || temp === "dp" || temp === "ap" || temp === "rune") {
                return a[temp] > b[temp] ? -1 : (a[temp] < b[temp] ? 1 : 0);
            }
            else {
                return a[flag][temp] > b[flag][temp] ? -1 : (a[flag][temp] < b[flag][temp] ? 1 : 0);
            }
        });

        rplyStr += "[" + name + " 랭킹]" + libConst.dummy + "\n\n";
        for(i = 0; i < charlist.length; ++i) {
            obj = charlist[i];
            if(temp === "hp" || temp === "mp" || temp === "sp" || temp === "dp" || temp === "ap" || temp === "rune") {
                rplyStr += (i+1) + "위. " + obj.name + " >>> " + (obj.private==="N"?obj[temp]:"차단됨") + "\n";
            }
            else {
                rplyStr += (i+1) + "위. " + obj.name + " >>> " + (obj.private==="N"?obj[flag][temp]:"차단됨") + "\n";
            }

        }
        _replier.reply(rplyStr);
    }
    else if (_msg.indexOf(fix + "낚시랭킹") === 0) {
        splitMsg = _msg.split(" ");
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(name === "all") {
            _replier.reply(fishing_Manager.AllRanking());
        }
        else {
            _replier.reply(fishing_Manager.Ranking(name));
        }
    }
    else if (_msg.indexOf(fix + "중계시작") === 0) {
        splitMsg = _msg.split(" ");
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(name === "홀덤") {
            gamble_Manager.StartBroadCast(gamble_Manager.getGame.HOLDEM);
            _replier.reply("홀덤 경기를 중계 합니다.");
        }

    }
    else if (_msg.indexOf(fix + "중계종료") === 0) {
        splitMsg = _msg.split(" ");
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(name === "홀덤") {
            gamble_Manager.EndBroadCase(gamble_Manager.getGame.HOLDEM);
            _replier.reply("홀덤 경기 중계를 종료합니다.");
        }
    }
    else if (_msg === fix + "이벤트") {

        rplyStr += "[일반 이벤트 정보]\n";
        obj = event_Manager.getEvent(event_Manager.DROPRUNE);
        if(obj.onoff) {
            rplyStr += " - (진행중) 룬 드랍 이벤트 : 몬스터 처치시 " + obj.rate + "배 룬을 획득합니다.\n\n";
        }
        rplyStr += "\n";
        obj = event_Manager.getEvent(event_Manager.DROPITEMRATE);
        if(obj.onoff) {
            rplyStr += " - (진행중) 아이템 드랍 확률업 : 몬스터 처치시 아이템 획득 확률을 " + obj.rate + "배 증가합니다.\n\n";
        }
        rplyStr += "\n\n";
        rplyStr += "[특정 이벤트 정보]\n";
        array = event_Manager.getEvent(event_Manager.TARGETEVENT);
        for (i = 0; i < array.length; i++) {
            obj = array[i];

            if(obj.onoff) {
                if(obj.item.index === undefined || obj.item.index === null) {
                    item = null;
                }
                else {
                    item = event_Manager.findItem(obj.item.index, obj.item.kind);
                }

                rplyStr += (i+1) + ". " + obj.name + " " + (obj.onoff?"(진행중)":"(종료됨)") + "\n";
                if(obj.description !== "") {
                    rplyStr += "  - 설명 : " + obj.description + "\n";
                }
                if(item !== null)
                    rplyStr +="   - 아이템 : " + item.name + (obj.item.strength === "0"?"":("+"+obj.item.strength)) + " x" + obj.item.count + "\n";

                rplyStr +="   - 적용몹\n";
                flag = false;
                for(j = 0; j < obj.moblist.length; ++j) {
                    mob = obj.moblist[j];
                    db = event_Manager.findMob(mob.index);
                    if(mob.index === "all") {
                        flag = true;
                        continue;
                    }

                    rplyStr +="      L " + db.name + " (드랍률 : " + mob.rate + "%)\n";
                }

                if(flag) {
                    rplyStr +="      L 나머지 몹 (드랍률 : " + mob.rate + "%)\n";
                }
                rplyStr +="\n";
            }
        }

        _replier.reply(rplyStr);
    }
    else if(_msg === fix + "백업") {
        var day = new Date();
        var paths, tmpFile, fileList, tmpname;
        var mkTwoNumber = function(_num) {
            return (_num >= 10 ? _num : "0" + _num);
        };
        var backFolder = libConst.backupPath;
        var currFolder = libConst.rootPath;
        var backupfolder = backFolder + "BackUp/" +
                           mkTwoNumber(day.getYear()+1900) + mkTwoNumber(day.getMonth() + 1) + mkTwoNumber(day.getDate()) + "_" +
                           mkTwoNumber(day.getHours()) + mkTwoNumber(day.getMinutes()) + mkTwoNumber(day.getSeconds()) + "/";



        for(paths in libConst.fileNameList) {
            FileStream.write(backupfolder + libConst.fileNameList[paths] , FileStream.read(currFolder + libConst.fileNameList[paths]));
        }
        for(paths in libConst.DBNameList) {
            FileStream.write(backupfolder + libConst.DBNameList[paths] , FileStream.read(currFolder + libConst.DBNameList[paths]));
        }
        tmpFile = new java.io.File(currFolder + libConst.LibraryPath);
        fileList = tmpFile.list();
        for(paths in fileList) {
            FileStream.write(backupfolder + libConst.LibraryPath + fileList[paths], FileStream.read(currFolder + libConst.LibraryPath+fileList[paths]));
        }

        tmpFile = new java.io.File(currFolder + libConst.SleepFolder);
        fileList = tmpFile.list();
        for(paths in fileList) {
            FileStream.write(backupfolder + libConst.SleepFolder + fileList[paths], FileStream.read(currFolder + libConst.SleepFolder+fileList[paths]));
        }
        _replier.reply("[백업 완료]\n\n위치 : " + backupfolder);
    }
    else if(_msg.indexOf(fix + "코드입력") === 0) {
        splitMsg = _msg.split(" ");
        code = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(login_Manager.ConfirmAutoCode(code, _sender, _room, _image));
    }
    else if(login_Manager.checkSubRoom(_sender, _room, _image)){
        id = login_Manager.getMyIDBySubRoom(_sender, _room, _image);
        if(id !== null) {
            PlayCmd(id, _msg, _sender, _replier, _image);
        }
    }
}
function UserCmd(_room, _msg, _sender, _replier, _image) {
    var result, obj, array, rtnStr, splitMsg, splitMsg2, friend, i, count, command, rune, item, file, matchingTable, matchingData;
    if (_msg.indexOf(fix + "등록") === 0) {
        splitMsg = _msg.split(" ");
        if(splitMsg.length > 2) {
            _replier.reply("패스워드에 빈칸을 입력할 수 없습니다.");
            return;
        }
        if(splitMsg[1] === undefined || splitMsg[1] === null || splitMsg[1] === "") {
            _replier.reply("패스워드 값이 없습니다.");
            return;
        }
        if (login_Manager.insert(_room, splitMsg[1], _sender, _image)) {
            _replier.reply("[이용 약관]\n\n" + libConst.TermsofService);
            _replier.reply("등록이 완료되었습니다.\n\n -> 로그인하기 : " + fix + "로그인 [비밀번호]");
            libCommon.AlarmMainRoom("[" + _room + "] 님이 회원 가입을 완료 하였습니다.");
        } else {
            _replier.reply("이미 등록이된 ID입니다.");
        }
    }
    else if(_msg.indexOf(fix + "키등록") === 0) {
        splitMsg = _msg.split(" ");
        if(splitMsg[1] === undefined || splitMsg[1] === null || splitMsg[1] === "") {
            _replier.reply("패스워드 값이 없습니다. 사용법 : " + fix + "키등록 [본인비밀번호]");
            return;
        }

        _replier.reply(login_Manager.setKey(_room, splitMsg[1], _sender, _image));
    }
    else if (_msg.indexOf(fix + "PW변경") === 0) {

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 3){
            _replier.reply("데이터 값설정이 상이합니다. 사용법 : " + fix + "PW변경 [기존PW] [새로운PW]");
            return;
        }

        result = login_Manager.changepw(_room, splitMsg[1], splitMsg[2], _sender, _image);
        if (result === 0) {
            _replier.reply("변경이 완료되었습니다.");
        } else if (result === 1) {
            _replier.reply("미등록 ID입니다.");
        } else if (result === 2) {
            _replier.reply("기존 PW가 동일하지 않습니다.");
        } else if (result === 3) {
            _replier.reply("초기 등록된 보안 key값이 다릅니다. 최초 등록된 카톡명과 이미지로 변경하시기 바랍니다.");
        }
    }
    else if(_msg.indexOf(fix + "활성화") === 0) {
        if(login_Manager.getSleepAccount(_room) === "N"){
            _replier.reply("이미 활성화된 계정입니다.");
            return;
        }
        else {
            splitMsg = _msg.split(" ");
            if(splitMsg.length !== 2){
                _replier.reply("데이터 값설정이 상이합니다. 사용법 : " + fix + "활성화 [비밀번호]");
                return;
            }
            if(login_Manager.ispassword(_room, splitMsg[1])) {
                matchingTable = libCommon.read(libConst.fileNameList.SleepMatchingTable);
                for(i = 0; i < matchingTable.length; ++i) {
                    if(matchingTable[i].id === _room) {
                        matchingData = matchingTable[i];
                        matchingTable.splice(i,1);
                        libCommon.write(libConst.fileNameList.SleepMatchingTable, matchingTable);
                        break;
                    }
                }
                
                file = libCommon.read(libConst.SleepFolder + matchingData.filename + ".txt");
                if(file === undefined || file === null) {
                    _replier.reply("저장된 데이터가 존재하지 않습니다.");
                    return;
                }
                else {
                    charactor_Manager.activeAccount(file);
                    login_Manager.setSleepAccount(_room, "N");
                    libCommon.remove(libConst.SleepFolder + matchingData.filename + ".txt");
                    _replier.reply("활성화를 완료하였습니다.\n\n" + fix + "로그인 으로 로그인 하시기 바랍니다.");
                }
            }
            else {
                _replier.reply("비밀번호가 틀렸습니다.");
            }
        }
    }
    else if(_msg.indexOf(fix + "로그인") === 0) {
        if(login_Manager.getSleepAccount(_room) === "Y"){
            _replier.reply("현재 당신의 계정은 휴면계정입니다.\n\n휴면계정 활성화 방법 : " + fix + "활성화 [본인PW]");
            return;
        }
        else if(login_Manager.login(_room, _msg.split(" ")[1], _sender, _image)) {
            if(charactor_Manager.findUser(_room) !== null)
                _replier.reply("로그인이 완료 되었습니다.");

            else
                _replier.reply("로그인이 완료 되었습니다.\n\n 캐릭터를 생성하기시 바랍니다. >> " + fix + "캐릭생성");
        } else {
            _replier.reply("로그인에 실패하였습니다. \n패스워드가 맞다면 " + fix + "키등록을 진행해보시기 바랍니다.\n 키란 : 자신의 계정에 보안을 위한 키(key)");
        }
    }
    else if(_msg === fix + "로그아웃") {
        if(login_Manager.logout(_room, _sender, _image)) {
            _replier.reply("로그아웃이 완료 되었습니다.");
        } else {
            _replier.reply("로그아웃에 실패하였습니다.");
        }
    }
    else if(_msg === fix + "연동코드") {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        rtnStr = "연동 코드 : " + login_Manager.makeAuthCode(_room, _image) + "\n\n";
        rtnStr += "연동코드를 게임 메인방에 입력하면 메인방 계정과 연동할 수 있습니다.";
        _replier.reply(rtnStr);
    }
    else if(_msg === fix + "계정정보") {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        _replier.reply(login_Manager.loginfo(_room));
        _replier.reply(charactor_Manager.Charinfo(_room));
    }
    else if(_msg === fix + "캐릭생성"){
        if(!checkLogin(_room, _replier, _sender, _image))return;
        if(!charactor_Manager.makeCharactor(_room))
        {
            _replier.reply("이미 생성된 캐릭터가 존재 합니다.");
            return;
        }
        var specList = db_Manager.getAllSpecies();
        rtnStr = "[종족 종류]\n\n";
        count = 1;
        for(i = 0; i < specList.length; ++i) {
            if(specList[i].isselect === "Y") {
                rtnStr += count + ". " + specList[i].spec_name + "\n";
                count++;
            }
        }
        rtnStr += "\n\n 종족정보 더보기 ex> " + fix + "종족정보 [종족명]";
        _replier.reply(rtnStr);
    }
    else if(_msg.indexOf(fix + "종족정보") === 0){
        if(!checkLogin(_room, _replier, _sender, _image))return;

        obj = db_Manager.getSpecies(_msg.split(" ")[1]);
        if(obj === null) {
            _replier.reply("해당 종족의 데이터는 존재하지 않습니다.");
            return;
        }
        rtnStr = "";

        rtnStr += "[" + obj.spec_name + "의 정보]\n";
        rtnStr += "" + obj.description + "\n\n";
        rtnStr += "스텟 비율 정보\n";
        rtnStr += "힘 : " + Math.floor(Number(obj.inc_stat.str) * 100) + "%\n";
        rtnStr += "체질 : " + Math.floor(Number(obj.inc_stat.con) * 100) + "%\n";
        rtnStr += "민첩 : " + Math.floor(Number(obj.inc_stat.dex) * 100) + "%\n";
        rtnStr += "재주 : " + Math.floor(Number(obj.inc_stat.agi) * 100) + "%\n";
        rtnStr += "지능 : " + Math.floor(Number(obj.inc_stat.int) * 100) + "%\n";
        rtnStr += "운 : " + Math.floor(Number(obj.inc_stat.luk) * 100) + "%\n";
        rtnStr += "효율 : " + Math.floor(Number(obj.inc_stat.ept) * 100) + "%\n";
        rtnStr += "교감 : " + Math.floor(Number(obj.inc_stat.com) * 100) + "%\n";
        rtnStr += "영혼 : " + Math.floor(Number(obj.inc_stat.spr) * 100) + "%\n\n";

        rtnStr += "종족 선택 방법 : " + fix + "종족선택 [종족명]";
        _replier.reply(rtnStr);
    }
    else if(_msg.indexOf(fix + "종족선택") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        var sel_species = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(!db_Manager.isSpecies(sel_species)) {
            _replier.reply("해당 종족은 존재하지 않습니다.");
            return;
        }
        if(db_Manager.getSpecies(sel_species).isselect !== "Y") {
            _replier.reply("해당 종족은 초반에 선택 가능한 종족이 아닙니다.");
            return;
        }
        if(charactor_Manager.selectSpecies(_room, sel_species)) {
          _replier.reply("종족 선택이 완료 되었습니다.");
          _replier.reply("스테이터스 수치는 랜덤으로 설정됩니다. (3~18 사이)\n총 " + libConst.RandStatCount + "번의 변경 기회가 있습니다.\n변경방법 : " + fix + "랜덤스텟");
        }
        else {
            _replier.reply("이미 종족 선택이 완료 되어있는 상태이거나 캐릭 생성 전 입니다.");
        }
    }
    else if(_msg === fix + "랜덤스텟") {
        if(!checkLogin(_room, _replier, _sender, _image))return;

        result = charactor_Manager.RandStat(_room);
        if(result === null)
        {
            _replier.reply("기회를 전부 소진되어 기회가 없습니다.");
            return;
        }
        rtnStr = "";
        rtnStr += "[" + _room + "의 스테이터스 결과]\n\n";
        rtnStr += "힘 : " + result.str + "\n";
        rtnStr += "체질 : " + result.con + "\n";
        rtnStr += "민첩 : " + result.dex + "\n";
        rtnStr += "재주 : " + result.agi + "\n";
        rtnStr += "지능 : " + result.int + "\n";
        rtnStr += "운 : " + result.luk + "\n";
        rtnStr += "효율 : " + result.ept + "\n";
        rtnStr += "교감 : " + result.com + "\n";
        rtnStr += "영혼 : " + result.spr + "\n\n";

        rtnStr += "남은 기회 : " + charactor_Manager.RemainChangeStat(_room) + "\n\n";

        rtnStr += "이 스텟이 마음에 드시면 '" + fix + "스텟확정' 명령어를 입력바랍니다.\n";
        rtnStr += "스텟을 변경하려면 '" + fix + "랜덤스텟' 명령어를 입력바랍니다.\n";

        _replier.reply(rtnStr);

    }
    else if(_msg === fix + "스텟확정") {
        if(!checkLogin(_room, _replier, _sender, _image))return;

        result = charactor_Manager.CompliteCharactor(_room);
        if(!result)
        {
            _replier.reply("스텟 확정에 실패하였습니다.");
            return;
        }

        _replier.reply("스텟 확정에 성공하였습니다.\n\n[알림정보]\n1. 모든 명령어는 " + fix + "명령어 로 확인가능합니다.\n2. " + fix + "가이드 명령어로 현재 위치 및 정보, 행동가능명령을 확인가능합니다.\n3. " + fix + "튜토 명령어로 도움말을 확인할 수 있습니다.");
    }
    else if(_msg === fix + "캐릭삭제") {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        if(!clan_Manager.isMyClan(_room)) {
            charactor_Manager.deleteCharactor(_room);
            relation_Manager.Delete(_room);
            exchange_Manager.Delete(_room);
            fishing_Manager.Delete(_room);
            party_Manager.DeleteUser(_room);
            stock_Manager.Delete(_room);
            gamble_Manager.Delete(_room);
            homework_Manager.Delete(_room);
            cardbattle_Manager.Delete(_room);
            _replier.reply("캐릭터를 삭제하였습니다.");
        }
        else {
            _replier.reply("가입된 클랜이 있습니다. 클랜 먼저 탈퇴 후 캐릭삭제를 하시기 바랍니다.");
        }
    }
    else if(_msg === fix + "튜토") {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.Tutorial(_room, null));
    }
    else if(_msg.indexOf(fix + "튜토") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "튜토 이동");
            return;
        }
        command = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.Tutorial(_room, command));
    }
    else if(_msg === fix + "단축키") {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        array = login_Manager.getShortCutList(_room);
        rtnStr = "[설정된 단축키 모움]\n\n";
        for(var idx in array) {
            rtnStr += fix + idx + " : " + array[idx] + "\n";
        }
        rtnStr += "\n설명 : 명령어를 단축키에 저장하여 사용할 수 있습니다.\n하나의 단축키에 총 " + libConst.ShortCutCount + "개 명령어를 입력 가능합니다.\n";
        rtnStr += "\n사용법 : " + fix + "단축키설정 [1~9키 중 하나] [1개 명령어]";
        rtnStr += "\n사용법 : " + fix + "단축키삭제 [1~9키 중 하나]";
        _replier.reply(rtnStr);
    }
    else if(_msg.indexOf(fix + "단축키설정") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "단축키설정 1 " + fix + "이동 여관");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count) || !(Number(count) > 0  && Number(count) < 10)) {
            _replier.reply("단축키 범위는 1 ~ 9 까지 입니다. ex> " + fix + "단축키설정 [1~9] [명령어]");
            return;
        }
        command = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(login_Manager.addShortCut(_room, ChangeNumber(count), command));
    }
    else if(_msg.indexOf(fix + "단축키삭제") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        count = splitMsg[1];
        if(!checkNumberic(count) || !(Number(count) > 0  && Number(count) < 10)) {
            _replier.reply("단축키 범위는 1 ~ 9 까지 입니다. ex> " + fix + "단축키삭제 [1~9]");
            return;
        }
        _replier.reply(login_Manager.removeShortCut(_room, ChangeNumber(count)));
    }
    else if(_msg.indexOf(fix + "친구추가") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        friend = _msg.substring(splitMsg[0].length + 1, _msg.length);

        if(login_Manager.contain(friend) !== -1){
            relation_Manager.addRelation(_room, friend);
            _replier.reply("[" + friend + "] 친구를 추가하였습니다.");
            libCommon.replyID(friend, "[" + _room + "] 님이 당신을 친구추가 하였습니다.");
        }
        else {
            _replier.reply("[" + friend + "] 유저가 존재 하지 않습니다.");
        }
    }
    else if(_msg.indexOf(fix + "친구삭제") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        friend = _msg.substring(splitMsg[0].length + 1, _msg.length);

        if(relation_Manager.removeRelation(_room, friend)){
            _replier.reply("[" + friend + "] 친구를 삭제하였습니다.");
        }
        else {
            _replier.reply("[" + friend + "] 친구 삭제에 실패하였습니다.");
        }
    }
    else if(_msg === fix + "친구") {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        rtnStr = "[내가 등록한 친구를]\n\n";

        array = relation_Manager.getFollowing(_room);
        for(i = 0; i < array.length; ++i) {
            rtnStr += "  - " + array[i] + "\n";
        }

        rtnStr += "\n[나를 등록한 친구를]\n\n";

        array = relation_Manager.getFollower(_room);
        for(i = 0; i < array.length; ++i) {
            rtnStr += "  - " + array[i] + "\n";
        }
        _replier.reply(rtnStr);

    }
    else if(_msg.indexOf("/") === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2)
            return;

        friend = _msg.substring(1,_msg.indexOf(splitMsg[1]) - 1);
        rtnStr = _msg.substring(_msg.indexOf(splitMsg[1]), _msg.length);

        libCommon.replyID(friend, "[" + _room +" 메시지]\n" + rtnStr);
    }
    else if(_msg.indexOf(libConst.PartyPrefix) === 0) {
        if(!checkLogin(_room, _replier, _sender, _image))return;
        splitMsg = _msg.substring(1, _msg.length);
        party_Manager.sendMessageByParty(_room, splitMsg);
    }
    else if(_msg.indexOf(libConst.MasterPrefix + "캐릭조회") === 0) {
        if(_room !== Master || _sender !== Master) {
            _replier.reply("마스터 명령어 입니다.");
            return;
        }

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + libConst.MasterPrefix + "캐릭조회 [캐릭명]");
            return;
        }
        
        friend = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.Charinfo(friend));
    }
    else if(_msg.indexOf(libConst.MasterPrefix + "룬회수") === 0) {
        if(_room !== Master || _sender !== Master) {
            _replier.reply("마스터 명령어 입니다.");
            return;
        }

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + libConst.MasterPrefix + "룬회수 [금액] [캐릭명]");
            return;
        }
        rune = splitMsg[1];
        if(!checkNumberic(rune)) {
            _replier.reply("룬 금액을 정확히 입력하시기 바랍니다. ex> " + libConst.MasterPrefix + "룬회수 [금액] [캐릭명]");
            return;
        }
        friend = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(charactor_Manager.collectionRune(friend, ChangeNumber(rune)));
    }
    else if(_msg.indexOf(libConst.MasterPrefix + "템회수") === 0) {
        if(_room !== Master || _sender !== Master) {
            _replier.reply("마스터 명령어 입니다.");
            return;
        }

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + libConst.MasterPrefix + "템회수 [갯수];[아이템명];[캐릭명] 또는 " + libConst.MasterPrefix + "템회수 [갯수];[아이템명+강화수치];[캐릭명]");
            return;
        }
        result = _msg.substring(splitMsg[0].length + 1, _msg.length);
        splitMsg2 = result.split(";");
        if(splitMsg2.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + libConst.MasterPrefix + "템회수 [갯수];[아이템명];[캐릭명] 또는 " + libConst.MasterPrefix + "템회수 [갯수];[아이템명+강화수치];[캐릭명]");
            return;
        }

        count = splitMsg2[0];
        item = splitMsg2[1];
        friend = result.substring(splitMsg2[0].length + splitMsg2[1].length + 2, result.length);

        _replier.reply(charactor_Manager.collectionItem(friend, item, count));
    }
    else if(_msg.indexOf(libConst.MasterPrefix + "시세조작") === 0) {
        if(_room !== Master || _sender !== Master) {
            _replier.reply("마스터 명령어 입니다.");
            return;
        }

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + libConst.MasterPrefix + "시세조작 [금액] [아이템명]");
            return;
        }
        rune = splitMsg[1];
        if(!checkNumberic(rune)) {
            _replier.reply("룬 금액을 정확히 입력하시기 바랍니다. ex> " + libConst.MasterPrefix + "시세조작 [금액] [아이템명]");
            return;
        }
        item = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(exchange_Manager.counterfeitMP(item, ChangeNumber(rune)));
    }
    else {
        splitMsg = _msg.split(" ");
        if(splitMsg.length === 1) {
            if(_msg.substring(0,1) === fix) {
                command = _msg.substring(1,_msg.length);
                if(checkNumberic(command)) {
                    result = login_Manager.getShortCut(_room, command);
                    if(result !== null) {
                        for(i = 0; i < result.length; ++i) {
                              PlayCmd(_room, result[i], _sender, _replier, _image);
                              java.lang.Thread.sleep(1000);
                        }
                    }
                    return;
                }
            }
        }
        PlayCmd(_room, _msg, _sender, _replier, _image);
    }
}
function PlayCmd(_room, _msg, _sender, _replier, _image) {
    if (helper.PlayDirection(_room, _msg, _replier)) {
        CheckQuest(_room, _sender, _msg, _image, _replier);
        return;
    }
    var splitMsg, itemName, count, name, i, Postlist, param, skillName, percent;
    var str, idx, rune, list, effect, response;

    if (_msg === fix + "가이드") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getGuide(_room, clan_Manager));
    }
    else if (_msg === fix + "내권한") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        str = "[" + _room + "님의 권한 목록]\n\n";
        param = charactor_Manager.isSummoner(_room);
        list = appoint_Manager.getIDList(appoint_Manager.TYPE.SubMaster);
        if(list.indexOf(_room) !== -1)
            str += "  - 관리자 (부운영자)\n";

        list = appoint_Manager.getIDList(appoint_Manager.TYPE.Labrarian);
        if(list.indexOf(_room) !== -1)
            str += "  - 사서\n";
        if(charactor_Manager.isWriter(_room)){
            str += "  - 작가\n";
        }
        if(fishing_Manager.isFisher(_room))
            str += "  - 낚시꾼\n";

        switch(param) {
            case "element":
                param = "(원소계통)";
                break;
            case "animal":
                param = "(자연계통)";
                break;
            case "divine":
                param = "(신성계통)";
                break;
            case "chaos":
                param = "(혼돈계통)";
                break;
        }
        if(param !== "")
            str += "  - 소환사 " + param;
        _replier.reply(str);
    }
    else if (_msg.indexOf(fix + "이동") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isMining(_room)){
            _replier.reply("현재 채굴중임으로 이동이 불가능합니다.\n\n 채굴 끝내기 : " + fix + "채굴종료");
            return;
        }
        if(charactor_Manager.isFelling(_room)){
            _replier.reply("현재 벌목중임으로 이동이 불가능합니다.\n\n 벌목 끝내기 : " + fix + "벌목종료");
            return;
        }
        if(charactor_Manager.isStoning(_room)){
            _replier.reply("현재 채광중임으로 이동이 불가능합니다.\n\n 채광 끝내기 : " + fix + "채광종료");
            return;
        }
        if(charactor_Manager.isGetting(_room)){
            _replier.reply("현재 채집중임으로 이동이 불가능합니다.\n\n 채집 끝내기 : " + fix + "채집종료");
            return;
        }
        if(charactor_Manager.IsDungeon(_room, "dungeon")){
            _replier.reply("현재 던전에 진입중이라 이동이 불가능합니다. 파티원 이라면 파티를 탈퇴하면 이동이 가능합니다.\n\n 이동 방법 : " + fix + "파티탈퇴");
            return;
        }
        if(charactor_Manager.IsDungeon(_room, "occupy")){
            _replier.reply("현재 점령전 중이라 이동이 불가능합니다. 파티원 이라면 파티를 탈퇴하면 이동이 가능합니다.\n\n 이동 방법 : " + fix + "파티탈퇴");
            return;
        }
        if(gamble_Manager.IsPlayingGame(_room, gamble_Manager.getGame.HOLDEM)){
            _replier.reply("홀덤에 참여중임으로 이동이 불가능합니다.\n\n 홀덤 종료 : " + fix + "팟나가기");
            return;
        }

        _replier.reply(charactor_Manager.Move(_room, _msg.substring(4, _msg.length), clan_Manager.getConquest(_room)));
        _replier.reply(charactor_Manager.getGuide(_room, clan_Manager));
    }
    else if (_msg === fix + "떠나기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isMining(_room)){
            _replier.reply("현재 채굴중임으로 이동이 불가능합니다.\n\n 채굴 끝내기 : " + fix + "채굴종료");
            return;
        }
        if(charactor_Manager.isFelling(_room)){
            _replier.reply("현재 벌목중임으로 이동이 불가능합니다.\n\n 벌목 끝내기 : " + fix + "벌목종료");
            return;
        }
        if(charactor_Manager.isStoning(_room)){
            _replier.reply("현재 채광중임으로 이동이 불가능합니다.\n\n 채광 끝내기 : " + fix + "채광종료");
            return;
        }
        if(charactor_Manager.isGetting(_room)){
            _replier.reply("현재 채집중임으로 이동이 불가능합니다.\n\n 채집 끝내기 : " + fix + "채집종료");
            return;
        }
        if(charactor_Manager.IsDungeon(_room, "dungeon")){
            _replier.reply("현재 던전에 진입중이라 이동이 불가능합니다. 파티원 이라면 파티를 탈퇴하면 이동이 가능합니다.\n\n 이동 방법 : " + fix + "파티탈퇴");
            return;
        }
        if(charactor_Manager.IsDungeon(_room, "occupy")){
            _replier.reply("현재 점령전 중이라 이동이 불가능합니다. 파티원 이라면 파티를 탈퇴하면 이동이 가능합니다.\n\n 이동 방법 : " + fix + "파티탈퇴");
            return;
        }
        if(gamble_Manager.IsPlayingGame(_room, gamble_Manager.getGame.HOLDEM)){
            _replier.reply("홀덤에 참여중임으로 이동이 불가능합니다.\n\n 홀덤 종료 : " + fix + "팟나가기");
            return;
        }

        _replier.reply(charactor_Manager.Back(_room));
        _replier.reply(charactor_Manager.getGuide(_room, clan_Manager));
    }
    else if (_msg.indexOf(fix + "사냥") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "사냥 5");
            return;
        }

        count = ChangeNumber(splitMsg[1]);
        if(count > libConst.MaxHuntingCount)
        {
            count = libConst.MaxHuntingCount;
            _replier.reply("사냥 횟수가 너무 많습니다. 최대 " + libConst.MaxHuntingCount + "회로 조정됩니다.");
        }
        _replier.reply(charactor_Manager.Hunting(_room, count));
    }
    else if (_msg.indexOf(fix + "보스소환") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "보스소환 5");
            return;
        }

        count = ChangeNumber(splitMsg[1]);
        if(count > libConst.MaxHuntingCount)
        {
            count = libConst.MaxHuntingCount;
            _replier.reply("횟수가 너무 많습니다. 최대 " + libConst.MaxHuntingCount + "회로 조정됩니다.");
        }
        _replier.reply(charactor_Manager.SummonBoss(_room ,count));
    }
    else if (_msg.indexOf(fix + "제물기부") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "제물기부 1000");
            return;
        }

        price = splitMsg[1];
        if(!checkNumberic(price))
        {
            _replier.reply("기부할 룬의 양을 정확히 입력해 주십시오. ex> " + fix + "제물기부 1000");
            return;
        }

        _replier.reply(charactor_Manager.injectRune(_room, ChangeNumber(price)));
    }
    else if (_msg === fix + "제단정보") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getAltarInfo(_room));
    }
    else if (_msg === fix + "전설소환") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.LegendSummon(_room));
    }
    else if (_msg === fix + "도전하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.LegendChallenge(_room));
    }
    else if (_msg === fix + "숙박하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.Lodge(_room, false));
    }
    else if (_msg === fix + "식사하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.EatRice(_room));
    }
    else if (_msg === fix + "채굴하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isMining(_room)){
            _replier.reply("이미 채굴중입니다.\n\n 채굴 끝내기 : " + fix + "채굴종료");
            return;
        }

        _replier.reply(charactor_Manager.GoMining(_room));
    }
    else if (_msg === fix + "채굴종료") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(!charactor_Manager.isMining(_room)){
            _replier.reply("채굴중이 아닙니다.");
            return;
        }
        _replier.reply(charactor_Manager.StopMining(_room));
    }
    else if (_msg.indexOf(fix + "자동채굴") === 0 || _msg.indexOf(fix + "자동벌목") === 0 || _msg.indexOf(fix + "자동채광") === 0 || _msg.indexOf(fix + "자동채집") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "자동(채굴/벌목/채광/채집) 3 1Lv 정령일꾼");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "자동(채굴/벌목/채광/채집) 3 1Lv 정령일꾼");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        if(splitMsg[0] === fix + "자동채굴")
            _replier.reply(charactor_Manager.StartObtain(_room, libObject.ObtainKind.MINING, ChangeNumber(count), itemName));
        if(splitMsg[0] === fix + "자동벌목")
            _replier.reply(charactor_Manager.StartObtain(_room, libObject.ObtainKind.FELLING, ChangeNumber(count), itemName));
        if(splitMsg[0] === fix + "자동채광")
            _replier.reply(charactor_Manager.StartObtain(_room, libObject.ObtainKind.STONING, ChangeNumber(count), itemName));
        if(splitMsg[0] === fix + "자동채집")
            _replier.reply(charactor_Manager.StartObtain(_room, libObject.ObtainKind.GETTING, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "자동정산") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.EndObtain(_room));
    }
    else if (_msg === fix + "대출하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getloanList(_room, "loan"));
    }
    else if(_msg.indexOf(fix + "대출") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "대출 1000000 시즈대출");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "대출 1000000 시즈대출");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.loan(_room, "loan", ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "예금하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getloanList(_room, "deposit"));
    }
    else if(_msg.indexOf(fix + "예금") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "예금 1000000 미리네예금");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "예금 1000000 미리네예금");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.loan(_room, "deposit", ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "정산하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.calcLoan(_room));
    }
    else if (_msg === fix + "해지하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.cancelLoan(_room));
    }
    else if(_msg === fix + "포인트회복"){
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(libConst.AutoAPRecovery) {
            _replier.reply(charactor_Manager.RecoveryAPPoint(_room));
        }
    }
    else if (_msg === fix + "구매하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getSaleItem(_room));
    }
    else if (_msg.indexOf(fix + "구매") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "구매 5 소형 HP포션");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = "1";
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(charactor_Manager.Purchase(_room, ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "판매하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isTradeLoc(_room))
            _replier.reply("[판매 가능한 아이템]\n\n" + charactor_Manager.OpenBag(_room));
        else {
            _replier.reply("판매 가능한 위치가 아닙니다.");
        }
    }
    else if (_msg.indexOf(fix + "판매") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "판매 5 소형 HP포션");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = "1";
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(charactor_Manager.Sell(_room, ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "감정하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("[감정 가능한 아이템]\n\n" + charactor_Manager.AnalyzeItem(_room));
    }
    else if (_msg.indexOf(fix + "감정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "감정 5 소형 HP포션");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "감정 5 소형 HP포션");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(charactor_Manager.Analyze(_room, ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "교환하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getSaleCapital(_room));
    }
    else if (_msg.indexOf(fix + "교환") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "교환 5 소형 HP포션");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = "1";
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(charactor_Manager.Exchange(_room, ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "스킬배우기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getSaleSkill(_room));
    }
    else if (_msg === fix + "소환배우기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getSaleSummon(_room));
    }
    else if (_msg.indexOf(fix + "배우기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다.\n\nex1> 일반스킬 : " + fix + "배우기 더블 어택\nex2> 소환스킬 : " + fix + "배우기 임프 소환");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.LearnSkill(_room, name));
    }
    else if (_msg === fix + "제조하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getMenufactureItem(_room, 0));
    }
    else if (_msg.indexOf(fix + "제조") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "제조 2 슬라임 에테르");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "제조 2 슬라임 에테르");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.Menufacture(_room, ChangeNumber(count), itemName, false));
    }
    else if (_msg === fix + "생산하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getMenufactureItem(_room, 3));
    }
    else if (_msg.indexOf(fix + "생산") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "생산 2 대형 HP포션");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "생산 2 대형 HP포션");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.Menufacture(_room, ChangeNumber(count), itemName, false));
    }
    else if (_msg === fix + "장비제작") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getMenufactureItem(_room, 1));
    }
    else if (_msg.indexOf(fix + "제작") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "제작 2 롱소드");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "제작 2 롱소드");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.Menufacture(_room, ChangeNumber(count), itemName, false));
    }
    else if (_msg.indexOf(fix + "고급제작") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "고급제작 2 라이탄의 궁극의 반지");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "고급제작 2 라이탄의 궁극의 반지");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.Menufacture(_room, ChangeNumber(count), itemName, true));
    }
    else if (_msg === fix + "강화하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getStrengthItem(_room));
    }
    else if (_msg.indexOf(fix + "일반강화") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "일반강화 로브 or " + fix + "일반강화 로브+2");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.StrengthItem(_room, itemName, false));
    }
    else if (_msg.indexOf(fix + "안전강화") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "안전강화 로브 or " + fix + "안전강화 로브+2");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.StrengthItem(_room, itemName, true));
    }
    else if(_msg.indexOf(fix + "강화초기화") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "강화초기화 로브+2");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.RemoveStrength(_room, itemName));
    }
    else if (_msg === fix + "장비분해") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getDecomposeItem(_room));
    }
    else if(_msg.indexOf(fix + "분해") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "분해 3 로브 or " + fix + "분해 2 로브+2");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "분해 3 로브 or " + fix + "분해 2 로브+2");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.DecomposeItem(_room, ChangeNumber(count), itemName));
    }
    else if (_msg === fix + "스킬설정제거") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.removeSkillSetting(_room));
    }
    else if (_msg === fix + "스킬설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
       _replier.reply(charactor_Manager.getSkillinfo(_room) + "\n" + charactor_Manager.getSkillSetting(_room));
    }
    else if (_msg.indexOf(fix + "스킬설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "스킬설정 1 마나볼");
            return;
        }

        param = splitMsg[1];
        skillName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        if(!checkNumberic(param)){
            _replier.reply("정확한 슬롯 넘버를 입력해주시기 바랍니다.");
            return;
        }
        
        _replier.reply(charactor_Manager.setSkillSetting(_room, "skill", ChangeNumber(param), skillName, 0));
    }
    else if(_msg.indexOf(fix + "힐스킬설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 4){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "힐스킬설정 3 60 힐");
            return;
        }

        param = splitMsg[1];
        percent = splitMsg[2];
        skillName = _msg.substring(splitMsg[0].length + splitMsg[1].length + splitMsg[2].length + 3, _msg.length);

        if(!checkNumberic(param)){
            _replier.reply("정확한 슬롯 넘버를 입력해주시기 바랍니다.");
            return;
        }
        if(!checkNumberic(percent)){
            _replier.reply("정확한 체력 퍼센티지를 입력 부탁드립니다.");
            return;
        }
        
        _replier.reply(charactor_Manager.setSkillSetting(_room, "heal", ChangeNumber(param), skillName, ChangeNumber(percent)));
    }
    else if(_msg.indexOf(fix + "큐어스킬설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        skillName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.setSkillSetting(_room, "cure", 0, skillName, 0));
    }
    else if (_msg === fix + "결장설정제거") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.removePvpSkillSetting(_room));
    }
    else if (_msg === fix + "결장설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
       _replier.reply(charactor_Manager.getSkillinfo(_room) + "\n" + charactor_Manager.getPvpSkillSetting(_room));
    }
    else if (_msg.indexOf(fix + "결장설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "스킬설정 1 마나볼");
            return;
        }

        param = splitMsg[1];
        skillName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        if(!checkNumberic(param)){
            _replier.reply("정확한 슬롯 넘버를 입력해주시기 바랍니다.");
            return;
        }

        _replier.reply(charactor_Manager.setPvpSkillSetting(_room, ChangeNumber(param), skillName));
    }
    else if (_msg === fix + "포션설정제거") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.removePotionSetting(_room));
    }
    else if (_msg === fix + "포션설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("[포션 설정방법]\nhp/mp/sp/dp 포션 사용에 대한 설정이 가능하며, 전투시 해당 설정이 발동 됩니다.\n\n" +
                       "ex1> " + fix + "hp포션설정 60 소형 HP포션\nex2> " + fix + "mp포션설정 40 중형 MP포션\nex3> " + fix + "sp포션설정 60 소형 SP포션\nex4> " + fix + "dp포션설정 60 소형 DP포션\n\n" +
                       "첫번째 예는 hp 60% 이하일시 소형 HP포션을 사용하는 설정입니다.\n" +
                       "두번째 예는 mp 40% 이하일시 중형 MP포션을 사용하는 설정입니다.\n" +
                       "세번째 예는 sp 60% 이하일시 중형 SP포션을 사용하는 설정입니다.\n" +
                       "네번째 예는 dp 60% 이하일시 소형 DP포션을 사용하는 설정입니다.");
       _replier.reply(charactor_Manager.getPotionItem(_room) + "\n" + charactor_Manager.getPotionSetting(_room));
    }
    else if (_msg.indexOf(fix + "hp포션설정") === 0 || _msg.indexOf(fix + "mp포션설정") === 0 || _msg.indexOf(fix + "sp포션설정") === 0 || _msg.indexOf(fix + "dp포션설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "hp포션설정 60 소형 HP포션");
            return;
        }
        var type = _msg.substring(1,3);
        percent = splitMsg[1];

        if(!checkNumberic(percent)){
            _replier.reply("정확한 체력 퍼센티지를 입력 부탁드립니다.");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.setPotionSetting(_room, ChangeNumber(percent), itemName, type));
    }
    else if(_msg === fix + "행동력설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("[행동력 포션 설정방법]\nap 포션 사용에 대한 설정이 가능하며 ap가 부족할시 자동으로 사용됩니다.\n\n" +
                       "ex> " + fix + "ap포션설정 소형 AP포션\n\n" +
                       "  L 행동력이 없을시 소형 AP포션을 사용하는 설정입니다.\n");
       _replier.reply(charactor_Manager.getAPPotionItem(_room) + "\n" + charactor_Manager.getAPPotionSetting(_room));
    }
    else if (_msg.indexOf(fix + "ap포션설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "ap포션설정 소형 AP포션");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.setPotionSetting(_room, 0, itemName, "ap"));
    }
    else if(_msg === fix + "소환설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("[소환 스킬 설정방법]\n소환수 스킬을 설정합니다. \n소환수 스킬 설정 갯수는 교감, 영혼 스텟과 친화력, 신마력 능력치가 높다면 많은 소환수 스킬을 설정할 수 있습니다.\n\n" +
                       "ex> " + fix + "소환설정추가 3 바람 정령 소환\n\n" +
                       "  L 전투시 세번째 턴에서 바람정령이 없다면 바람정령을 소환하게 됩니다.\n");
       _replier.reply(charactor_Manager.getSummonSkillinfo(_room) + "\n" + charactor_Manager.getSummonSkillSetting(_room));
    }
    else if(_msg.indexOf(fix + "소환설정추가") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "소환설정추가 3 바람 정령 소환");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count) && !checkNumbZero(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "소환설정추가 3 바람 정령 소환");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        if(checkNumbZero(count)) {
            _replier.reply(charactor_Manager.setSummonSkillSetting(_room, 0, itemName));
        }
        else {
            _replier.reply(charactor_Manager.setSummonSkillSetting(_room, ChangeNumber(count), itemName));
        }
    }
    else if (_msg === fix + "소환설정제거") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.removeSummonSkillSetting(_room));
    }
    else if(_msg === fix + "결장소환설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("[소환 스킬 설정방법]\n소환수 스킬을 설정합니다. \n소환수 스킬 설정 갯수는 교감, 영혼 스텟과 친화력, 신마력 능력치가 높다면 많은 소환수 스킬을 설정할 수 있습니다.\n\n" +
                       "ex> " + fix + "결장소환설정추가 3 바람 정령 소환\n\n" +
                       "  L 전투시 세번째 턴에서 바람정령이 없다면 바람정령을 소환하게 됩니다.\n");
       _replier.reply(charactor_Manager.getSummonSkillinfo(_room) + "\n" + charactor_Manager.getPvpSummonSkillSetting(_room));
    }
    else if(_msg.indexOf(fix + "결장소환설정추가") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "결장소환설정추가 3 바람 정령 소환");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count) && !checkNumbZero(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "결장소환설정추가 3 바람 정령 소환");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        if(checkNumbZero(count)) {
            _replier.reply(charactor_Manager.setPvpSummonSkillSetting(_room, 0, itemName));
        }
        else {
            _replier.reply(charactor_Manager.setPvpSummonSkillSetting(_room, ChangeNumber(count), itemName));
        }
    }
    else if (_msg === fix + "결장소환설정제거") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.removePvpSummonSkillSetting(_room));
    }
    else if (_msg === fix + "캠핑설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("[캠핑 설정방법]\n캠핑에 관련된 설정이 가능합니다.\n\n" +
                       "ex1> " + fix + "캠핑장비설정 캠핑장비A\nex2> " + fix + "캠핑음식설정 전투식량\n\n" +
                       "첫번째 예는 캠핑장비를 세팅하는 설정입니다.\n" +
                       "두번째 예는 캠핑때 먹을 음식을 세팅하는 설정입니다.");
       _replier.reply(charactor_Manager.getCampingItem(_room) + "\n" + charactor_Manager.getFoodItem(_room) + "\n" + charactor_Manager.getCampingSetting(_room));
    }
    else if (_msg.indexOf(fix + "캠핑장비설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.setCampingSetting(_room, itemName));
    }
    else if (_msg.indexOf(fix + "캠핑음식설정") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.setCampingFoodSetting(_room, itemName));
    }
    else if (_msg === fix + "정보보호켜기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.setPrivateSetting(_room, true));
    }
    else if (_msg === fix + "정보보호끄기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.setPrivateSetting(_room, false));
    }
    else if (_msg === fix + "정보보호") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getPrivateSetting(_room));
    }
    else if (_msg === fix + "전투로그켜기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.setHuntingSetting(_room, true));
    }
    else if (_msg === fix + "전투로그끄기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.setHuntingSetting(_room, false));
    }
    else if (_msg === fix + "전투로그설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getHuntingSetting(_room));
    }
    else if (_msg.indexOf(fix + "가방") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length === 1 && _msg === fix + "가방") {
            _replier.reply("[아이템 리스트]" + libConst.dummy + "\n\n" + charactor_Manager.OpenBag(_room));
            str = charactor_Manager.getMountItem(_room);
            str += fishing_Manager.getSetting(_room);
            _replier.reply(str);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
            _replier.reply("['" + itemName + "' 가방 검색]" + libConst.dummy + "\n\n" + charactor_Manager.SearchBag(_room, itemName));
        }
    }
    else if (_msg === fix + "스킬") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getSkillinfo(_room) + "\n" + charactor_Manager.getSummonSkillinfo(_room));
    }
    else if(_msg === fix + "기록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getRecordManager.getRecordText(_room));
    }
    else if (_msg === fix + "스텟") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        str = charactor_Manager.getStat(_room);
        str += fishing_Manager.getStat(_room);
        _replier.reply(str);
    }
    else if (_msg === fix + "특성") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getTalentinfo(_room));
    }
    else if (_msg === fix + "통행증") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getPassportinfo(_room));
    }
    else if (_msg === fix + "캠핑") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.DoCamping(_room));
    }
    else if (_msg === fix + "버프") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.BuffInfo(_room));
    }
    else if (_msg === fix + "레시피") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getRecipeList(_room));
    }
    else if (_msg.indexOf(fix + "장착") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "장착 로브 (강화된 장비일 경우 >> " + fix + "장착 로브+3)");
            return;
        }

        _replier.reply(charactor_Manager.Mount(_room,itemName));
    }
    else if (_msg.indexOf(fix + "탈착") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "탈착 로브 (강화된 장비일 경우 >> " + fix + "탈착 로브+3)");
            return;
        }

        _replier.reply(charactor_Manager.Desorption(_room,itemName));
    }
    else if (_msg === fix + "룬") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getRune(_room));
    }
    else if (_msg.indexOf(fix + "사용") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(gamble_Manager.IsPlayingGame(_room, gamble_Manager.getGame.HOLDEM)){
            _replier.reply("홀덤 게임 참여중에는 물건 사용이 제한됩니다.\n\n 홀덤 종료 : " + fix + "팟나가기");
            return;
        }
        splitMsg = _msg.split(" ");

        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "사용 중형 HP포션");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = 1;
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
          itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        obj = db_Manager.getItemByName(itemName);
        if(obj.obj !== null && obj.obj.kind === "coin") {
            _replier.reply(gamble_Manager.useItem(_room, itemName, ChangeNumber(count)));
        }
        else {
            _replier.reply(charactor_Manager.useItem(_room, itemName, ChangeNumber(count)));
        }
    }
    else if (_msg.indexOf(fix + "마석흡수") === 0) {
        if(libConst.RuneConsume) {
            if(!checkCharactor(_room, _replier, _sender, _image))return;
            splitMsg = _msg.split(" ");
            if(splitMsg.length < 3){
                _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "마석흡수 1 덱스");
                return;
            }
            count = splitMsg[1];
            if(!checkNumberic(count)) {
                _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "마석흡수 1 덱스");
                return;
            }
            name = splitMsg[2];
            if(name !== "힘" && name !== "체질" && name !== "민첩" && name !== "재주" && name !== "지능" && name !== "운" && name !== "효율" && name !== "교감" && name !== "영혼") {
                _replier.reply("스테이터스 값이 상이합니다. ex> 힘, 체질, 민첩, 재주, 지능, 운, 효율, 교감, 영혼");
                return;
            }

            _replier.reply(charactor_Manager.RuneConsume(_room, ChangeNumber(count), name));
        }
    }
    else if (_msg.indexOf(fix + "도감") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "도감 로브");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(db_Manager.Dictionary(name));
    }
    else if (_msg.indexOf(fix + "리스트") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "리스트 잡템");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(db_Manager.DictionaryList(name));
    }
    else if (_msg.indexOf(fix + "재료") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "재료 소형 HP포션");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(charactor_Manager.getMaterial(_room, itemName));
    }
    else if (_msg.indexOf(fix + "배팅") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "배팅 [배팅할 금액] [배팅 위치]");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "배팅 [배팅할 금액] [배팅 위치]");
            return;
        }

        _replier.reply(charactor_Manager.Betting(_room, ChangeNumber(count), splitMsg[2]));
    }
    else if(_msg === fix + "우편") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        Postlist = post_Manager.getPostListByID(_room);
        var replyStr = "[" + _room + "] 우편 리스트\n\n";
        var tmpPost = null, tmpitem = null;

        for(i = 0; i < Postlist.length; ++i) {
            tmpPost = Postlist[i];

            replyStr += "" + (i + 1) + ". " + tmpPost.message + "\n";

            for(var j = 0; j < tmpPost.items.length; ++j) {
                tmpitem = tmpPost.items[j];
                replyStr += "   - " + tmpitem.name + " x " + tmpitem.count + "\n";
            }

            if(tmpPost.rune !== "0")
                replyStr += "   - " + tmpPost.rune + "(Rune)\n";

            replyStr += "\n";

        }
        replyStr += "[받기 명령어]\n" + fix + "모두받기, " + fix + "받기 [아이템번호]";
        _replier.reply(replyStr);
    }
    else if(_msg.indexOf(fix + "받기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2 || isNaN(splitMsg[1])){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "받기 2");
            return;
        }
        var reciveIdx = Number(splitMsg[1]) - 1;
        if(reciveIdx < 0) {
            _replier.reply("받기 값은 1 이상부터 가능합니다.");
            return;
        }

        Postlist = post_Manager.getPostListByID(_room);
        if(reciveIdx > Postlist.length) {
            _replier.reply("해당 인덱스에 우편이 존재 하지 않습니다.");
            return;
        }

        var post = Postlist[reciveIdx];
        _replier.reply(charactor_Manager.RecivePost(_room, post.items, post.rune));
        post_Manager.removeMsg(post.tokenid);
    }
    else if(_msg === fix + "모두받기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        Postlist = post_Manager.getPostListByID(_room);
        _replier.reply(charactor_Manager.ReciveAllPost(_room, Postlist));
        post_Manager.removeMsgAll(_room);
    }
    else if(_msg === fix + "시합하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.MatchGame(_room));
    }
    else if(_msg === fix + "랭킹정보") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.RankingInfo(_room));
    }
    else if(_msg === fix + "전투기록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.BattleRecord(_room));
    }
    else if(_msg.indexOf(fix + "국가이동") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "국가이동 [국가명]");
            _replier.reply("보유 통행증 확인 방법 ex> " + fix + "통행증 ");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.MoveNation(_room, name));
        _replier.reply(charactor_Manager.getGuide(_room, clan_Manager));
    }
    else if(_msg === fix + "대화하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("대화 명령어 : " + fix + "대화 [NPC명]\n\n ex> " + fix + "대화 알버트\n\n 위 명령어는 알버트와 대화한다는 의미 입니다.");
        _replier.reply(charactor_Manager.PersonList(_room));
    }
    else if(_msg.indexOf(fix + "대화") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "대화 알버트");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.Conversation(_room, name));
    }
    else if(_msg === fix + "예" || _msg === fix + "아니오") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        param = (_msg === fix + "예"?true:false);
        _replier.reply(charactor_Manager.setQuest(_room, param));
    }
    else if(_msg === fix + "퀘스트") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.currQuestList(_room));
    }
    else if(_msg === fix + "완료하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.CompliteQuest(_room));
    }
    else if(_msg.indexOf(fix + "포기하기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "포기하기 1");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "포기하기 1");
            return;
        }

        _replier.reply(charactor_Manager.GiveUpQuest(_room, ChangeNumber(count)));
    }
    else if(_msg === fix + "숙제") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(homework_Manager.getHomeworkStr(_room));
    }

    else if(_msg === fix + "용병영입") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("용병 영입 명령어 : " + fix + "영입 [용병명]\n\n ex> " + fix + "영입 소드맨\n\n 위 명령어는 소드맨을 영입한다는 명령어 입니다.");
        _replier.reply(charactor_Manager.getSaleMercenary(_room));
    }
    else if(_msg.indexOf(fix + "영입") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "영입 소드맨");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.HireMercenary(_room, name));
    }
    else if(_msg === fix + "용병이적") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("용병 이적 명령어 : " + fix + "이적 [용병 인덱스]\n\n ex> " + fix + "이적 1\n\n 위 명령어는 첫번째 용병을 이적한다는 의미 입니다.");
        _replier.reply(charactor_Manager.getRemoveMercenary(_room));
    }
    else if(_msg.indexOf(fix + "이적") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "이적 1");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "이적 1");
            return;
        }

        _replier.reply(charactor_Manager.FireMercenary(_room, ChangeNumber(count) - 1));
    }
    else if(_msg === fix + "용병") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getMercenary(_room));
    }
    else if(_msg === fix + "용병전직") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("용병 전직 명령어 : " + fix + "전직 [용병 인덱스] [전직할 용병명]\n\n ex> " + fix + "전직 1 소드 엠페러\n\n 위 명령어는 첫번째 용병을 소드 엠페러로 전직한다는 의미 입니다.");
        _replier.reply(charactor_Manager.getChangeMercenary(_room));
    }
    else if(_msg.indexOf(fix + "전직") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "전직 1 소드 엠페러");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "전직 1 소드 엠페러");
            return;
        }
        name = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.ChangeMercenary(_room, ChangeNumber(count) - 1, name));
    }
    else if(_msg === fix + "용병설정") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("[용병 설정 명령어]\n\n  - " + fix + "용병출전 [용병 인덱스]\n    L (용병을 전투에 투입합니다.)\n  - " + fix + "용병휴식 [용병 인덱스]\n    L (용병을 전투에서 배제합니다.)");
        _replier.reply(charactor_Manager.getMyMercenary(_room));
    }
    else if(_msg.indexOf(fix + "용병출전") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "용병출전 1");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "용병출전 1");
            return;
        }

        _replier.reply(charactor_Manager.settingMercenary(_room, ChangeNumber(count) - 1 , "Y"));
    }
    else if(_msg.indexOf(fix + "용병휴식") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "용병휴식 1");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "용병휴식 1");
            return;
        }

        _replier.reply(charactor_Manager.settingMercenary(_room, ChangeNumber(count) - 1, "N"));
    }

    else if (_msg === fix + "클랜합성") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("제조 명령어 : " + fix + "합성 [갯수] [아이템명]\n\n ex> " + fix + "합성 2 하급마나석\n\n 위 명령어는 하급마나석을 2개 만든다는 의미 입니다.\n\n" +
                        "재료 보기 : " + fix + "재료 [아이템명]\n\n ex> " + fix + "재료 하급마나석\n\n 위 명령어는 하급마나석을 만드는 재료를 확인합니다.");
        _replier.reply(charactor_Manager.getMenufactureItem(_room, 2));
    }
    else if (_msg.indexOf(fix + "합성") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "합성 2 하급마나석");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "합성 2 하급마나석");
            return;
        }

        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(clan_Manager.Menufacture(_room, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "클랜축복") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("축복 명령어 : " + fix + "축복 [축복명]\n\n ex> " + fix + "축복 가이아의 근원\n\n 위 명령어는 가이아의 근원을 축복받겠다는 의미 입니다.\n\n" +
                        "축복 조건 보기 : " + fix + "도감 [축복명]\n\n ex> " + fix + "도감 가이아의 근원\n\n 위 명령어는 가이아의 근원 정보를 확인합니다.");
        _replier.reply(clan_Manager.getBlessList(_room));
    }
    else if(_msg.indexOf(fix + "축복") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "축복 살라만더의 숨결");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.setBless(_room, name));
    }
    else if(_msg.indexOf(fix + "클랜창설") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "클랜창설 [클랜명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.MakeClan(_room, name));
    }
    else if(_msg.indexOf(fix + "창단원요청") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "창단원요청 [유저명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(clan_Manager.InviteOriginUser(_room, name));
    }
    else if(_msg.indexOf(fix + "수락") === 0 || _msg.indexOf(fix + "거절") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        response = ((splitMsg[0] === fix + "수락")?true:false);

        if(splitMsg.length < 2){
            _replier.reply("클랜명을 입력해주시기 바랍니다. ex> " + fix + "수락 [길드명] or " + fix + "거절 [길드명]");
            _replier.reply(clan_Manager.getMyInvitedList(_room));
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(clan_Manager.ResponsOriginUser(_room, response, name));
    }
    else if(_msg === fix + "클랜") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply(clan_Manager.myClanInfo(_room));
        }
        else {
            name = _msg.substring(_msg.indexOf(splitMsg[1]), _msg.length);
            _replier.reply(clan_Manager.InviteOriginUser(_room, name));
        }
    }
    else if(_msg.indexOf(fix + "룬기부") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "룬기부 1000");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "룬기부 1000");
            return;
        }

        _replier.reply(clan_Manager.GiveClanRune(_room, ChangeNumber(count)));
    }
    else if(_msg.indexOf(fix + "템기부") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "템기부 5 미스릴");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "템기부 5 미스릴");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(clan_Manager.GiveClanItem(_room, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "클랜인증") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(clan_Manager.ConfirmClan(_room));
    }
    else if(_msg === fix + "클랜항목") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(clan_Manager.getClanList());
    }
    else if(_msg.indexOf(fix + "클랜신청") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "클랜신청 [클랜명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.requestClan(_room, name));
    }
    else if(_msg === fix + "신청대기항목") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(clan_Manager.requestClanList(_room, name));
    }
    else if(_msg.indexOf(fix + "클랜영입") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "클랜영입 [클랜 신청대기 인원]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.recruitUser(_room, name));
    }
    else if(_msg === fix + "클랜탈퇴") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(clan_Manager.leaveClan(_room));
    }
    else if(_msg.indexOf(fix + "클랜추방") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "클랜추방 [클랜원]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.banishClan(_room, name));
    }
    else if(_msg.indexOf(fix + "클랜양도") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "클랜양도 [클랜원]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.transferClan(_room, name));
    }
    else if(_msg.indexOf(fix + "진급") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "진급 [클랜원]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.promoteUser(_room, name));
    }
    else if(_msg.indexOf(fix + "강등") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "강등 [클랜원]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(clan_Manager.demoteUser(_room, name));
    }

    else if(_msg.indexOf(fix + "종족진화") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        if(_msg === fix + "종족진화") {
            _replier.reply("사용법 : !종족진화 [종족명]\n ex> " + fix + "종족진화 네피림");
            _replier.reply(charactor_Manager.EvolutionList(_room));
            return;
        }

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "종족진화 [종족명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.Evolution(_room, name));
    }
    else if(_msg === fix + "연금술하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply("뽑기명령어 : " + fix + "연성 [횟수], " + fix + "쿠폰연성 [횟수]\n\n[주의사항]\n" +
                       "  - 한번 연성시 드는 룬은 " + libConst.AlchemyRune + " rune 입니다.\n" +
                       "  - 한번 연성할때 연성물질을 드립니다. 연성물질이 10개를 모우시면 한번 연성이 가능합니다.\n");
        _replier.reply(charactor_Manager.Alchemy(_room));
    }
    else if(_msg.indexOf(fix + "연성") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "연성 1");
            return;
        }
        count = splitMsg[1];

        if(!checkNumberic(count)){
            _replier.reply("정확한 횟수를 입력 바랍니다.");
            return;
        }

        if(count > libConst.AlchemyCount) {
            _replier.reply("횟수가 너무 많아 최대 " + libConst.AlchemyCount + "회로 조정됩니다.");
            count = libConst.AlchemyCount;
        }

        _replier.reply("[연금술사가 연성을 시작합니다.]");
        java.lang.Thread.sleep(1000);
        _replier.reply(charactor_Manager.ActAlchemy(_room, ChangeNumber(count), "N"));
    }
    else if(_msg.indexOf(fix + "쿠폰연성") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "쿠폰연성 1");
            return;
        }
        count = splitMsg[1];

        if(!checkNumberic(count)){
            _replier.reply("정확한 횟수를 입력 바랍니다.");
            return;
        }

        if(count > libConst.AlchemyCount) {
            _replier.reply("횟수가 너무 많아 최대 " + libConst.AlchemyCount + "회로 조정됩니다.");
            count = libConst.AlchemyCount;
        }

        _replier.reply("[연금술사가 쿠폰연성을 시작합니다.]");
        java.lang.Thread.sleep(1000);
        _replier.reply(charactor_Manager.ActAlchemy(_room, ChangeNumber(count), "Y"));
    }

    else if(_msg.indexOf(fix + "탐험가영입") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
          _replier.reply("명령어 : " + fix + "탐험가영입 [종류], ex> " + fix + "탐험가영입 고급\n\n" +
                         "  - 한번 영입에 드는 룬\n" +
                         "   L 초급 : "+libConst.ExplorerRune1 + " rune, 범위 : C~A등급까지\n" +
                         "   L 중급 : "+libConst.ExplorerRune2 + " rune, 범위 : B~S등급까지\n" +
                         "   L 고급 : "+libConst.ExplorerRune3 + " rune, 범위 : A~SS등급까지\n" +
                         "  - 기존에 탐험가가 있다면 기존 탐험가와 교체 영입됩니다.");
            return;
        }

        param = splitMsg[1];
        if(param !== "초급" && param !== "중급" && param !== "고급") {
          _replier.reply("데이터 값이 상이합니다. >> " + fix + "탐험가영입 [종류], ex> " + fix + "탐험가영입 고급\n\n" +
                         "  - 한번 영입에 드는 룬\n" +
                         "   L 초급 : "+libConst.ExplorerRune1 + " rune, 범위 : C~A등급까지\n" +
                         "   L 중급 : "+libConst.ExplorerRune2 + " rune, 범위 : B~S등급까지\n" +
                         "   L 고급 : "+libConst.ExplorerRune3 + " rune, 범위 : A~SS등급까지\n" +
                         "  - 기존에 탐험가가 있다면 기존 탐험가와 교체 영입됩니다.");
            return;
        }

        if(param === "초급") idx = 1;
        else if(param === "중급") idx = 2;
        else if(param === "고급") idx = 3;

        _replier.reply(charactor_Manager.HireExplorer(_room, idx));
    }
    else if(_msg === fix + "탐험가잠금") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.LockExplorer(_room, true));
    }
    else if(_msg === fix + "탐험가풀기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.LockExplorer(_room, false));
    }
    else if(_msg === fix + "탐험가") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getExplorer(_room, false));
    }
    else if(_msg === fix + "자동사냥") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.AutoHunting(_room));
    }
    else if(_msg === fix + "탐험가복귀") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.StopAutoHunting(_room));
    }

    else if(_msg.indexOf(fix + "시세확인") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "시세확인 로브");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(exchange_Manager.getMarketPrice(_room, name));
    }
    else if(_msg.indexOf(fix + "물품등록") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        if(_msg === fix + "물품등록") {
            _replier.reply("[물품거래시 주의사항]\n\n" +
                           "  - 물품거래는 해당 물품의 최저가가 우선 구매됩니다.\n" +
                           "  - 물품등록은 총 " + libConst.MPrice_PutLimit + "건만 등록 가능합니다.\n" +
                           "  - 물품거래는 수수료 : " + (libConst.MPrice_Fee*100) + "%\n");
            _replier.reply("[내가 등록한 물품]\n\n" + exchange_Manager.getMineSaleList(_room));
            return;
        }

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 4 || !checkNumberic(splitMsg[1]) || !checkNumberic(splitMsg[2])) {
          _replier.reply("데이터 값이 상이합니다. ex> " + fix + "물품등록 10000 10 다이아 원석");
          return;
        }
        rune = splitMsg[1];
        count = splitMsg[2];
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + splitMsg[2].length + 3, _msg.length);

        _replier.reply(exchange_Manager.putMarket(_room, itemName, ChangeNumber(count), ChangeNumber(rune)));
    }
    else if(_msg.indexOf(fix + "물품검색") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다.\nex1> " + fix + "물품검색 로브\nex2> " + fix + "물품검색 all");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(exchange_Manager.searchItem(_room, name));
    }
    else if(_msg.indexOf(fix + "물품거래") === 0) {
      if(!checkCharactor(_room, _replier, _sender, _image))return;

      if(_msg === fix + "물품거래"){
          _replier.reply("[물품거래시 주의사항]\n\n" +
                         "  - 물품거래는 해당 물품의 최저가가 우선 구매됩니다.\n" +
                         "  - 물품거래는 부가세 : " + (libConst.MPrice_Surtax*100) + "%\n");
          return;
      }
      splitMsg = _msg.split(" ");
      if(splitMsg.length < 3 || !checkNumberic(splitMsg[1])) {
        _replier.reply("데이터 값이 상이합니다. ex> " + fix + "물품거래 10 다이아 원석");
        return;
      }
      count = splitMsg[1];
      itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

      _replier.reply(exchange_Manager.buyItem(_room, itemName, ChangeNumber(count)));
    }
    else if(_msg.indexOf(fix + "거래취소") === 0) {
      if(!checkCharactor(_room, _replier, _sender, _image))return;

      if(_msg === fix + "거래취소") {
          _replier.reply("[거래취소시 주의사항]\n\n" +
                         "  - 내가 취소할 거래물품의 인덱스를 잘 확인하시기 바랍니다.\n" +
                         "  - 사용법 : " + fix + "거래취소 [거래물품의 인덱스]\n");
          _replier.reply("[내가 등록한 물품]\n\n" + exchange_Manager.getMineSaleList(_room));
          return;
      }
      splitMsg = _msg.split(" ");
      if(splitMsg.length < 2 || !checkNumberic(splitMsg[1])) {
        _replier.reply("데이터 값이 상이합니다. ex> " + fix + "거래취소 1");
        return;
      }
      count = splitMsg[1];

      _replier.reply(exchange_Manager.cancelMarket(_room, ChangeNumber(count)));
    }

    else if(_msg === fix + libConst.Pet_Name) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.getPetInfo(_room));
    }
    else if(_msg.indexOf(fix + "교감하기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "교감하기 [" + libConst.Pet_Name + "이름]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.meetPet(_room, name));
    }
    else if(_msg === fix + "선물하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        list = db_Manager.getPetFamilyList();
        str = "[" + libConst.Pet_Name +"이(가) 선호하는 아이템]\n\n";
        for(i = 0; i < list.length; ++i) {
            str += "  - " + db_Manager.getItem(list[i].itemkind, list[i].itemidx).name + " >> " + list[i].upcount + " 친밀도 상승\n";
        }

        str += "\n";
        str += charactor_Manager.getPetGiftList(_room);

        _replier.reply(str);

    }
    else if(_msg.indexOf(fix + "선물") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "선물 [선물명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.giftPet(_room, name));
    }
    else if(_msg.indexOf(fix + "아공간") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length === 1 && _msg === fix + "아공간") {
            _replier.reply(charactor_Manager.OpenPetStore(_room));
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
            _replier.reply("['" + itemName + "' 아공간 검색]" + libConst.dummy + "\n\n" + charactor_Manager.SearchPetStore(_room, itemName));
        }
    }
    else if(_msg.indexOf(fix + "맡기기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        count = splitMsg[1];
        if(splitMsg.length === 1){
            _replier.reply("데이터 값설정이 상이합니다.\nex> " + fix + "맡기기 [all 또는 아이템명]\nex2> " + fix + "맡기기 [갯수] [아이템명]");
            return;
        }
        if(!checkNumberic(count)) {
            count = 1;
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(charactor_Manager.PutPetStore(_room, ChangeNumber(count), itemName));
    }
    else if(_msg.indexOf(fix + "꺼내기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        count = splitMsg[1];
        if(splitMsg.length === 1){
            _replier.reply("데이터 값설정이 상이합니다.\nex> " + fix + "꺼내기 [all 또는 아이템명]\nex2> " + fix + "꺼내기 [갯수] [아이템명]");
            return;
        }
        if(!checkNumberic(count)) {
            count = 1;
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(charactor_Manager.GetPetStore(_room, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "펫각성") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.PetAwaken(_room));
    }
    else if(_msg === fix + "오르기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.TowerUp(_room));
    }
    else if(_msg === fix + "현층정보") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.TowerInfo(_room));
    }
    else if(_msg === fix + "벌목하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isFelling(_room)){
            _replier.reply("이미 벌목중입니다.\n\n 벌목 끝내기 : " + fix + "벌목종료");
            return;
        }
        _replier.reply(charactor_Manager.GoFelling(_room));
    }
    else if(_msg === fix + "벌목종료") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(!charactor_Manager.isFelling(_room)){
            _replier.reply("벌목중이 아닙니다.");
            return;
        }
        _replier.reply(charactor_Manager.StopFelling(_room));
    }
    else if(_msg === fix + "채광하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isStoning(_room)){
            _replier.reply("이미 채광중입니다.\n\n 채광 끝내기 : " + fix + "채광종료");
            return;
        }
        _replier.reply(charactor_Manager.GoStoning(_room));
    }
    else if(_msg === fix + "채광종료") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(!charactor_Manager.isStoning(_room)){
            _replier.reply("채광중이 아닙니다.");
            return;
        }
        _replier.reply(charactor_Manager.StopStoning(_room));
    }
    else if(_msg === fix + "채집하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(charactor_Manager.isGetting(_room)){
            _replier.reply("이미 채집중입니다.\n\n 채집 끝내기 : " + fix + "채집종료");
            return;
        }
        _replier.reply(charactor_Manager.GoGetting(_room));
    }
    else if(_msg === fix + "채집종료") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(!charactor_Manager.isGetting(_room)){
            _replier.reply("채집중이 아닙니다.");
            return;
        }
        _replier.reply(charactor_Manager.StopGetting(_room));
    }
    else if(_msg === fix + "의뢰받기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getRequestList(_room) + "\n의뢰받는방법 : " + fix + "의뢰수주 [의뢰인덱스]\nex> " + fix + "의뢰수주 1") ;
    }
    else if(_msg.indexOf(fix + "의뢰수주") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "의뢰수주 1");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "의뢰수주 1");
            return;
        }

        _replier.reply(charactor_Manager.ReciveRequest(_room, ChangeNumber(count) - 1));
    }
    else if(_msg === fix + "마이홈") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getHomeInfo(_room));
    }
    else if(_msg === fix + "마이홈정보") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.getHomeDetailInfo(_room));
    }
    else if(_msg === fix + "건축하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        param = charactor_Manager.getBuildingAreaList(_room);
        param += "\n\n건축방법\n  - " + fix + "건축 [도시명] >> 위 도시항목들 중 하나";
        _replier.reply(param);
    }
    else if(_msg.indexOf(fix + "건축") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "건축 [도시명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.BuildingHouse(_room, name));
    }
    else if(_msg === fix + "증축") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.BuildingExtend(_room));
    }
    else if(_msg.indexOf(fix + "창고넣기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        count = splitMsg[1];
        if(splitMsg.length === 1){
            _replier.reply("데이터 값설정이 상이합니다.\nex> " + fix + "창고넣기 [all 또는 아이템명]\nex2> " + fix + "창고넣기 [갯수] [아이템명]");
            return;
        }
        if(!checkNumberic(count)) {
            count = 1;
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }

        _replier.reply(charactor_Manager.PushBox(_room, ChangeNumber(count), itemName));
    }
    else if(_msg.indexOf(fix + "창고꺼내기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        count = splitMsg[1];
        if(splitMsg.length === 1){
            _replier.reply("데이터 값설정이 상이합니다.\nex> " + fix + "창고꺼내기 [all 또는 아이템명]\nex2> " + fix + "창고꺼내기 [갯수] [아이템명]");
            return;
        }
        if(!checkNumberic(count)) {
            count = 1;
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }

        _replier.reply(charactor_Manager.PopBox(_room, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "이전하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        param = charactor_Manager.getMoveAreaList(_room);
        param += "\n\n사용법\n  - " + fix + "이전 [도시명] >> 위 도시항목들 중 하나";
        _replier.reply(param);
    }
    else if(_msg.indexOf(fix + "이전") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "이전 [도시명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.MoveHouse(_room, name));
    }
    else if(_msg === fix + "시설정보") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        param = charactor_Manager.getFurniturePlaceList(_room);
        param += "\n\n사용법 : " + fix + "배치 [가구명], " + fix + "수거 [가구명]";
        _replier.reply(param);
    }
    else if(_msg.indexOf(fix + "배치") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "배치 [가구명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.FurniturePlace(_room, name));
    }
    else if(_msg.indexOf(fix + "수거") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "수거 [가구명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.FurnitureRemove(_room, name));
    }
    else if(_msg === fix + "잠자기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.Lodge(_room, true));
    }
    else if(_msg === fix + "귀환하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(gamble_Manager.IsPlayingGame(_room, gamble_Manager.getGame.HOLDEM)){
            _replier.reply("홀덤에 참여중임으로 귀환이 불가능합니다.\n\n 홀덤 종료 : " + fix + "팟나가기");
            return;
        }
        _replier.reply(charactor_Manager.ComeBackHome(_room));
    }
    else if(_msg.indexOf(fix + "워프기록") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "워프기록 [기록명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.SaveLocation(_room, name));
    }
    else if(_msg.indexOf(fix + "워프하기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "워프하기 [기록된 워프명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.MoveWrapPoint(_room, name, clan_Manager.getConquest(_room)));
    }
    else if(_msg.indexOf(fix + "워프삭제") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "워프삭제 [기록명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(charactor_Manager.RemoveLocation(_room, name));
    }
    else if(_msg.indexOf(fix + "포션만들기") === 0 || _msg.indexOf(fix + "악세만들기") === 0 || _msg.indexOf(fix + "책쓰기") === 0 || _msg.indexOf(fix + "무구만들기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        param = splitMsg[0];
        if(param === fix + "포션만들기")
            effect = "potion";
        else if(param === fix + "악세만들기")
            effect = "accessory";
        else if(param === fix + "책쓰기")
            effect = "book";
        else if(param === fix + "무구만들기")
            effect = "equipment";

        if(splitMsg.length < 2){
            _replier.reply("사용법 " + param + " [갯수] [레시피명]\n\n" + charactor_Manager.getMakeList(_room, effect));
            return;
        }
        else if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + param + " 2 레시피");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + param + " 2 레시피");
            return;
        }
        name = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        _replier.reply(charactor_Manager.MyMakeRecipe(_room, name, effect, ChangeNumber(count)));
    }

    else if(_msg === fix + "낚시등록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(fishing_Manager.Enroll(_room));
    }
    else if(_msg.indexOf(fix + "낚시장착") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "낚시장착 [아이템 명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(fishing_Manager.Equipment(_room, name));
    }
    else if(_msg.indexOf(fix + "낚시탈착") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "낚시탈착 [아이템 명]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(fishing_Manager.Remove(_room, name));
    }
    else if(_msg.indexOf(fix + "낚시랭킹") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "낚시랭킹 [물고기 명] or [all]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(name === "all") {
            _replier.reply(fishing_Manager.AllRanking());
        }
        else {
            _replier.reply(fishing_Manager.Ranking(name));
        }
    }
    else if(_msg === fix + "낚시기록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(fishing_Manager.MyRanking(_room));
    }
    else if(_msg === fix + "낚시하기" || _msg === fix + "낚시") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply("낚시를 시작합니다.");
        _replier.reply(fishing_Manager.FishingStart(_room, name));
    }

    else if(_msg.indexOf(fix + "환전하기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length !== 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "환전하기 100");
            return;
        }

        count = splitMsg[1];
        if(!checkNumberic(count)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "환전하기 100");
            return;
        }

        _replier.reply(gamble_Manager.ExchangeCoin(_room, ChangeNumber(count)));
    }
    else if(_msg === fix + "코인") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(gamble_Manager.MyCoin(_room));
    }
    else if(_msg.indexOf(fix + "코인교환") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply(gamble_Manager.getCoinSaleItem(_room));
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = "1";
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(gamble_Manager.PurchaseCoin(_room, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "팟") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(gamble_Manager.CurrentPot(_room, gamble_Manager.getGame.HOLDEM));
    }
    else if(_msg === fix + "홀덤") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(gamble_Manager.getEntry(_room, gamble_Manager.getGame.HOLDEM));
    }
    else if(_msg === fix + "팟참가") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(gamble_Manager.Join(_room, gamble_Manager.getGame.HOLDEM));
    }
    else if(_msg === fix + "팟나가기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(gamble_Manager.Leave(_room, gamble_Manager.getGame.HOLDEM));
    }
    else if(_msg === fix + "팟시작") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(gamble_Manager.StartGame(_room, gamble_Manager.getGame.HOLDEM));
    }
    else if(_msg === fix + "팟강퇴") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(gamble_Manager.Ban(_room, gamble_Manager.getGame.HOLDEM));
    }
    else if(_msg === fix + "레이즈" || _msg === fix + "콜" || _msg === fix + "폴드" || _msg === fix + "올인") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.substring(1, _msg.length);

        _replier.reply(gamble_Manager.Betting(_room, splitMsg, gamble_Manager.getGame.HOLDEM));
    }

    else if(_msg === fix + "출석") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.Attendance(_room));
        _replier.reply(charactor_Manager.Calendar(_room));
    }
    else if(_msg.indexOf(fix + "소환사등록") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "소환사등록 [타입]");
            return;
        }

        param = changeSummonType(splitMsg[1]);
        if(param === "") {
            _replier.reply("소환계통명이 이상합니다. 다시 시도하시기 바랍니다. ex> " + fix + "소환사등록 [타입]");
            return;
        }

        _replier.reply(charactor_Manager.EnrollSummoner(_room, param));
    }
    else if(_msg.indexOf(fix + "계통변경") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "계통변경 [타입]");
            return;
        }

        param = changeSummonType(splitMsg[1]);
        if(param === "") {
            _replier.reply("소환계통명이 이상합니다. 다시 시도하시기 바랍니다. ex> " + fix + "계통변경 [타입]");
            return;
        }

        _replier.reply(charactor_Manager.TypeChangeSummoner(_room, param));
    }

    else if(_msg === fix + "작가등록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(charactor_Manager.EnrollWriter(_room));
    }
    else if(_msg === fix + "내글목록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        _replier.reply(library.getMyBookList(_room));
    }
    else if(_msg.indexOf(fix + "새글") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "새글 [책제목]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(library.NewBook(name, _room));
    }
    else if(_msg.indexOf(fix + "글쓰기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(_msg.length <= 4){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "글쓰기 [글 내용]");
            return;
        }

        str = _msg.substring(4, _msg.length);

        if(str.length >= 490) {
            _replier.reply("한번에 쓸수 있는 내용은 최대 490자 이내 입니다. (카카오톡의 한계로 인하여 ㅜㅜ)");
        }
        else {
            _replier.reply(library.Writing(_room, str));
        }
    }
    else if(_msg.indexOf(fix + "불러오기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "불러오기 [책 제목]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(library.Loading(_room, name));
    }
    else if(_msg === fix + "글삭제") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;
        _replier.reply(library.Deleting(_room));
    }
    else if(_msg.indexOf(fix + "책제거") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "책제거 [책 제목]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(library.Removing(_room, name));
    }
    else if(_msg.indexOf(fix + "검수등록") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "검수등록 [책 제목]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(library.Uploading(_room, name));
    }
    else if(_msg.indexOf(fix + "내글보기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkWriter(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "내글보기 [책 제목]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(library.Looking(_room, name));
    }

    else if(_msg === fix + "검수") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkLibrarian(_room, _replier))return;

        _replier.reply(library.Checking(_room));
    }
    else if(_msg.indexOf(fix + "패스") === 0 || _msg.indexOf(fix + "리젝") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        else if(!checkLibrarian(_room, _replier))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "패스 [코멘트] or " + fix + "리젝 [코멘트(리젝사유)]");
            return;
        }

        if(splitMsg[0] === fix + "패스")
            param = true;
        else
            param = false;

        effect = _msg.substring(splitMsg[0].length + 1, _msg.length);

        _replier.reply(library.Resulting(_room, param, effect));
    }

    else if(_msg.indexOf(fix + "작가검색") === 0 || _msg.indexOf(fix + "제목검색") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "작가검색 [ID] or " + fix + "제목검색 [책 제목]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        if(splitMsg[0] === fix + "작가검색")
            param = "writer";
        else
            param = "title";

        _replier.reply(library.Searching(_room, name, param));
    }
    else if(_msg.indexOf(fix + "열람") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "열람 [책 제목]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(library.Opening(_room, name));
    }

    else if(_msg === fix + "파티") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(party_Manager.MyPartyInfo(_room));
    }
    else if(_msg === fix + "파티목록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(party_Manager.getPartyList());
    }
    else if(_msg.indexOf(fix + "파티생성") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "파티생성 [파티 이름]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(party_Manager.MakeParty(_room, name));
    }
    else if(_msg === fix + "파티해산") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(party_Manager.RemoveParty(_room));
    }
    else if(_msg.indexOf(fix + "파티신청") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "파티신청 [파티 이름]");
            return;
        }
        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(party_Manager.requestParty(_room, name));
    }
    else if(_msg.indexOf(fix + "파티수락") === 0 || _msg.indexOf(fix + "파티거절") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        response = ((splitMsg[0] === fix + "파티수락")?true:false);

        if(splitMsg.length < 2){
            _replier.reply("유저명을 입력해주시기 바랍니다. ex> " + fix + "파티수락 [유저명] or " + fix + "파티거절 [유저명]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);

        if(charactor_Manager.IsDungeon(_room, "dungeon")) {
            _replier.reply("던전 진입중에 파티원을 받거나 거절할 수 없습니다.");
        }
        else if(charactor_Manager.IsDungeon(_room, "occupy")) {
            _replier.reply("점령전 중에 파티원을 받거나 거절할 수 없습니다.");
        }
        else {
            _replier.reply(party_Manager.Response(_room, response, name));
        }
        
    }
    else if(_msg.indexOf(fix + "파티강퇴") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");

        if(splitMsg.length < 2){
            _replier.reply("유저명을 입력해주시기 바랍니다. ex> " + fix + "파티강퇴 [유저명]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(party_Manager.Ban(_room, name));
    }
    else if(_msg.indexOf(fix + "파티장양도") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");

        if(splitMsg.length < 2){
            _replier.reply("유저명을 입력해주시기 바랍니다. ex> " + fix + "파티장양도 [유저명]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(party_Manager.ChangeCaptain(_room, name));
    }
    else if(_msg === fix + "파티탈퇴") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        charactor_Manager.outDungeon(_room);
        _replier.reply(party_Manager.Leave(_room));
    }

    else if(_msg === fix + "계좌개설") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(stock_Manager.MakeAccount(_room));
    }
    else if(_msg === fix + "내계좌") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(stock_Manager.MyAccount(_room));
    }
    else if(_msg.indexOf(fix + "주식구매") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply(stock_Manager.ShowStockList(_room) + "\n사용법 : " + fix + "주식구매 [주식 갯수] [주식명]");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = "1";
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }

        _replier.reply(stock_Manager.PurchaseStock(_room, ChangeNumber(count), itemName));
    }
    else if(_msg.indexOf(fix + "주식판매") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply(stock_Manager.MyAccount(_room) + "\n\n사용법 : " + fix + "주식판매 [주식 갯수] [주식명]");
            return;
        }
        count = splitMsg[1];
        if(!checkNumberic(count)) {
            count = "1";
            itemName = _msg.substring(splitMsg[0].length + 1, _msg.length);
        }
        else {
            itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);
        }
        _replier.reply(stock_Manager.SaleStock(_room, ChangeNumber(count), itemName));
    }
    else if(_msg === fix + "배당정산") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        _replier.reply(stock_Manager.CalcDividend(_room));
    }

    else if(_msg === fix + "던전진입") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.InDungeon(_room, party_Manager.getPartyMembers(_room)));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 던전에 진입할 수 없습니다.");
        }
    }
    else if(_msg === fix + "던전") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.DungeonInfo(_room, party_Manager.getCaptain(_room), false));
    }
    else if(_msg === fix + "던전포기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.GiveupDungeon(_room, party_Manager.getPartyMembers(_room), false));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 던전을 포기할 수 없습니다.");
        }
    }
    else if(_msg === fix + "던전전투") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.FightDungeon(_room, party_Manager.getPartyMembers(_room), false, clan_Manager));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 던전 전투를 할 수 없습니다.");
        }
    }
    else if(_msg.indexOf(fix + "던전이동") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("이동할 맵의 번호를 말씀하시기 바랍니다. ex> " + fix + "던전이동 [맵번호]");
            return;
        }

        idx = ChangeNumber(splitMsg[1]);
        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.MoveDungeon(_room, idx, party_Manager.getPartyMembers(_room), false));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 던전 이동을 할 수 없습니다.");
        }
    }

    else if(_msg === fix + "점령하기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.Occupy(_room, party_Manager.getPartyMembers(_room), clan_Manager.getOpenClan()));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 점령하기 명령어를 수행할 수 없습니다.");
        }
    }
    else if(_msg === fix + "점령지") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(charactor_Manager.DungeonInfo(_room, party_Manager.getCaptain(_room), true));
    }
    else if(_msg === fix + "점령지포기") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.GiveupDungeon(_room, party_Manager.getPartyMembers(_room), true));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 점령지를 포기할 수 없습니다.");
        }
    }
    else if(_msg === fix + "점령지전투") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;
        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.FightDungeon(_room, party_Manager.getPartyMembers(_room), true, clan_Manager));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 점려지 전투를 할 수 없습니다.");
        }
    }
    else if(_msg.indexOf(fix + "점령지이동") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("이동할 맵의 번호를 말씀하시기 바랍니다. ex> " + fix + "점령지이동 [맵번호]");
            return;
        }

        idx = ChangeNumber(splitMsg[1]);
        if(party_Manager.isCaptain(_room)) {
            _replier.reply(charactor_Manager.MoveDungeon(_room, idx, party_Manager.getPartyMembers(_room), true));
        }
        else {
            _replier.reply("당신은 파티장이 아님으로 점령지 이동을 할 수 없습니다.");
        }
    }

    else if(_msg === fix + "덱목록") {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        _replier.reply(cardbattle_Manager.DeckList(_room));
    }
    else if(_msg.indexOf(fix + "덱만들기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "덱만들기 [덱 이름]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(cardbattle_Manager.MakeDeck(_room, name));
    }
    else if(_msg.indexOf(fix + "덱삭제") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "덱삭제 [덱 이름]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(cardbattle_Manager.RemoveDeck(_room, name));
    }
    else if(_msg.indexOf(fix + "덱") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 2){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "덱 [덱 이름]");
            return;
        }

        name = _msg.substring(splitMsg[0].length + 1, _msg.length);
        _replier.reply(cardbattle_Manager.Deck(_room, name));
    }
    else if(_msg.indexOf(fix + "카드넣기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "카드넣기 [덱인덱스] [카드 이름]");
            return;
        }
        idx = splitMsg[1];
        if(!checkNumberic(idx)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "카드넣기 [덱인덱스] [카드 이름]");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(cardbattle_Manager.InCard(_room, ChangeNumber(idx), itemName));
    }
    else if(_msg.indexOf(fix + "카드빼기") === 0) {
        if(!checkCharactor(_room, _replier, _sender, _image))return;

        splitMsg = _msg.split(" ");
        if(splitMsg.length < 3){
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "카드넣기 [덱인덱스] [카드 이름]");
            return;
        }
        idx = splitMsg[1];
        if(!checkNumberic(idx)) {
            _replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "카드넣기 [덱인덱스] [카드 이름]");
            return;
        }
        itemName = _msg.substring(splitMsg[0].length + splitMsg[1].length + 2, _msg.length);

        _replier.reply(cardbattle_Manager.OutCard(_room, ChangeNumber(idx), itemName));
    }
    
    CheckQuest(_room, _sender, _msg, _image, _replier);
    CheckClanOccupyTime();
    CheckWorldBossSummonTime();
    homework_Manager.checkResetTime();
}

function CheckQuest(_room, _sender, _msg, _image, _replier) {
    if(_msg.indexOf(fix) === 0 && checkCharactorNoRelay(_room, _sender, _image)) {
        str = charactor_Manager.CommandQuest(_room, _msg);
        if(str !== "") {
            _replier.reply("[완료된 퀘스트]\n\n" + str);
        }
    }
}
function CheckClanOccupyTime() {
    if(!libCommon.OccupyIncludeTime()) {
        clan_Manager.removeAllConquestLock();
    }
}
function CheckWorldBossSummonTime() {
    var rtnText = charactor_Manager.checkAutoSummon();

    if(rtnText !== null && rtnText !== "") {
        libCommon.AlarmMainRoom(rtnText);
    }
}

function checkNumberic(_num) {
    //숫자검사 && 양수검사
    return !isNaN(_num) && (Number(_num) >= 1);
}
function checkNumbZero(_num) {
    //숫자검사 && 제로검사
    return !isNaN(_num) && (Number(_num) === 0);
}
function ChangeNumber(_num) {
    if(checkNumberic(_num))
        return Math.floor(Number(_num));
    else
        return 1;
}
function checkLogin(_room, _replier, _sender, _image) {
    if(login_Manager.islogin(_room)) {
        if(login_Manager.comparekey(_room, _sender, _image)) {
            return true;
        }
        else if(login_Manager.checkSubRoomWithoutRoomname(_sender, _image)) {
            return true;
        }
        else {
            _replier.reply("키 값이 맞지 않습니다.");
            return false;
        }
    }
    else {
        _replier.reply("로그인하시기 바랍니다.");
        return false;
    }
}
function checkLoginNoReply(_room, _sender, _image) {
    if(login_Manager.islogin(_room)) {
        if(login_Manager.comparekey(_room, _sender, _image)) {
            return true;
        }
        else if(login_Manager.checkSubRoomWithoutRoomname(_sender, _image)) {
            return true;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
function setDuplication(_room, _replier, _use) {
    for(var idx = 0; idx < PlayingList.length; ++idx)
    {
        if(_room === PlayingList[idx].room) {
            PlayingList[idx].flag = _use;
            if(_use === "Y"){
                PlayingList[idx].time = (new Date()).getTime();
                if(libConst.ProtectMacro)
                    PlayingList[idx].count++;
            }
            else {
                if(libConst.TimeStempFlag)
                    _replier.reply("수행시간 : " + Math.floor(((new Date()).getTime() - PlayingList[idx].time) / 1000) + "초 소모");
                if(libConst.ProtectMacro && libConst.MacroMaxCount <= PlayingList[idx].count) {
                    PlayingList[idx].macro = mkMacroCode();
                    _replier.reply("매크로 코드를 입력하시기 바랍니다. \n\n  - 입력방법 : " + fix + "(코드)\n\n  - 매크로 코드 : \n\n" + mkDigital(PlayingList[idx].macro) + libConst.dummy);
                }
            }
            return;
        }
    }

    PlayingList.push({room:_room, flag:_use, time:(new Date()).getTime(), count:1, macro:""} );
}
function checkDuplication(_room) {
    var rtn = false;
    for(var idx = 0; idx < PlayingList.length; ++idx)
    {
        if(_room === PlayingList[idx].room) {
            if((new Date()).getTime() - PlayingList[idx].time >= libConst.CommandLockTime) {
                rtn = false;
            }
            else {
                if(PlayingList[idx].flag === "Y")
                    rtn = true;
                else
                    rtn = false;
            }
            break;
        }
    }
    return rtn;
}
function checkMacro(_room, _msg) {
    var rtn = "";
    for(var idx = 0; idx < PlayingList.length; ++idx)
    {
        if(_room === PlayingList[idx].room) {
            if(PlayingList[idx].macro === "") {
            }
            else if((fix + PlayingList[idx].macro) === _msg) {
                PlayingList[idx].macro = "";
                PlayingList[idx].count = 0;
                rtn = "complate";
            }
            else {
                rtn = PlayingList[idx].macro;
            }
            break;
        }
    }
    return rtn;
}
function mkMacroCode(){
    var result = "", r;
    var count = (libConst.MacroCodeLength > 4?4:libConst.MacroCodeLength);
    for(var i = 0; i < count; ++i) {
        r = libCommon.Rand(0, CharList.length - 1);
        result += CharList[r];
    }

    return result;
}
function checkCharactor(_room, _replier, _sender, _image) {
    if(!checkLogin(_room, _replier, _sender, _image))
        return false;

    if(charactor_Manager.isMyCharactor(_room)){
        switch(charactor_Manager.isCompliteMaking(_room))
        {
            case libObject.ENUM_MAKE_CHARACTOR.START:
            case libObject.ENUM_MAKE_CHARACTOR.MAKING:
                _replier.reply("캐릭을 생성중에 있습니다. 마무리 하시기 바랍니다.");
                return false;
            case libObject.ENUM_MAKE_CHARACTOR.COMPLITE:
                return true;
            default:
                _replier.reply("캐릭 생성 error 관리자에게 문의하시기 바랍니다.");
                return false;
        }
    }
    else {
        _replier.reply("캐릭을 생성하시기 바랍니다.");
        return false;
    }
}
function checkCharactorNoRelay(_room, _sender, _image) {
    if(!checkLoginNoReply(_room, _sender, _image))
        return false;

    if(charactor_Manager.isMyCharactor(_room)){
        switch(charactor_Manager.isCompliteMaking(_room))
        {
            case libObject.ENUM_MAKE_CHARACTOR.START:
            case libObject.ENUM_MAKE_CHARACTOR.MAKING:
                return false;
            case libObject.ENUM_MAKE_CHARACTOR.COMPLITE:
                return true;
            default:
                return false;
        }
    }
    else {
        return false;
    }
}
function mkDigital(_number) {
    var result = "";
    var map = libConst.DigitalNumber;
    var count = (libConst.MacroCodeLength > 4?4:libConst.MacroCodeLength);
    for(var i = 0; i < 5; ++i) {
        for(var j = 0; j < count; ++j){
              result += map["_"+_number[j]][i] + " ";
        }
        result += "\n";
    }

    result = result.replace(/□/g, "░").replace(/■/g, "█");
    return result;
}
function checkWriter(_id, _replier) {
    if(!charactor_Manager.isWriter(_id)) {
        _replier.reply("작가 권한이 없습니다.\n작가 권한을 획득 후 사용하시기 바랍니다.");
        return false;
    }
    return true;
}
function checkLibrarian(_id, _replier) {
    var lib = appoint_Manager.getIDList(appoint_Manager.TYPE.Labrarian);
    if(lib.indexOf(_id) === -1) {
        _replier.reply("사서 권한이 없습니다.\n운영자에게서 사서 권한을 받은 후 사용하시기 바랍니다.");
        return false;
    }
    return true;
}
function changeSummonType(_Text) {
    var rtnStr = "";
    switch(_Text) {
        case "원소계통":
            rtnStr = "element";
            break;
        case "자연계통":
            rtnStr = "animal";
            break;
        case "신성계통":
            rtnStr = "divine";
            break;
        case "혼돈계통":
            rtnStr = "chaos";
            break;
        default:
            parartnStrm = "";
            break;
    }

    return rtnStr;
}

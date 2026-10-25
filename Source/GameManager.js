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


importPackage(android.widget);
importPackage(android.view);
importPackage(android.text);
importPackage(android.graphics);
importPackage(java.io);

const Master = "김명진";
const fix = "!";
var Thread_Queue = [];
var SleepFolder = "SleepAccount/";
var CompileList = ["Const.js", "Common.js", "Helper.js", "DataBase.js", "Object.js",
                  "RelationManager.js", "RecordManager.js", "MercenaryManager.js", "ExplorerManager.js", "StockManager.js",
                  "LoginManager.js", "WorldBossManager.js", "BattleManager.js", "Hunting.js", "PartyManager.js", "ETCManager.js", "MyHomeManager.js",
                  "CharactorManager.js", "ExchangeManager.js", "FishingManager.js", "PetManager.js", "GambleManager.js", "CardBattleManager.js",
                  "ClanManager.js", "Main.js"];

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
                       SleepMatchingTable:"Setting/MatchingTable.txt",
                       UserStockList:"Charactor/UserStockList.txt",
                       CurrentStock:"Users/CurrentStock.txt",
                       HomeworkList:"Charactor/HomeworkList.txt",
                       CardDeckList:"Charactor/CardDeckList.txt"
                    };

const DBNameList = { Species:"DB/Species.txt",
                    WearItem:"DB/WearItem.txt",
                    SundryItem:"DB/SundryItem.txt",
                    FunctionalityItem:"DB/FunctionalityItem.txt",
                    Monster:"DB/Monster.txt",
                    Nation:"DB/Nation.txt",
                    City:"DB/City.txt",
                    Facility:"DB/Facility.txt",
                    Field:"DB/Field.txt",
                    Dungeon:"DB/Dungeon.txt",
                    DungeonMap:"DB/DungeonMap.txt", 
                    Skill:"DB/Skill.txt",
                    Menufacture:"DB/Menufacture.txt",
                    HighMenufacture:"DB/HighMenufacture.txt",
                    Sale:"DB/Sale.txt",
                    Skillsale:"DB/Skillsale.txt",
                    Cc:"DB/CC.txt",
                    Mercenary:"DB/Mercenary.txt",
                    Hire:"DB/Hire.txt",
                    Property:"DB/Property.txt",
                    WorldBoss:"DB/WorldBoss.txt",
                    WorldBossLoc:"DB/WorldBossLoc.txt",
                    Mine:"DB/Mine.txt",
                    Analyze:"DB/Analyze.txt",
                    Person:"DB/Person.txt",
                    Quest:"DB/Quest.txt",
                    Conversation:"DB/Conversation.txt",
                    ClanBuff:"DB/ClanBuff.txt",
                    NationMove:"DB/NationMove.txt",
                    Loan:"DB/Loan.txt",
                    Deposit:"DB/Deposit.txt",
                    Camping:"DB/Camping.txt",
                    Alchemy:"DB/Alchemy.txt",
                    OriginChar:"DB/OriginChar.txt",
                    Exchange:"DB/Exchange.txt",
                    BattleBuff:"DB/BattleBuff.txt",
                    Strength:"DB/Strength.txt",
                    StrengthList:"DB/StrengthList.txt",
                    Decompose:"DB/Decompose.txt",
                    PetFamily:"DB/PetFamily.txt",
                    PetBuff:"DB/PetBuff.txt",
                    Tower:"DB/Tower.txt",
                    TowerMob:"DB/TowerMob.txt",
                    Tree:"DB/Tree.txt",
                    Stone:"DB/Stone.txt",
                    Getting:"DB/Getting.txt",
                    Building:"DB/Building.txt",
                    Request:"DB/Request.txt",
                    Recipe:"DB/Recipe.txt",
                    Fish:"DB/Fish.txt",
                    Fishing:"DB/Fishing.txt",
                    SaleCoin:"DB/SaleCoin.txt",
                    Attendance:"DB/Attendance.txt",
                    SummonSkill:"DB/SummonSkill.txt",
                    SummonMonster:"DB/SummonMonster.txt",
                    Summonsale:"DB/Summonsale.txt",
                    SaleCapital:"DB/SaleCapital.txt",
                    Stock:"DB/Stock.txt",
                    News:"DB/News.txt",
                    RandBox:"DB/RandBox.txt",
                    Tutorial:"DB/Tutorial.txt",
                    Package:"DB/Package.txt"};

const EventParam = {
    DropRune:{rate:2, onoff:false},
    DropItemRate:{rate:2, onoff:false},
    TargetEvent:[
    ]
}; // true는 on, false는 off
const EventObj = {
    name:"",
    description:"",
    moblist:[], // [{index, rate}, ....  ] or [{index:"all", rate}, ....  ]
    item:{index:"", kind:"", count:0, strength:0},
    onoff:false
};

var database = (function Database() {
    var DB = {};

    var _LoadData;
    _LoadData = function() {
        DB.WEARITEM = Read(DBNameList["WearItem"]);
        DB.SUNDRYITEM = Read(DBNameList["SundryItem"]);
        DB.FUNCTIONALITYITEM = Read(DBNameList["FunctionalityItem"]);
        DB.MONSTER = Read(DBNameList["Monster"]);
    }();

    return DB;
})();

var post_manager = (function() {
    const Charactor_fileName = fileNameList.CharactorList;
    const Post_fileName = fileNameList.PostList;
    const ITEM_KIND = {WEARITEM:"WearItem", SUNDRYITEM:"SundryItem", FUNCTIONALITYITEM:"FunctionalityItem"};

    var DB = database;
    var PostList = []; // {name, items[{kind, index, count, name}.... ], rune, message,}
    var CharList = [];

    var _LoadData, _Find, _FindCharactor, _FindItem, _Remove, _RemoveByID;

    _LoadData = function() {
        PostList = Read(Post_fileName);
    }();

    _Find = function(_id) {
        var rtnArray = [];
        var tmpPost = null;
        var tmpObj, tmpArray;
        for(var i = 0; i < PostList.length; ++i) {
            tmpPost = PostList[i];

            if(tmpPost.name === _id) {
                rtnArray.push(tmpPost);
            }
        }
        return rtnArray;
    };
    _FindCharactor = function(_id) {
        _id = String(_id); // 화면 버튼에서 넘어온 값은 자바 String 이라 === 비교가 안 되므로 JS 문자열로 바꾼다
        CharList = Read(Charactor_fileName);
        var rtnObj = null;
        var tmpChar = null;
        for(var i = 0; i < CharList.length; ++i) {
            tmpChar = CharList[i];

            if(tmpChar.name === _id) {
                return true;
            }
        }
        return false;
    };
    _FindItem = function(_itemname) {
        var rtnObj = {kind:"", index:"", name:""};
        var tmpitem = null;
        for(var i = 0; i < DB.FUNCTIONALITYITEM.length; ++i) {
            tmpitem = DB.FUNCTIONALITYITEM[i];
            if(tmpitem.name === _itemname) {
                rtnObj.kind = ITEM_KIND.FUNCTIONALITYITEM;
                rtnObj.index = tmpitem.index;
                rtnObj.name = _itemname;
                return rtnObj;
            }
        }
        for(i = 0; i < DB.WEARITEM.length; ++i) {
            tmpitem = DB.WEARITEM[i];
            if(tmpitem.name === _itemname) {
                rtnObj.kind = ITEM_KIND.WEARITEM;
                rtnObj.index = tmpitem.index;
                rtnObj.name = _itemname;
                return rtnObj;
            }
        }
        for(i = 0; i < DB.SUNDRYITEM.length; ++i) {
            tmpitem = DB.SUNDRYITEM[i];
            if(tmpitem.name === _itemname) {
                rtnObj.kind = ITEM_KIND.SUNDRYITEM;
                rtnObj.index = tmpitem.index;
                rtnObj.name = _itemname;
                return rtnObj;
            }
        }

        return rtnObj;
    };
    _Remove = function(_tokenid) {
        var result = false;
        var tmpPost = null;
        for(var i = 0; i < PostList.length; ++i) {
            tmpPost = PostList[i];

            if(tmpPost.tokenid === _tokenid) {
                PostList.splice(i, 1);
                result = true;
                break;
            }
        }

        return result;
    };
    _RemoveByID = function(_id) {
        var result = false;
        var tmpPost = null;
        for(var i = PostList.length - 1; i >= 0; --i) {
            tmpPost = PostList[i];

            if(tmpPost.name === _id) {
                PostList.splice(i, 1);
                result = true;
            }
        }

        return result;
    };

    return {
        getPostList:function() {
            return PostList;
        },
        getPostListByID:function(_id) {
            return _Find(_id);
        },
        mkItemObj:function(_itemname, _count) {
            var itemObj = _FindItem(_itemname);
            itemObj.count = Number(_count);

            return itemObj;
        },
        postMsg:function(_id, _itemList, _rune, _message) {
            var d = new Date();
            PostList.push({name:_id, items:_itemList, rune:_rune, message:_message, tokenid:d.getTime()});
            Write(Post_fileName, PostList);
        },
        removeMsg:function(_tokenid) {
            var rtn = _Remove(_tokenid);
            Write(Post_fileName, PostList);
            return rtn;
        },
        removeMsgAll:function(_id) {
            var rtn = _RemoveByID(_id);
            Write(Post_fileName, PostList);
            return rtn;
        },
        isCharactorName:function(_username) {
            return _FindCharactor(_username);
        },
        getAllUser:function() {
            CharList = Read(Charactor_fileName);
            var rtnArray = [];
            for(var i = 0; i < CharList.length; ++i) {
                rtnArray.push(CharList[i].name);
            }
            return rtnArray;
        }
    };
})();

var appoint_manager = (function() {
    const JOB = fileNameList.Job;
    const Charactor_fileName = fileNameList.CharactorList;
    const TYPE_SubMaster = 1;
    const TYPE_Labrarian = 2;

    var m_jobList;
    var _LoadData, _Find, _FindIndex, _FindListByType;

    _LoadData = function() {
        m_jobList = Read(JOB);
    }();

    _Find = function(_name, _type) {
        for(var i = 0; i < m_jobList.length; ++i) {
            if(m_jobList[i].name === _name && m_jobList[i].type === _type) {
                return m_jobList[i];
            }
        }
        return null;
    };
    _FindIndex = function(_name, _type) {
        for(var i = 0; i < m_jobList.length; ++i) {
            if(m_jobList[i].name === _name && m_jobList[i].type === _type) {
                return i;
            }
        }
        return -1;
    };
    _FindListByType = function(_type) {
        var rtnarray = [];
        for(var i = 0; i < m_jobList.length; ++i) {
            if(m_jobList[i].type === _type) {
                rtnarray.push(m_jobList[i].name);
            }
        }
        return rtnarray;
    };

    return {
        TYPE:{SubMaster:TYPE_SubMaster, Labrarian:TYPE_Labrarian},
        getJobList:function() {
            return m_jobList;
        },
        addJobList:function(_name, _type) {
            var charList = Read(Charactor_fileName);
            var job = _Find(_name, _type);
            var flag = false, json;

            if(job === null) {
                for(var i = 0; i < charList.length; ++i) {
                    if(charList[i].name === _name) {
                        json = {name : _name, type:_type};
                        flag = true;
                        break;
                    }
                }

                if(flag) {
                    m_jobList.push(json);
                    Write(JOB, m_jobList);
                }
            }

            return flag;
        },
        removeJobList:function(_name, _type) {
            var idx = _FindIndex(_name, _type);
            if(idx !== -1) {
                m_jobList.splice(idx,1);
                Write(JOB, m_jobList);
                return true;
            }

            return false;
        },
        getIDList:function(_type) {
            return _FindListByType(_type);
        },
        replyLibrarian:function(_msg) {
            var list = _FindListByType(TYPE_Labrarian);
            for(var i = 0; i < list.length; ++i) {
                replyID(list[i], _msg);
            }
        }
    };
})();

var event_manager = (function EventManager() {
    var m_EventObj = null;

    var _LoadData, _Find, _Save, _FindItem, _FindItemByName, _FindMob, _FindMobByName;
    var DB = database;

    const EVENT_KIND = {DROPRUNE:"DropRune", DROPITEMRATE:"DropItemRate", TARGETEVENT:"TargetEvent" };
    const ITEM_KIND = {WEARITEM:"WearItem", SUNDRYITEM:"SundryItem", FUNCTIONALITYITEM:"FunctionalityItem"};


    _LoadData = function() {
        m_EventObj = Read(fileNameList["Event"]);
        if(m_EventObj === null || m_EventObj === undefined || m_EventObj === "" || m_EventObj.DropRune === undefined) {
            m_EventObj = JSON.parse(JSON.stringify(EventParam));
            _Save();
        }
    };

    _Find = function(_idx) {
        return m_EventObj.TargetEvent[Number(_idx)];
    };

    _FindItem = function(_idx, _kind) {
        var tmpitem = null;
        var kind = "";

        if(_kind === ITEM_KIND.FUNCTIONALITYITEM) {
            kind = "FUNCTIONALITYITEM";
        }
        else if(_kind === ITEM_KIND.SUNDRYITEM) {
            kind = "SUNDRYITEM";
        }
        else if(_kind === ITEM_KIND.WEARITEM) {
            kind = "WEARITEM";
        }

        if(kind !== "") {
            for(var i = 0; i < DB[kind].length; ++i) {
                tmpitem = DB[kind][i];
                if(tmpitem.index === _idx) {
                    return tmpitem;
                }
            }
        }

        return tmpitem;
    };
    _FindItemByName = function(_name) {
        var rtnObj = {kind:"", obj:null};
        var kind = "", i;

        rtnObj.kind = "WearItem";
        for(i = 0; i < DB["WEARITEM"].length; ++i) {
            tmpitem = DB["WEARITEM"][i];
            if(tmpitem.name === _name) {
                rtnObj.obj = tmpitem;
                return rtnObj;
            }
        }
        rtnObj.kind = "SundryItem";
        for(i = 0; i < DB["SUNDRYITEM"].length; ++i) {
            tmpitem = DB["SUNDRYITEM"][i];
            if(tmpitem.name === _name) {
                rtnObj.obj = tmpitem;
                return rtnObj;
            }
        }

        rtnObj.kind = "FunctionalityItem";
        for(i = 0; i < DB["FUNCTIONALITYITEM"].length; ++i) {
            tmpitem = DB["FUNCTIONALITYITEM"][i];
            if(tmpitem.name === _name) {
                rtnObj.obj = tmpitem;
                return rtnObj;
            }
        }

        return rtnObj;
    };

    _FindMob = function(_idx) {
        var tmpmob = null;
        for(var i = 0; i < DB["MONSTER"].length; ++i) {
            tmpmob = DB["MONSTER"][i];
            if(tmpmob.index === _idx) {
                return tmpmob;
            }
        }
        return null;
    };
    _FindMobByName = function(_name) {
        var tmpmob = null;
        for(var i = 0; i < DB["MONSTER"].length; ++i) {
            tmpmob = DB["MONSTER"][i];
            if(tmpmob.name === _name) {
                return tmpmob;
            }
        }
        return null;
    };

    _Save = function() {
        Write(fileNameList["Event"], m_EventObj);
    };

    _LoadData();

    return {
        DROPRUNE:EVENT_KIND.DROPRUNE,
        DROPITEMRATE:EVENT_KIND.DROPITEMRATE,
        TARGETEVENT:EVENT_KIND.TARGETEVENT,
        setDropRuneRate:function(_rate){
            m_EventObj.DropRune.rate = Number(_rate);
            _Save();
        },
        onDropRuneRate:function(_onoff){
            m_EventObj.DropRune.onoff = _onoff;
            _Save();
        },
        getDropRuneRate:function() {
            if(m_EventObj.DropRune.onoff)
                return m_EventObj.DropRune.rate - 1;
            else
                return 0;
        },
        setDropItemRate:function(_rate){
            m_EventObj.DropItemRate.rate = Number(_rate);
            _Save();
        },
        onDropItemRate:function(_onoff){
            m_EventObj.DropItemRate.onoff = _onoff;
            _Save();
        },
        getDropItemRate:function() {
            if(m_EventObj.DropItemRate.onoff)
                return m_EventObj.DropItemRate.rate - 1;
            else
                return 0;
        },
        getEvent:function(_kind) {
            return m_EventObj[_kind];
        },
        setTargetEvent:function(_name) {
            var obj = JSON.parse(JSON.stringify(EventObj));
            obj.name = _name;

            m_EventObj.TargetEvent.push(obj);
            _Save();
        },
        removeTargetEvent:function(_index) {
            m_EventObj.TargetEvent.splice(_index, 1);
            _Save();
        },
        onTargetEvent:function(_index) {
            var events = _Find(_index);

            events.onoff = true;
            _Save();
        },
        offTargetEvent:function(_index) {
          var events = _Find(_index);

          events.onoff = false;
          _Save();
        },
        setTargetDesc:function(_index, _desc) {
            var events = _Find(_index);
            if(events === undefined || events === null) {
                return false;
            }

            events.description = _desc;
            _Save();

            return true;
        },
        setTargetItem:function(_index, _count, _name) {
            var events = _Find(_index);
            var spl_item = _name.split("+");
            var itemname = "", strength = "0";
            if(events === undefined || events === null) {
                return false;
            }

            if(spl_item.length > 1)
                strength = spl_item[1];
            else
                strength = "0";
            itemname = spl_item[0];

            var item = _FindItemByName(itemname);

            if(item.obj === null) {
                return false;
            }

            events.item = {index:item.obj.index, kind:item.kind, count:_count, strength:(item.kind==="WearItem"?strength:"0")};
            _Save();

            return true;
        },
        setTargetMonster:function(_index, _rate, _name) {
            var events = _Find(_index);
            var obj, findIdx = -1;
            if(events === undefined || events === null) {
                return false;
            }

            var mob = _FindMobByName(_name);

            if(_name !== "all") {
                if(mob === null) {
                    return false;
                }
            }

            for(i = 0; i < events.moblist.length; ++i) {
                obj = events.moblist[i];

                if(_name === "all") {
                    if(obj.index === _name) {
                        findIdx = i;
                        break;
                    }
                }
                else {
                    if(obj.index === mob.index) {
                        findIdx = i;
                        break;
                    }
                }
            }

            if(findIdx === -1)
                events.moblist.push({index:(_name==="all"?_name:mob.index), rate:_rate});
            else
                events.moblist[findIdx] = {index:(_name==="all"?_name:mob.index), rate:_rate};
            _Save();

            return true;
        },
        removeTargetMonster:function(_index, _name) {
            var events = _Find(_index);
            var obj;
            if(events === undefined || events === null) {
                return false;
            }

            var mob = _FindMobByName(_name);

            if(_name !== "all") {
                if(mob === null) {
                    return false;
                }
            }

            for(i = 0; i < events.moblist.length; ++i) {
                obj = events.moblist[i];

                if(_name === "all") {
                    if(obj.index === _name) {
                        events.moblist.splice(i,1);
                        _Save();
                        return true;
                    }
                }
                else {
                    if(obj.index === mob.index) {
                        events.moblist.splice(i,1);
                        _Save();
                        return true;
                    }
                }
            }
            return false;
        },
        findItem:_FindItem,
        findMob:_FindMob,
        Save:_Save

    };
})();

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    // 카카오톡 알림 구조는 Wisp 가 읽어 response() 로 넘겨준다. 여기서는 메시지만 처리한다
    onMessage(room, msg, sender, isGroupChat, replier, imageDB, packageName);
}
function onMessage(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    var subMaster = appoint_manager.getIDList(appoint_manager.TYPE.SubMaster);

    if(msg === fix + "방") {
        replier.reply("방이름 : " + room + "\n" +
                       "메시지 보낸사람 : " + sender + "\n" +
                       "앱 패키지명 : " + packageName + "\n" +
                       "그룹 채팅 여부 : " + isGroupChat
                     );
        return;
    }

    if(sender !== Master || room !== Master) {
        if(subMaster.indexOf(sender) === -1 || subMaster.indexOf(room) === -1) {
            return;
        }
    }

    var splitMsg, userList, rtnStr, i, j, item, name, result, type, rate, onoff, rune, obj, list, mob, flag, db, count, evt;

    if(msg === fix + "리로드") {
        if(Api.isOn("Main")) {
            Api.off("Main");
            replier.reply("게임 시스템을 중단합니다.");
        }

        if(Bridge.getScopeOf("Main.js") !== null) {
            var stockMg = Bridge.getScopeOf("Main.js").stock_Manager;
            if(stockMg !== undefined) {
                Api.showToast("리로드1 >> " + room , Toast.LENGTH_SHORT);
                stockMg.CalcStock(room);
                java.lang.Thread.sleep(1000);
            }
        }
        Api.showToast("리로드2 >> " + room , Toast.LENGTH_SHORT);
        startComplie(room);
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 " + fix + "리로드 명령어를 수행하였습니다.");

        Api.on("Main");
        replier.reply("게임 시스템을 시작합니다.");
    }
    else if(msg === fix + "리로드2") {
        if(Api.isOn("Main")) {
            Api.off("Main");
            replier.reply("게임 시스템을 중단합니다.");
        }
        Api.showToast("리로드2 >> " + room , Toast.LENGTH_SHORT);
        startComplie(room);
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 " + fix + "리로드2 명령어를 수행하였습니다.");

        Api.on("Main");
        replier.reply("게임 시스템을 시작합니다.");
    }
    else if(msg === fix + "시작") {
        if(!Api.isOn("Main")) {
            Api.on("Main");
            replier.reply("게임 시스템을 시작합니다.");
        }
        else {
            replier.reply("이미 게임 시스템이 동작중입니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 " + fix + "시작 명령어를 수행하였습니다.");
    }
    else if(msg === fix + "중단") {
        if(Api.isOn("Main")) {
            Api.off("Main");
            replier.reply("게임 시스템을 중단합니다.");
        }
        else {
            replier.reply("이미 게임 시스템이 멈춰 있습니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 " + fix + "중단 명령어를 수행하였습니다.");
    }
    else if(msg === fix + "관리자") {
        var managers = appoint_manager.getJobList();
        var str = "[부관리자]\n";
        for(i = 0; i < managers.length; ++i) {
            if(managers[i].type === appoint_manager.TYPE.SubMaster) {
                str += "  L " + managers[i].name + "\n";
            }
        }
        str += "\n[사서]\n";
        for(i = 0; i < managers.length; ++i) {
            if(managers[i].type === appoint_manager.TYPE.Labrarian) {
                str += "  L " + managers[i].name + "\n";
            }
        }
        replier.reply(str);
    }
    else if(msg.indexOf(fix + "관리자임명") === 0 || msg.indexOf(fix + "사서임명") === 0) {
        if(sender !== Master) {
            replier.reply("게임 마스터만 관리자 임명이 가능합니다.");
            return;
        }

        splitMsg = msg.split(" ");
        if(splitMsg.length < 2){
            replier.reply("사용법 : " + fix + "관리자임명 [게임아이디]");
            return;
        }

        if(splitMsg[0] === fix + "관리자임명") {
            type = appoint_manager.TYPE.SubMaster;
        }
        else {
            type = appoint_manager.TYPE.Labrarian;
        }

        name = msg.substring(msg.indexOf(splitMsg[1]), msg.length);
        result = appoint_manager.addJobList(name, type);
        if(result) {
            replier.reply("임명이 완료되었습니다.");
        }
        else {
            replier.reply("임명이 실패되었습니다.\n\n - 원인 : 게임에 존재하지 않는 아이디 이거나, 이미 임명되어 있을 경우");
        }
    }
    else if(msg.indexOf(fix + "관리자해임") === 0 || msg.indexOf(fix + "사서해임") === 0) {
        if(sender !== Master) {
            replier.reply("게임 마스터만 관리자 해임이 가능합니다.");
            return;
        }

        splitMsg = msg.split(" ");
        if(splitMsg.length < 2){
            replier.reply("사용법 : " + fix + "관리자해임 [게임아이디]");
            return;
        }
        if(splitMsg[0] === fix + "관리자해임") {
            type = appoint_manager.TYPE.SubMaster;
        }
        else {
            type = appoint_manager.TYPE.Labrarian;
        }

        name = msg.substring(msg.indexOf(splitMsg[1]), msg.length);
        result = appoint_manager.removeJobList(name, type);
        if(result) {
            replier.reply("해임이 완료되었습니다.");
        }
        else {
            replier.reply("해임이 실패되었습니다.\n\n - 원인 : 게임에 존재하지 않는 아이디 이거나, 해당 아이디가 관리자가 아닌경우");
        }
    }
    else if(msg.indexOf(fix + "공지") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 2)
            return;

        rtnStr = msg.substring(msg.indexOf(splitMsg[1]), msg.length);

        userList = post_manager.getAllUser();

        for(i = 0; i < userList.length; ++i) {
            replyID(userList[i], "[공지 메시지]\n" + rtnStr);
        }

        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 " + fix + "공지 명령어를 수행\nmsg : " + msg);
    }
    else if(msg.indexOf(fix + "룬드랍이벤") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 3) {
            replier.reply("사용법 : " + fix + "룬드랍이벤 [드랍비율] [켜기 or 끄기]");
            return;
        }

        rate = splitMsg[1];
        onoff = splitMsg[2];

        if(isNaN(rate) && Number(rate) > 0) {
            replier.reply("데이터 중에 드랍비율이 숫자가 아닙니다.");
            return;
        }
        if(onoff !== "켜기" && onoff !== "끄기") {
            replier.reply("데이터 중에 (켜기/끄기) 를 정확히 입력바랍니다.");
            return;
        }

        event_manager.setDropRuneRate(rate);
        event_manager.onDropRuneRate(onoff === "켜기"?true:false);
        replier.reply("이벤트 입력을 완료 하였습니다.");
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "템드랍이벤") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 3) {
            replier.reply("사용법 : " + fix + "템드랍이벤 [드랍비율] [켜기 or 끄기]");
            return;
        }

        rate = splitMsg[1];
        onoff = splitMsg[2];

        if(isNaN(rate) && Number(rate) > 0) {
            replier.reply("데이터 중에 드랍비율이 숫자가 아닙니다.");
            return;
        }
        if(onoff !== "켜기" && onoff !== "끄기") {
            replier.reply("데이터 중에 (켜기/끄기) 를 정확히 입력바랍니다.");
            return;
        }

        event_manager.setDropItemRate(rate);
        event_manager.onDropItemRate(onoff === "켜기"?true:false);
        replier.reply("이벤트 입력을 완료 하였습니다.");
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg === fix + "이벤목록") {
        list = event_manager.getEvent(event_manager.TARGETEVENT);

        rtnStr = "[타겟 이벤 목록]\n\n";
        for(i = 0; i < list.length; ++i) {
            obj = list[i];

            if(obj.item.index === undefined || obj.item.index === null) {
                item = null;
            }
            else {
                item = event_manager.findItem(obj.item.index, obj.item.kind);
            }

            rtnStr += (i+1) + ". " + obj.name + " " + (obj.onoff?"(진행중)":"(종료됨)") + "\n";
            if(obj.description !== "") {
                rtnStr += "  - 설명 : " + obj.description + "\n";
            }

            if(item !== null)
                rtnStr +="   - 아이템 : " + item.name + (obj.item.strength === "0"?"":("+"+obj.item.strength)) + " x" + obj.item.count + "\n";

            rtnStr +="   - 적용몹\n";
            flag = false;
            for(j = 0; j < obj.moblist.length; ++j) {
                mob = obj.moblist[j];
                db = event_manager.findMob(mob.index);
                if(mob.index === "all") {
                    flag = true;
                    continue;
                }

                rtnStr +="      L " + db.name + " (드랍률 : " + mob.rate + "%)\n";
            }

            if(flag) {
                rtnStr +="      L 나머지 몹 (드랍률 : " + mob.rate + "%)\n";
            }
            rtnStr +="\n";
        }
        replier.reply(rtnStr);
    }
    else if(msg.indexOf(fix + "이벤생성") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 2) {
            replier.reply("사용법 : " + fix + "이벤생성 [이벤트명]");
            return;
        }

        name = msg.substring(splitMsg[0].length + 1, msg.length);
        event_manager.setTargetEvent(name);
        replier.reply("이벤트를 추가하였습니다.");
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤삭제") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 2) {
            replier.reply("사용법 : " + fix + "이벤삭제 [이벤트 인덱스]");
            return;
        }

        i = splitMsg[1];
        event_manager.removeTargetEvent(ChangeNumber(i) - 1);
        replier.reply("이벤트를 제거하였습니다.");
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤켜기") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 2) {
            replier.reply("사용법 : " + fix + "이벤켜기 [이벤트 인덱스]");
            return;
        }

        i = splitMsg[1];
        event_manager.onTargetEvent(ChangeNumber(i) - 1);
        replier.reply("해당 이벤트를 시작하였습니다.");
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤끄기") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 2) {
            replier.reply("사용법 : " + fix + "이벤끄기 [이벤트 인덱스]");
            return;
        }

        i = splitMsg[1];
        event_manager.offTargetEvent(ChangeNumber(i) - 1);
        replier.reply("해당 이벤트를 종료하였습니다.");
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤설명") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 3) {
            replier.reply("사용법 : " + fix + "이벤설명 [이벤트 인덱스] [이벤트 설명]");
            return;
        }

        count = splitMsg[1];
        name = msg.substring(splitMsg[0].length + splitMsg[1].length + 2, msg.length);

        if(event_manager.setTargetDesc(ChangeNumber(count) - 1, name)) {
            replier.reply("이벤트 설명를 추가하였습니다.");
        }
        else {
            replier.reply("이벤트 인덱스 범위를 벗어났습니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤아이템") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 4) {
            replier.reply("사용법 : " + fix + "이벤아이템 [이벤트 인덱스] [갯수] [아이템]");
            return;
        }

        i = splitMsg[1];
        count = splitMsg[2];
        name = msg.substring(splitMsg[0].length + splitMsg[1].length + splitMsg[2].length + 3, msg.length);

        if(event_manager.setTargetItem(ChangeNumber(i) - 1, ChangeNumber(count), name)) {
            replier.reply("이벤트 아이템을 추가하였습니다.");
        }
        else {
            replier.reply("문제가 발생하였습니다. 조건들을 다시 확인 하시기 바랍니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤몹추가") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 4) {
            replier.reply("사용법 : " + fix + "이벤몹추가 [이벤트 인덱스] [드랍비율] [몹이름]\n\n  - 드랍비율 : 1.0 ~ 100.0 사이\n  - 몹이름 : 'all' 입력시 특정몹 제외하고 나머지 몹에 적용");
            return;
        }

        i = splitMsg[1];
        rate = splitMsg[2];
        name = msg.substring(splitMsg[0].length + splitMsg[1].length + splitMsg[2].length + 3, msg.length);

        if(event_manager.setTargetMonster(ChangeNumber(i) - 1, ChangeNumber(rate), name)) {
            replier.reply("이벤트 몬스터를 추가하였습니다.");
        }
        else {
            replier.reply("문제가 발생하였습니다. 조건들을 다시 확인 하시기 바랍니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "이벤몹제거") === 0) {
        splitMsg = msg.split(" ");
        if(splitMsg.length < 3) {
            replier.reply("사용법 : " + fix + "이벤몹제거 [이벤트 인덱스] [몹이름]\n\n  - 몹이름 : 'all' 입력시 특정몹 제외하고 나머지 몹에 적용");
            return;
        }

        i = splitMsg[1];
        name = msg.substring(splitMsg[0].length + splitMsg[1].length + 2, msg.length);

        if(event_manager.removeTargetMonster(ChangeNumber(i) - 1, name)) {
            replier.reply("이벤트 몬스터를 제거하였습니다.");
        }
        else {
            replier.reply("문제가 발생하였습니다. 조건들을 다시 확인 하시기 바랍니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 (" + msg + ") 명령어를 수행하였습니다.");
    }
    else if(msg.indexOf(fix + "휴면전환") === 0) {
        var MainFunc, loginManager, charManager, clanManager, relationManager, exchangeManager, fishingManager, partyManager, gambleManager, homeworkManager;
        var userlist, backupObj, tmpdata, matchList = null, matchData = null, filename = "";
        if(!Api.isOn("Main")) {
            splitMsg = msg.split(" ");
            if(splitMsg.length < 2){
                replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "휴면전환 1");
                return;
            }

            count = splitMsg[1];
            if(!checkNumberic(count)) {
                replier.reply("데이터 값설정이 상이합니다. ex> " + fix + "휴면전환 1");
                return;
            }

            MainFunc = Bridge.getScopeOf("Main.js");
            if(MainFunc !== null) {

                matchList = Read(fileNameList.SleepMatchingTable);
                if(matchList === null || matchList === undefined || !Array.isArray(matchList) ) {
                    matchList = [];
                }

                loginManager = MainFunc.login_Manager;
                charManager = MainFunc.charactor_Manager;
                clanManager = MainFunc.clan_Manager;
                relationManager = MainFunc.relation_Manager;
                exchangeManager = MainFunc.exchange_Manager;
                fishingManager = MainFunc.fishing_Manager;
                partyManager = MainFunc.party_Manager;
                stockManager = MainFunc.stock_Manager;
                gambleManager = MainFunc.gamble_Manager;
                homeworkManager = MainFunc.homework_Manager;
                userlist = loginManager.getUserByLoginDate(count);
                Log.i(JSON.stringify(userlist));

                for(i = 0; i < userlist.length; ++i) {
                    name = userlist[i];
                    tmpdata = loginManager.getSleepAccount(name);
                    if(tmpdata === null || tmpdata === "Y")
                        continue;

                    loginManager.setSleepAccount(name, "Y");
                    backupObj = {};

                    tmpdata = charManager.findUser(name);
                    backupObj.character = (tmpdata===null?null:tmpdata.getJson());

                    tmpdata = charManager.findOption(name);
                    backupObj.option = (tmpdata===null?null:tmpdata.getJson());

                    tmpdata = charManager.getRecordManager.Find(name);
                    backupObj.record = (tmpdata===null?null:tmpdata.getJson());

                    tmpdata = charManager.getPetManager.Find(name);
                    backupObj.pet = (tmpdata===null?null:tmpdata.getJson());

                    tmpdata = charManager.getMercenaryManager.Find(name);
                    backupObj.mercenary = (tmpdata===null?null:tmpdata.getJson());

                    tmpdata = charManager.getExplorerManager.Find(name);
                    backupObj.explorer = (tmpdata===null?null:tmpdata.getJson());

                    tmpdata = charManager.getMyHomeManager.Find(name);
                    backupObj.myhome = (tmpdata===null?null:tmpdata.getJson());

                    filename = ("ID" + (new Date()).getTime()) + "_" + i;
                    matchData = {id:name, filename:filename};
                    matchList.push(matchData);

                    Write(SleepFolder + filename + ".txt", backupObj);

                    charManager.deleteCharactor(name);
                    clanManager.Delete(name);
                    relationManager.Delete(name);
                    exchangeManager.Delete(name);
                    fishingManager.Delete(name);
                    partyManager.DeleteUser(name);
                    stockManager.Delete(name);
                    gambleManager.Delete(name);
                    homeworkManager.Delete(name);
                }

                Write(fileNameList.SleepMatchingTable, matchList);

                replier.reply("휴면전환을 완료하였습니다. 리로드 하겠습니다.");
                startComplie(room);
                MainFunc = null;
                charManager = null;
                clanManager = null;
                relationManager = null;
                exchangeManager = null;
                fishingManager = null;
                partyManager = null;
                stockManager = null;
                gambleManager = null;
                homeworkManager = null;
            }
            else {
                replier.reply("전체 " + fix + "리로드를 한번 해주시기 바랍니다.");
            }
        }
        else {
            replier.reply("게임 중단이 되야 휴면전환이 가능합니다.");
        }
        if(sender !== Master) Api.replyRoom(Master, "관리자 " + sender + "가 " + fix + "휴면전환 명령어를 수행하였습니다.");
    }
}
function checkNumberic(_num) {
    //숫자검사 && 양수검사
    return !isNaN(_num) && (Number(_num) >= 1);
}
function ChangeNumber(_num) {
    if(checkNumberic(_num))
        return Math.floor(Number(_num));
    else
        return 1;
}
function FindUserData(_id, _path) {
    var list = Read(_path);
    var obj;
    for(var i = 0; i < list.length; ++i) {
        obj = list[i];
        if(obj.name === _id || obj.id === _id) {
            list.splice(i,1);
        }
    }
}
function MakeDir(_path) {
    var folder = new File(_path);
    folder.mkdirs();
}
function replyID(_id, _msg) {
    if(Thread_Queue.length !== 0)
    {
        Thread_Queue.push({id:_id, msg:_msg});
    }
    else {
        Thread_Queue.push({id:_id, msg:_msg});
        new java.lang.Thread(){
            run:function(){
                java.lang.Thread.sleep(1000);
                while(true) {
                    if(Thread_Queue.length !== 0)
                    {
                        if(Api.canReply(Thread_Queue[0].id)) {
                            Api.replyRoom(Thread_Queue[0].id, Thread_Queue[0].msg);
                            java.lang.Thread.sleep(500);
                        }
                        Thread_Queue.splice(0,1);
                    }
                    else{
                        break;
                    }
                }

            }
        }.start();
    }
}
function startComplie(_room) {
    var i;
    try {
        for(i = 0; i < CompileList.length; ++i) {
            Api.reload(CompileList[i], true);
            java.lang.Thread.sleep(100);
        }
    }
    catch(e) {
        report(_room, CompileList[i] + " 실패\n" + String(e));
        return;
    }

    report(_room, "컴파일 종료");
}

// 방에서 명령으로 부르면 그 방에 답장하고, 화면 버튼처럼 방이 없으면 토스트와 실행 로그로 알린다
function report(_room, text) {
    if (_room) Api.replyRoom(_room, text);
    else {
        Api.showToast(text);
        Log.i(text);
    }
}

//아래 4개의 메소드는 액티비티 화면을 수정할때 사용됩니다.
var editTxt_id, isIdResultTxt, editTxt_item, isItemResultTxt, editTxt_msg, editTxt_cnt, editTxt_rune, editTxt_user, userInfoTxt;
var postItemObj, context;

function onCreate(savedInstanceState, activity) {
    context = activity;
    var scrollview = new ScrollView(activity);
    scrollview.setBackgroundColor(Color.BLACK);
    scrollview.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
    activity.setContentView(scrollview);

    var backlayout = new LinearLayout(activity);
    backlayout.setBackgroundColor(Color.BLACK);
    backlayout.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));
    backlayout.setOrientation(LinearLayout.VERTICAL);
    scrollview.addView(backlayout);

    var lowLayoutParam = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 200);
    var colTextLayoutParam = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1);

    var titleView = new TextView(activity);
    titleView.setTextColor(Color.WHITE);
    titleView.setGravity(Gravity.CENTER);
    titleView.setLayoutParams(lowLayoutParam);
    titleView.setText("RPG Control View");
    titleView.setTextSize(20);
    backlayout.addView(titleView);

    backlayout.addView(makeLine(activity));
//////////////////////////////////////
    var lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    backlayout.addView(lowLayout);

    var compilerTxt = new TextView(activity);
    compilerTxt.setTextColor(Color.WHITE);
    compilerTxt.setGravity(Gravity.CENTER);
    compilerTxt.setLayoutParams(colTextLayoutParam);
    compilerTxt.setText("Compile Button : ");
    lowLayout.addView(compilerTxt);

    var compilerBtn = new Button(activity);
    compilerBtn.setLayoutParams(colTextLayoutParam);
    compilerBtn.setText("Compile Start");
    compilerBtn.setTextColor(Color.WHITE);
    compilerBtn.setOnClickListener(new View.OnClickListener(){
        onClick : function(v) {
            startComplie();
        }
    });
    lowLayout.addView(compilerBtn);
    backlayout.addView(makeLine(activity));
/////////////////////////////////
    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    lowLayout.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 100));
    backlayout.addView(lowLayout);

    var sendTitle = new TextView(activity);
    sendTitle.setTextColor(Color.WHITE);
    sendTitle.setGravity(Gravity.CENTER);
    sendTitle.setLayoutParams( new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 100));
    sendTitle.setText("Post Item (아이템 전달)");
    lowLayout.addView(sendTitle);

    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    backlayout.addView(lowLayout);

    editTxt_id = new EditText(activity);
    editTxt_id.setInputType(InputType.TYPE_CLASS_TEXT);
    editTxt_id.setHint("캐릭ID 또는 all");
    editTxt_id.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 2));
    lowLayout.addView(editTxt_id);

    var charfindBtn = new Button(activity);
    charfindBtn.setLayoutParams(colTextLayoutParam);
    charfindBtn.setText("isID > ");
    charfindBtn.setTextColor(Color.WHITE);
    charfindBtn.setOnClickListener(new View.OnClickListener(){
        onClick : function(v) {
            if(String(editTxt_id.getText().toString()) === "all") {
                isIdResultTxt.setText("전체");
            }
            else {
                isIdResultTxt.setText(post_manager.isCharactorName(String(editTxt_id.getText().toString()))?"캐릭있음":"캐릭없음");
            }

        }
    });
    lowLayout.addView(charfindBtn);

    isIdResultTxt = new TextView(activity);
    isIdResultTxt.setTextColor(Color.WHITE);
    isIdResultTxt.setGravity(Gravity.CENTER);
    isIdResultTxt.setLayoutParams(colTextLayoutParam);
    isIdResultTxt.setText("...");
    lowLayout.addView(isIdResultTxt);

/////////////////////////////////
    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    backlayout.addView(lowLayout);

    editTxt_item = new EditText(activity);
    editTxt_item.setInputType(InputType.TYPE_CLASS_TEXT);
    editTxt_item.setHint("아이템 이름");
    editTxt_item.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 3));
    lowLayout.addView(editTxt_item);

    editTxt_cnt = new EditText(activity);
    editTxt_cnt.setInputType(InputType.TYPE_CLASS_NUMBER);
    editTxt_cnt.setHint("갯수");
    editTxt_cnt.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1));
    lowLayout.addView(editTxt_cnt);

    var itemfindBtn = new Button(activity);
    itemfindBtn.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 2));
    itemfindBtn.setText("isItem > ");
    itemfindBtn.setTextColor(Color.WHITE);
    itemfindBtn.setOnClickListener(new View.OnClickListener(){
        onClick : function(v) {
            postItemObj = post_manager.mkItemObj(String(editTxt_item.getText().toString()), String(editTxt_cnt.getText().toString()));
            isItemResultTxt.setText(postItemObj.index === ""?"없음":"있음");
        }
    });
    lowLayout.addView(itemfindBtn);

    isItemResultTxt = new TextView(activity);
    isItemResultTxt.setTextColor(Color.WHITE);
    isItemResultTxt.setGravity(Gravity.CENTER);
    isItemResultTxt.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 2));
    isItemResultTxt.setText("...");
    lowLayout.addView(isItemResultTxt);

/////////////////////////////////
    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    backlayout.addView(lowLayout);

    editTxt_rune = new EditText(activity);
    editTxt_rune.setInputType(InputType.TYPE_CLASS_NUMBER);
    editTxt_rune.setHint("전할 룬");
    editTxt_rune.setLayoutParams(colTextLayoutParam);
    lowLayout.addView(editTxt_rune);

    editTxt_msg = new EditText(activity);
    editTxt_msg.setInputType(InputType.TYPE_CLASS_TEXT);
    editTxt_msg.setHint("전할 말");
    editTxt_msg.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 5));
    lowLayout.addView(editTxt_msg);

/////////////////////////////////
    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    backlayout.addView(lowLayout);

    var SendBtn = new Button(activity);
    SendBtn.setLayoutParams(colTextLayoutParam);
    SendBtn.setText("Send Mail");
    SendBtn.setTextColor(Color.WHITE);
    SendBtn.setOnClickListener(new View.OnClickListener(){
        onClick : function(v) {
            var id = null, ids = [], itemlist = [], rune = (String(editTxt_rune.getText().toString()) === ""?"0":String(editTxt_rune.getText().toString())), msg = String(editTxt_msg.getText().toString());

            if(String(isIdResultTxt.getText()) === "캐릭있음") {
                id = String(editTxt_id.getText().toString());
            }
            else if(String(isIdResultTxt.getText()) === "전체") {
                id = null;
                ids = post_manager.getAllUser();
            }
            else {
                Api.showToast("캐릭이 존재 하지 않습니다.", Toast.LENGTH_LONG);
                return;
            }

            if(String(isItemResultTxt.getText()) === "있음") {
                itemlist.push(postItemObj);
            }

            var sentCount = 0;
            if(id !== null) {
                post_manager.postMsg(id, itemlist, rune, msg);
                Api.replyRoom(id, "우편이 도착했습니다. '" + fix + "우편' 명령어로 확인 하시기 바랍니다.");
                sentCount = 1;
            }
            else {
                for(var i = 0; i < ids.length; ++i) {
                    post_manager.postMsg(ids[i], itemlist, rune, msg);
                    Api.replyRoom(ids[i], "우편이 도착했습니다. '" + fix + "우편' 명령어로 확인 하시기 바랍니다.");
                }
                sentCount = ids.length;
            }
            // 화면에서 보낸 경우 아무 표시가 없으면 보냈는지 알 수 없으니 토스트로 알린다
            Api.showToast("우편을 보냈어요 (" + sentCount + "명)");

            isItemResultTxt.setText("");

        }
    });
    lowLayout.addView(SendBtn);
    backlayout.addView(makeLine(activity));
///////////////////////////////////////////////////////////////
    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL);
    backlayout.addView(lowLayout);

    var editTxt_user = new EditText(activity);
    editTxt_user.setInputType(InputType.TYPE_CLASS_TEXT);
    editTxt_user.setHint("검색 ID");
    editTxt_user.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 2));
    lowLayout.addView(editTxt_user);

    var getUserinfoBtn = new Button(activity);
    getUserinfoBtn.setLayoutParams(colTextLayoutParam);
    getUserinfoBtn.setText("Info");
    getUserinfoBtn.setTextColor(Color.WHITE);
    getUserinfoBtn.setOnClickListener(new View.OnClickListener(){
        onClick : function(v) {
            userInfoTxt.setText(FindUserData(String(editTxt_user.getText().toString())));
        }
    });
    lowLayout.addView(getUserinfoBtn);

    var getUserbagBtn = new Button(activity);
    getUserbagBtn.setLayoutParams(colTextLayoutParam);
    getUserbagBtn.setText("Bag");
    getUserbagBtn.setTextColor(Color.WHITE);
    getUserbagBtn.setOnClickListener(new View.OnClickListener(){
        onClick : function(v) {
            userInfoTxt.setText(FindUserBag(String(editTxt_user.getText().toString())));
        }
    });
    lowLayout.addView(getUserbagBtn);
///////////////////////////////////////////////////////////////
    lowLayout = makeLow(activity, LinearLayout.HORIZONTAL, LinearLayout.LayoutParams.WRAP_CONTENT);
    backlayout.addView(lowLayout);

    userInfoTxt = new TextView(activity);
    userInfoTxt.setTextColor(Color.WHITE);
    userInfoTxt.setGravity(Gravity.LEFT);
    userInfoTxt.setLayoutParams(colTextLayoutParam);
    lowLayout.addView(userInfoTxt);
    backlayout.addView(makeLine(activity));

}

function makeLine(ctx) {
    var LineView = new View(ctx);
    LineView.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 2));
    LineView.setBackgroundColor(Color.YELLOW);

    return LineView;
}
function makeLow(ctx, direction, _height) {
    var low= new LinearLayout(ctx);
    var height = (_height === undefined?200:_height);
    low.setOrientation(direction);
    low.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, height));

    return low;
}
function FindUserData(_id) {
    var userJson = Read(fileNameList.CharactorList);
    var DB = {Skill:Read(DBNameList.Skill), Property:Read(DBNameList.Property)};
    var user, tmpDB, text = "", s;
    for(var i = 0 ; i < userJson.length; ++i) {
        user = userJson[i];
        if(user.name === _id) {
          text += "[" + user.name + "]\n";
          text += "  - 종족 : " + user.species + "\n";
          text += "  - 룬 : " + user.rune + "\n";
          text += "  - 마석흡수 횟수 : " + user.purchasestat + "\n";
          text += "  - 클랜 : " + user.clan + "\n";
          text += "\n(스테이터스)\n";
          text += "  L 힘 : " + user.status.str + "\n";
          text += "  L 체질 : " + user.status.con + "\n";
          text += "  L 민첩 : " + user.status.dex + "\n";
          text += "  L 재주 : " + user.status.agi + "\n";
          text += "  L 지능 : " + user.status.int + "\n";
          text += "  L 운 : " + user.status.luk + "\n";
          text += "  L 효율 : " + user.status.ept + "\n";
          text += "  L 교감 : " + user.status.com + "\n";
          text += "  L 영혼 : " + user.status.spr + "\n";
          text += "\n(능력치)\n";
          text += "  L 공격력 : " + user.ability.attack + "\n";
          text += "  L 마법력 : " + user.ability.magic + "\n";
          text += "  L 방어력 : " + user.ability.defense + "\n";
          text += "  L 공격속도 : " + user.ability.atkspeed + "\n";
          text += "  L 정확도 : " + user.ability.accuracy + "\n";
          text += "  L 회피도 : " + user.ability.avoid + "\n";
          text += "  L 크리티컬 : " + user.ability.critical + "\n";
          text += "\n(스킬)\n";
          for(s = 0; s < user.skill.length; ++s) {
              tmpDB = FindDB(DB.Skill, user.skill[s]);
              text += "  L " + tmpDB.name + "\n";
          }
          text += "\n(특성)\n";
          for(s = 0; s < user.talent.length; ++s) {
              tmpDB = FindDB(DB.Property, user.talent[s]);
              text += "  L " + tmpDB.name + "\n";
          }

          return text;
        }
    }
    return "해당 ID 없음";
}
function FindUserBag(_id) {
    var userJson = Read(fileNameList.CharactorList);
    var DB = {WearItem:Read(DBNameList.WearItem), SundryItem:Read(DBNameList.SundryItem), FunctionalityItem:Read(DBNameList.FunctionalityItem)};
    var user, item, itemDB, tmpdb, text = "";
    for(var i = 0 ; i < userJson.length; ++i) {
        user = userJson[i];
        if(user.name === _id) {
          text += "[" + user.name + " 가방]\n";
          for(var v = 0; v < user.inventory.length; ++v) {
              item = user.inventory[v];
              itemDB = FindDB(DB[item.kind], item.index);
              text += (v+1) + ". " + itemDB.name + (item.strength === 0?"":"+" + item.strength) + " x " + item.count + "\n";
          }
          text += "\n[" + user.name + " 장비]\n";
          for(var obj in user.equipment) {
              item = user.equipment[obj];
              if(item !== "")
              {
                  tmpdb = FindDB(DB.WearItem, item);
                  text += "  L " + obj + " : " + tmpdb.name + (user.equipmentlevel[obj] === 0?"":"+" + user.equipmentlevel[obj]) + "\n";
              }
              else {
                  text += "  L " + obj + " : \n";
              }
          }
          return text;
        }
    }
    return "해당 ID 없음";
}

function FindDB(_db, _index){
    for(var d = 0; d < _db.length; ++d) {
        if(_db[d].index === _index) {
            return _db[d];
        }
    }
    return null;
}
function Makepath(_p_path) {
    // return "sdcard/TopofGod/" + _p_path;
    return "sdcard/Kmjbot/" + _p_path;
}
function Read(_p_path) {
    var fullpath = Makepath(_p_path);
    var rtnObj = null;

    try {
        rtnObj = JSON.parse(FileStream.read(fullpath));
    } catch(e) {
        Log.e("read() error --- " + String(e));
    }

    return rtnObj;
}
function Write(_p_path, _obj) {
    var fullpath = Makepath(_p_path);
    try {
        FileStream.write(fullpath, JSON.stringify(_obj));

    } catch(e) {
        Log.e("write() error --- " + String(e));
    }
}

function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}

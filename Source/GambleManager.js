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
const libCommon = Bridge.getScopeOf("Common.js"); // 일반 function Lib
const libObject = Bridge.getScopeOf("Object.js"); // 일반 function Lib

var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체

function GambleManager(_charactorManager) {
    const GAME = {HOLDEM:"HD"};
    var m_GamblerList = [];
    var m_GamblerDump = new libCommon.DumpModule();
    var m_Games = {};


    var m_CManager = _charactorManager;

    var _LoadData, _Find, _CreateGambler, _MakeJson, _Save, _getGameName, _Delete, _Init, _getKind;
    var Param = {};

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["GambleList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_GamblerList.push(libObject.clsGamblerInfo(tmpList[idx]));
        }
    }();

    _Find = function(_id) {
        var i;
        for (i = 0; i < m_GamblerDump.dumpList.length; ++i) {
           if (m_GamblerDump.dumpList[i].name === _id) {
              m_GamblerDump.resetTimeStemp(i);
              return m_GamblerDump.dumpList[i];
           }
        }
        for (i = 0; i < m_GamblerList.length; ++i) {
           if (m_GamblerList[i].name === _id) {
              m_GamblerDump.addDump(m_GamblerList[i]);
              return m_GamblerList[i];
           }
        }

        return _CreateGambler(_id);
    };

    _CreateGambler = function(_id) {
        var gambler = {name:_id, coin:0, grade:1, score:0, exchangecoin:0};
        m_GamblerList.push(libObject.clsGamblerInfo(gambler));
        _Save();
        return m_GamblerList[m_GamblerList.length - 1];
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_GamblerList.length; ++i) {
            jsonArray.push(m_GamblerList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Gamble", function() {
                libCommon.write(libConst.fileNameList["GambleList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["GambleList"], _MakeJson());
        }
    };

    _Delete = function(_id) {
        m_GamblerDump.clear();
        for (var i = 0; i < m_GamblerList.length; ++i) {
           if (m_GamblerList[i].name === _id) {
              m_GamblerList.splice(i,1);
              break;
           }
        }
        _Save();
    };

    _getGameName = function(_game) {
        var rtnName = "";
        switch(_game) {
           case GAME.HOLDEM :
              rtnName = "홀덤";
              break;
        }

        return rtnName;
    };

    _Init = function() {
        Param.find = _Find;
        Param.save = _Save;
        m_Games[GAME.HOLDEM] = new Holdem(Param);
    }();

    _getKind = function(_name, _bettingkind) {
        var kind = null;
        switch(_name) {
            case "레이즈" :
                kind = _bettingkind.RAISE;
                break;
            case "콜":
                kind = _bettingkind.CALL;
                break;
            case "폴드":
                kind = _bettingkind.FOLD;
                break;
            case "올인":
                kind = _bettingkind.ALLIN;
                break;
        }
        return kind;
    };

    return {
        getGame:GAME,
        Delete:function(_id) {
            _Delete(_id);
        },
        useItem:function(_id, _itemname, _count) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id);
            var rtnstr = "", dbItem;
            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                dbItem = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
                if(dbItem === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else {
                    if(user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index)) {
                        switch(dbItem.kind)
                        {
                            case "coin" :
                                tmpdata = dbItem.amount.split("~");
                                tmpdata = libCommon.Rand(Number(tmpdata[0]), Number(tmpdata[1]));
                                gambler.addCoin(tmpdata);
                                user.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "" + tmpdata + " coin을 획득하였습니다.";
                                break;
                        }
                        _Save();
                        m_CManager.SaveUser();
                    }
                    else {
                        rtnstr = "해당 아이템을 보유하고 있지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        ExchangeCoin:function(_id, _coin) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id);
            var user_loc, facilityDB, rtnstr = "";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("환전하기")) {
                    rtnstr = "현재위치에서는 코인을 환전할 수 없습니다.";
                    return rtnstr;
                }

                if(user.addRune(-(_coin * libConst.Gamble_ExchangeRate))) {
                    if(gambler.addCoin(_coin, true)) {
                        rtnstr = (_coin * libConst.Gamble_ExchangeRate) + " rune을 지출하여 " + _coin + "coin을 획득하였습니다.";
                        _Save();
                        m_CManager.SaveUser();
                    }
                }
                else {
                    rtnstr = "소유하신 룬이 부족하여 환전을 할 수 없습니다.\n\n환율 : " + libConst.Gamble_ExchangeRate + "rune >> 1 coin";
                }
            }
            return rtnstr;
        },
        MyCoin:function(_id) {
            var gambler = _Find(_id);

            return "[현재 보유중인 코인]\n\n   " + gambler.getCoin() + " coin";
        },
        getCoinSaleItem:function(_id) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id);
            var user_loc, facilityDB, rtnstr = "", itemList, tmpitem;

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("코인교환")) {
                    rtnstr = "현재위치에서는 코인교환을 할 수 없습니다.";
                    return rtnstr;
                }

                itemList = db_Manager.getCoinSaleList(user_loc.city, user_loc.facility);

                rtnstr += "[진열된 상품 목록]\n";
                for(var i = 0; i < itemList.length; ++i) {
                    tmpitem = db_Manager.getItem(itemList[i].itemkind, itemList[i].item);
                    rtnstr += "  - " + tmpitem.name + " ----- " + itemList[i].coin + "(coin)\n";
                }
            }
            return rtnstr;
        },
        PurchaseCoin:function(_id, _count, _itemname) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id);
            var user_loc, facilityDB, rtnstr = "", coinitem, tmpitem;

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("코인교환")) {
                    rtnstr = "현재위치에서는 코인교환을 할 수 없습니다.";
                    return rtnstr;
                }
                tmpitem = db_Manager.getItemByName(_itemname);
                if(tmpitem.obj === null) {
                    rtnstr = "존재하지 않는 아이템 명 입니다.";
                }
                else {
                    coinitem = db_Manager.getCoinSale(user_loc.city, user_loc.facility, tmpitem.obj.index, tmpitem.kind);
                    if(coinitem === null) {
                        rtnstr = "판매하지 않는 아이템 입니다.";
                    }
                    else {
                        if(gambler.addCoin(-(Number(coinitem.coin) * _count))) {
                            user.addItem(tmpitem.kind, tmpitem.obj.index, _count);
                            rtnstr = (Number(coinitem.coin) * _count) + "coin을 지출하여 " + tmpitem.obj.name + "을(를) " + _count + "개를 구입하였습니다.";
                            _Save();
                            m_CManager.SaveUser();
                        }
                        else {
                            rtnstr = "보유하고 있는 코인이 부족합니다.";
                        }
                    }
                }
            }
            return rtnstr;
        },
        Join:function(_id, _game) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id);
            var game = m_Games[_game];
            var user_loc, facilityDB, rtnstr = "";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 게임에 참여할 수 없습니다.";
                    return rtnstr;
                }

                if(gambler.getCoin() < libConst.Gamble_MinCoin) {
                    rtnstr = "코인이 부족하여 참여할 수 없습니다.\n\n  => 최소 " + libConst.Gamble_MinCoin + "coin 필요";
                    return rtnstr;
                }

                if(game.addWait(_id)) {
                    rtnstr += _getGameName(_game) + " 게임에 참가하였습니다.";
                }
                else {
                    rtnstr += "이미 게임에 참가한 상태 입니다.";
                }

            }
            return rtnstr;
        },
        Leave:function(_id, _game) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id);
            var game = m_Games[_game];
            var user_loc, facilityDB, rtnstr = "";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 게임에 탈퇴할 수 없습니다.";
                    return rtnstr;
                }

                if(game.removeWait(_id)) {
                    rtnstr += _getGameName(_game) + " 대기열에서 탈퇴 하였습니다.";
                }
                else {
                    rtnstr += "이미 게임 대기열에 없습니다.";
                }

            }
            return rtnstr;
        },
        getEntry:function(_id, _game) {
            var user = m_CManager.findUser(_id);
            var gambler = _Find(_id), i;
            var game = m_Games[_game];
            var user_loc, facilityDB, rtnstr = "[" + _getGameName(_game) + " 참여자]\n\n";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 게임에 참여할 수 없습니다.";
                    return rtnstr;
                }
                var waiter = game.getWaitList();
                var player = game.getPlayingList();

                rtnstr += "(다음 게임 대기자)\n";
                for(i = 0; i < waiter.length; ++i) {
                    rtnstr += "  L " + waiter[i] + "\n";
                }
                rtnstr += "\n(플레이어)\n";
                for(i = 0; i < player.length; ++i) {
                    rtnstr += "  L " + player[i] + "\n";
                }
            }
            return rtnstr;
        },
        StartGame:function(_id, _game) {
            var user = m_CManager.findUser(_id);
            var i;
            var game = m_Games[_game];
            var user_loc, facilityDB, rtnstr = "";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 겜블을 시작할 수 없습니다.";
                    return rtnstr;
                }
                var waiter = game.getWaitList();
                if(waiter.length < 2) {
                    rtnstr = "플레이어 수가 부족하여 시작할 수 없습니다.";
                }
                else {
                    if(game.getStats() === game.STEP.NONE) {
                        if(game.isWait(_id)) {
                            game.setGambler();
                            game.startGame();
                        }
                        else {
                            rtnstr = "당신은 " +  _getGameName(_game) + " 게임 참여자가 아닙니다.";
                        }
                    }
                    else {
                        rtnstr = "현재 " + _getGameName(_game) + " 게임을 진행중입니다.";
                    }
                }
            }
            return rtnstr;
        },
        Ban:function(_id, _game) {
            var user = m_CManager.findUser(_id);
            var i;
            var game = m_Games[_game];
            var user_loc, facilityDB, rtnstr = "";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 강퇴를 할 수 없습니다.";
                    return rtnstr;
                }
                if(game.BanPlayer()) {
                    rtnstr = "현재 잠수탄 인원을 강퇴하였습니다.";
                }
                else {
                    rtnstr = "아직 잠수라고 판단되지 않습니다.";
                }
            }
            return rtnstr;
        },
        CurrentPot:function(_id, _game) {
            var user = m_CManager.findUser(_id);
            var game = m_Games[_game], players, myinfo;
            var gambler = _Find(_id);
            var user_loc, facilityDB, rtnstr = "[현재 팟 정보]\n\n";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 팟 정보를 시작할 수 없습니다.";
                    return rtnstr;
                }

                if(game.getStats() !== game.STEP.NONE) {
                    if(game.isPot(_id)) {
                        rtnstr += "  - 누적 코인 : " + game.getBeforeCoin() + " coin\n";
                        rtnstr += "  - 팟 코인 : " + game.getPotCoin() + " coin\n";
                        rtnstr += "  - 팟 카드 : " + JSON.stringify(game.getPotCard()) + "\n\n\n";

                        rtnstr += "(타 플레이어 정보)\n";
                        players = game.getPlayers();
                        for(var i = 0; i < players.length; ++i) {
                            if(players[i].name === _id)
                                continue;
                            rtnstr += "- " + players[i].name + "\n";
                            rtnstr += "   L 배팅 코인 : " + players[i].betcoin + " coin\n";
                            rtnstr += "   L 보유 코인 : " + _Find(players[i].name).getCoin() + " coin\n";
                        }
                        myinfo = game.getPlayer(_id);
                        rtnstr += "\n(내 정보)\n";
                        if(myinfo !== null) {
                            rtnstr += "- " + myinfo.name + "\n";
                            rtnstr += "   L 배팅 코인 : " + myinfo.betcoin + " coin\n";
                            rtnstr += "   L 내 카드 : " + JSON.stringify(myinfo.mycard) + "\n";
                            rtnstr += "   L 보유 코인 : " + _Find(_id).getCoin() + " coin\n";
                        }
                        else {
                            rtnstr += "- " + _id + "\n";
                            rtnstr += "   L 폴드 함\n";
                        }

                    }
                    else {
                        rtnstr = "본인은 " + _getGameName(_game) + " 게임의 참여자가 아닙니다.";
                    }
                }
                else {
                    rtnstr = "현재 " + _getGameName(_game) + " 게임 중이 아닙니다.";
                }
            }
            return rtnstr;
        },
        Betting:function(_id, _kind, _game) {
            var user = m_CManager.findUser(_id);
            var game = m_Games[_game], kind;
            var user_loc, facilityDB, rtnstr = "";

            if(user === null) {
                rtnstr = "유저정보를 찾을수 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("홀덤")) {
                    rtnstr = "현재위치에서는 배팅을 할 수 없습니다.";
                    return rtnstr;
                }

                if(game.getStats() !== game.STEP.NONE) {
                    if(game.isPot(_id)) {
                        if(game.getBettingTurn() === _id) {
                            kind = _getKind(_kind, game.BETTINGKIND);
                            game.Betting(kind);
                        }
                        else {
                            rtnstr = "본인의 배팅 턴이 아닙니다.\n\n현재 배팅 턴 : " + game.getBettingTurn();
                        }
                    }
                    else {
                        rtnstr = "본인은 " + _getGameName(_game) + " 게임의 참여자가 아닙니다.";
                    }
                }
                else {
                    rtnstr = "현재 " + _getGameName(_game) + " 게임 중이 아닙니다.";
                }
            }
            return rtnstr;
        },
        IsPlayingGame:function(_id, _game) {
            var game = m_Games[_game];
            return game.isWait(_id) || game.isPot(_id);
        },
        StartBroadCast:function(_game) {
            m_Games[_game].BroadCastFlag = true;
        },
        EndBroadCase:function(_game) {
            m_Games[_game].BroadCastFlag = false;
        }
    };
}

function DefaultGame() {
    var _Waiting = []; // 대기열
    var _Pot = []; //  게임 유저 리스트
    this.__Private__ = {};
    this.BroadCastFlag = false;

    this.__Private__._FindPot = function(_id) {
        for (var i = 0; i < _Pot.length; ++i) {
           if (_Pot[i] === _id) {
              return _Pot[i];
           }
        }
        return null;
    };
    this.__Private__._FindWait = function(_id) {
        for (var i = 0; i < _Waiting.length; ++i) {
           if (_Waiting[i] === _id) {
              return _Waiting[i];
           }
        }
        return null;
    };
    this.__Private__._FindPotIndex = function(_id) {
        return _Pot.indexOf(_id);
    };
    this.__Private__._FindWaitIndex = function(_id) {
        return _Waiting.indexOf(_id);
    };


    this.SendMsgAllPlayer = function(_msg) {
        for(var i = 0; i < _Pot.length; ++i) {
            libCommon.replyID(_Pot[i], _msg);
        }
    };
    this.SendMsgPlayer = function(_palyer, _msg) {
        libCommon.replyID(_palyer, _msg);
    };
    this.getWaitList = function() {
        return _Waiting;
    };
    this.addWait = function(_id) {
        var obj = this.__Private__._FindWait(_id);
        if(obj === null) {
            _Waiting.push(_id);
            return true;
        }
        return false;
    };
    this.isWait = function(_id) {
        var idx = this.__Private__._FindWaitIndex(_id);
        if(idx === -1) {
            return false;
        }
        else {
            return true;
        }
    };
    this.removeWait = function(_id) {
        var idx = this.__Private__._FindWaitIndex(_id);
        if(idx === -1) {
            return false;
        }
        else {
            _Waiting.splice(idx, 1);
            return true;
        }
    };

    this.getPlayingList = function() {
        return _Pot;
    };
    this.addPot = function(_id) {
        var obj = this.__Private__._FindPot(_id);
        if(obj === null) {
            _Pot.push(_id);
            return true;
        }
        return false;
    };
    this.isPot = function(_id) {
        var idx = this.__Private__._FindPotIndex(_id);
        if(idx === -1) {
            return false;
        }
        else {
            return true;
        }
    };
    this.removePot = function(_id) {
        var idx = this.__Private__._FindPotIndex(_id);
        if(idx === -1) {
            return false;
        }
        else {
            _Pot.splice(idx, 1);
            return true;
        }
    };
    this.clearPot = function() {
        _Pot.splice(0, _Pot.length);
    };

    this.setGambler = function() {
        _Pot.splice(0,_Pot.length);
        for(var i = 0; i < _Waiting.length; ++i) {
            _Pot.push(_Waiting[i]);
        }
    };
    this.ReplyMainRoom = function(_msg) {
        if(this.BroadCastFlag)
            libCommon.AlarmMainRoom(_msg);
    };
}

function Holdem(gManager) {
    DefaultGame.call(this);

    var m_gManager = gManager;
    var GameName = "홀덤";
    this.STEP = {NONE:0, START:1, FIRST:2, SECOND:3, FIANL:4, RESULT:5};
    this.BETTINGKIND = {RAISE:0, CALL:1, FOLD:2, ALLIN:3};
    this.RESULTCARD = {ROYALSTRAIGHTFLUSH:10, STRAIGHTFLUSH:9, FOURCARD:8, FULLHOUSE:7, FLUSH:6, STRAIGHT:5, THREEFUL:4, TWOPAIR:3, ONEPAIR:2, NONE:1}; // royal straight flush
    var Stats = this.STEP.NONE;

    var Cards;        // 덱에서 카드를 섞은 뭉치
    var Players = []; // 갬블러들
    var startPlayer = ""; // 전판에서 승리한 플레이어 이름
    var bettingPlayer = 0;  // 현재 배팅 순서의 플레이어 인덱스
    var MaxCoin = 1;        // call 시 내야할 코인갯수
    var RaiseCoin = 1;      // 레이즈시 올라가는 코인

    var PotCoin = 0;  // 팟에 누적 코인
    var PotCard = []; // 팟에 깔린 카드

    var GoDouble = false; // 묻고 더블로 가!
    var BeforeCoin = 0; // 묻고 더블로 갔을때 이전 코인

    this.startGame = function() {
        var potlist = this.getPlayingList();

        Stats = this.STEP.START;
        this.shuffle();
        this.setPlayer(potlist);
        this.setPot();
        Stats = this.STEP.FIRST;
        MaxCoin = libConst.Gamble_Ante;
        bettingPlayer = 0;
        this.BettingStart();
    };
    this.BettingStart = function() {
        this.SendMsgPlayer(Players[bettingPlayer].name,"당신의 배팅 차례입니다.\n\n  - 레이즈\n  - 콜\n  - 폴드\n  - 올인");
        Players[bettingPlayer].bettingtime = (new Date()).getTime();
    };
    this.Betting = function(_kind) {
        var player = Players[bettingPlayer];
        var user = m_gManager.find(player.name);
        var remaincoin = MaxCoin - player.betcoin;
        var tmpcoin, isNext = true, tmpCard;
        var isFold = false;

        player.bettingtime = -1;

        switch(_kind) {
            case this.BETTINGKIND.RAISE:
                tmpcoin = RaiseCoin * 2;
                if(!user.addCoin(-(tmpcoin + remaincoin), false)) {
                    this.SendMsgPlayer(player.name,"코인이 부족하여 레이즈가 불가능합니다");
                    return false;
                }
                player.betcoin += (tmpcoin + remaincoin);
                MaxCoin = player.betcoin;
                RaiseCoin = tmpcoin;
                PotCoin += (tmpcoin + remaincoin);
                this.SendMsgAllPlayer(player.name + " => [레이즈] " + (tmpcoin + remaincoin) + "coin 을 배팅하였습니다.");
                this.ReplyMainRoom(player.name + " => [레이즈] " + (tmpcoin + remaincoin) + "coin 을 배팅하였습니다.");
                break;
            case this.BETTINGKIND.CALL:
                if(player.allin) {
                    this.SendMsgAllPlayer(player.name + " => [올인] 상태입니다.");
                    this.ReplyMainRoom(player.name + " => [올인] 상태입니다.");
                }
                else if(remaincoin === 0) {
                    this.SendMsgPlayer(player.name,"콜 코인이 0coin일때는 콜을 할수가 없습니다.");
                    return false;
                }
                else if(!user.addCoin(-remaincoin, false)) {
                    tmpcoin = user.getCoin();
                    user.addCoin(-tmpcoin, false);
                    player.betcoin += tmpcoin;
                    player.allin = true;
                    PotCoin += tmpcoin;
                    this.SendMsgAllPlayer(player.name + " => [올인] 남은 " + tmpcoin + "coin 을 배팅하였습니다.");
                    this.ReplyMainRoom(player.name + " => [올인] 남은 " + tmpcoin + "coin 을 배팅하였습니다.");
                }
                else {
                    player.betcoin += remaincoin;
                    PotCoin += remaincoin;
                    this.SendMsgAllPlayer(player.name + " => [콜] " + remaincoin + "coin 을 배팅하였습니다.");
                    this.ReplyMainRoom(player.name + " => [콜] " + remaincoin + "coin 을 배팅하였습니다.");
                }
                break;
            case this.BETTINGKIND.FOLD:
                Players.splice(bettingPlayer, 1);
                this.SendMsgAllPlayer(player.name + " => [폴드] 다이하였습니다.");
                this.ReplyMainRoom(player.name + " => [폴드] 다이하였습니다.");
                isFold = true;
                break;
            case this.BETTINGKIND.ALLIN:
                if(player.allin) {
                    this.SendMsgAllPlayer(player.name + " => [올인] 상태입니다.");
                    this.ReplyMainRoom(player.name + " => [올인] 상태입니다.");
                }
                else {
                    tmpcoin = user.getCoin();
                    user.addCoin(-tmpcoin, false);
                    player.betcoin += tmpcoin;
                    player.allin = true;
                    PotCoin += tmpcoin;
    
                    if(MaxCoin < player.betcoin) {
                        MaxCoin = player.betcoin
                    }
                    if(RaiseCoin < tmpcoin) {
                        RaiseCoin = tmpcoin;
                    }
    
                    this.SendMsgAllPlayer(player.name + " => [올인] 남은 " + tmpcoin + "coin 을 배팅하였습니다.");
                    this.ReplyMainRoom(player.name + " => [올인] 남은 " + tmpcoin + "coin 을 배팅하였습니다.");
                }
                
                break;
        }

        if(Players.length === 1) {
            this.ClearPot(Players[0].name);
        }
        else {
            if(isFold){
                isNext = false;
            }
            else {
                for(var i = 0; i < Players.length; ++i) {
                    if(Players[i].allin)
                        continue;

                    if(RaiseCoin === libConst.Gamble_Ante || Players[i].betcoin !== MaxCoin) {
                        isNext = false;
                        break;
                    }
                }
            }

            if(isNext) {
                Stats++;
                if(Stats === this.STEP.RESULT){
                    this.Reslut();
                }
                else {
                    tmpCard = this.getCard();
                    this.SendMsgAllPlayer("배팅이 완료되었습니다. 카드를 오픈합니다.\n\n  - 오픈된 카드 : " + tmpCard);
                    this.ReplyMainRoom("배팅이 완료되었습니다. 카드를 오픈합니다.\n\n  - 오픈된 카드 : " + tmpCard + "\n\n  - 팟 카드 : " + JSON.stringify(this.getPotCard()));
                    PotCard.push(tmpCard);
                    bettingPlayer = 0;
                    this.BettingStart();
                    RaiseCoin = libConst.Gamble_Ante;
                }
            }
            else {
                if(!isFold) {
                    bettingPlayer++;
                }

                if(bettingPlayer >= Players.length) {
                    bettingPlayer = 0;
                }
                this.BettingStart();
            }
        }

        m_gManager.save();
        return true;
    };
    this.ClearPot = function(_winName) {
        var player, user;
        if(_winName !== undefined && _winName !== null && _winName !== ""){
            for(var i = 0; i < Players.length; ++i) {
                if(Players[i].name === _winName) {
                    player = Players[i];
                    user = m_gManager.find(player.name);
                    Stats = this.STEP.NONE;
                    user.addCoin(PotCoin + BeforeCoin, false);
                    this.SendMsgAllPlayer(player.name + "이(가) 승리하였습니다.\n\n" + PotCoin + "coin 을 획득합니다.\n - 묻고 더블로 간 누적 코인 +" + BeforeCoin + "coin 추가획득");
                    this.ReplyMainRoom(player.name + "이(가) 승리하였습니다.\n\n" + PotCoin + "coin 을 획득합니다.\n - 묻고 더블로 간 누적 코인 +" + BeforeCoin + "coin 추가획득");
                    BeforeCoin = 0;
                    m_gManager.save();
                    break;
                }
            }
        }
        else {
            GoDouble = true;
            Stats = this.STEP.NONE;
            this.SendMsgAllPlayer("게임이 무승부 입니다. 묻고 더블로 갑니다.");
            this.ReplyMainRoom("게임이 무승부 입니다. 묻고 더블로 갑니다.");
        }
        this.clearPot();
    };

    this.Reslut = function() {
        var player_result = [];

        for(var i = 0; i < Players.length; ++i) {
            player_result.push(this.CardCoordination(Players[i].mycard, Players[i].name));
        }
        player_result.sort(function(a,b) {
            return a.result > b.result ? -1 : (a.result < b.result ? 1 : 0);
        });
        this.judeWinner(player_result);
    };
    this.CardCoordination = function(_u_cards, _name) {
        var cardList = []; // {num, patten}
        var i, card, obj, flag;

        var result = {name:_name, flush:null, straight:null, pair:null, triful:null, fourcard:null, result:this.RESULTCARD.NONE};

        for(i = 0; i < PotCard.length; ++i) {
            card = PotCard[i];
            cardList.push({num:this.changeNumtoChar(card.substring(1,card.length)), patten:this.changePattentoChar(card.substring(0,1))});
        }
        for(i = 0; i < _u_cards.length; ++i) {
            card = _u_cards[i];
            cardList.push({num:this.changeNumtoChar(card.substring(1,card.length)), patten:this.changePattentoChar(card.substring(0,1))});
        }
        cardList.sort(function(a,b) {
            return a.patten > b.patten ? -1 : (a.patten < b.patten ? 1 : 0);
        });
        cardList.sort(function(a,b) {
            return a.num > b.num ? -1 : (a.num < b.num ? 1 : 0);
        });

        result.flush = this.isF(cardList);
        result.straight = this.isS(cardList);
        result.pair = this.isPair(cardList, 2);
        result.triful = this.isPair(cardList, 3);
        result.fourcard = this.isPair(cardList, 4);

        if(result.pair.length === 1) {
            result.result = this.RESULTCARD.ONEPAIR;
        }
        if(result.pair.length >= 2) {
            result.result = this.RESULTCARD.TWOPAIR;
        }
        if(result.triful.length > 0) {
            result.result = this.RESULTCARD.THREEFUL;
        }
        if(result.straight.result) {
            result.result = this.RESULTCARD.STRAIGHT;
        }
        if(result.flush.result) {
            result.result = this.RESULTCARD.FLUSH;
        }
        if(result.triful.length > 0 && result.pair.length > 0) {
            result.result = this.RESULTCARD.FULLHOUSE;
        }
        if(result.fourcard.length > 0) {
            result.result = this.RESULTCARD.FOURCARD;
        }
        if(result.straight.result) {
            flag = true;
            for(i = 0; i < result.straight.cards.length - 2; ++i) {
                if(result.straight.cards[i].patten !== result.straight.cards[i+1].patten) {
                    flag = false;
                    break;
                }
            }
            if(flag) {
                if(result.straight.cards[0].num === 1) {
                    result.result = this.RESULTCARD.ROYALSTRAIGHTFLUSH;
                }
                else {
                    result.result = this.RESULTCARD.STRAIGHTFLUSH;
                }
            }
        }
        return result;
    };
    this.judeWinner = function(_result) {
        var i, c_rst, n_rst;
        var str = "", winners_length = 0;
        var winnerIdx = -1, c_num1, c_num2, c_ptn1, c_ptn2;

        for(i = 0; i < _result.length; ++i) {
            str += _result[i].name + " : " + this.changeResultName(_result[i].result) + "\n";
            str += " L " + this.getTargetCard(_result[i]) + "\n";
        }
        this.SendMsgAllPlayer("[홀덤 결과]\n\n" + str);
        this.ReplyMainRoom("[홀덤 결과]\n\n" + str);

        for(i = 0; i < _result.length - 1; ++i) {
            c_rst = _result[i];
            n_rst = _result[i+1];
            if(c_rst.result === n_rst.result) {
                winners_length++;
            }
            else {
                break;
            }
        }

        if(winners_length === 0) {
            this.ClearPot(_result[winners_length].name);
        }
        else {
            for(i = 0; i < winners_length; ++i) {
                switch(_result[i].result) {
                    case this.RESULTCARD.NONE:
                        this.ClearPot();
                        break;
                    case this.RESULTCARD.ONEPAIR:
                        c_num1 = (_result[i].pair[0].topnum === 1?14:_result[i].pair[0].topnum);
                        c_num2 = (_result[i+1].pair[0].topnum === 1?14:_result[i+1].pair[0].topnum);
                        c_ptn1 = _result[i].pair[0].patten.split(",")[0];
                        c_ptn2 = _result[i+1].pair[0].patten.split(",")[0];
                        if(c_num1 > c_num2) {
                            winnerIdx = i;
                        }
                        else if(c_num1 === c_num2) {
                            if(c_ptn1 > c_ptn2) {
                                winnerIdx = i;
                            }
                            else if(c_ptn1 === c_ptn2) {
                                winnerIdx = -1;
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.TWOPAIR:
                        if(_result[i].pair[_result[i].pair.length - 1].topnum === 1 && _result[i+1].pair[_result[i+1].pair.length - 1].topnum === 1) {
                            if(_result[i].pair[_result[i].pair.length - 1].patten.split(",")[0] > _result[i+1].pair[_result[i+1].pair.length - 1].patten.split(",")[0]) {
                                winnerIdx = i;
                            }
                            else if(_result[i].pair[_result[i].pair.length - 1].patten.split(",")[0] === _result[i+1].pair[_result[i+1].pair.length - 1].patten.split(",")[0]) {
                                winnerIdx = -1;
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        else if(_result[i].pair[_result[i].pair.length - 1].topnum === 1 && _result[i+1].pair[_result[i+1].pair.length - 1].topnum !== 1){
                            winnerIdx = i;
                        }
                        else if(_result[i].pair[_result[i].pair.length - 1].topnum !== 1 && _result[i+1].pair[_result[i+1].pair.length - 1].topnum === 1){
                            winnerIdx = i+1;
                        }
                        else {
                            if(_result[i].pair[0].topnum > _result[i+1].pair[0].topnum) {
                                winnerIdx = i;
                            }
                            else if(_result[i].pair[0].topnum === _result[i+1].pair[0].topnum) {
                                if(_result[i].pair[0].patten.split(",")[0] > _result[i+1].pair[0].patten.split(",")[0]) {
                                    winnerIdx = i;
                                }
                                else if(_result[i].pair[0].patten.split(",")[0] === _result[i+1].pair[0].patten.split(",")[0]) {
                                    if(_result[i].pair[1].topnum > _result[i+1].pair[1].topnum) {
                                        winnerIdx = i;
                                    }
                                    else if(_result[i].pair[1].topnum === _result[i+1].pair[1].topnum) {
                                        if(_result[i].pair[1].patten.split(",")[0] > _result[i+1].pair[1].patten.split(",")[0]) {
                                            winnerIdx = i;
                                        }
                                        else if(_result[i].pair[1].patten.split(",")[0] === _result[i+1].pair[1].patten.split(",")[0]) {
                                            winnerIdx = -1;
                                        }
                                        else {
                                            winnerIdx = i+1;
                                        }
                                    }
                                    else {
                                        winnerIdx = i+1;
                                    }
                                }
                                else {
                                    winnerIdx = i+1;
                                }
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        break;
                    case this.RESULTCARD.THREEFUL:
                        if(_result[i].triful[0].topnum > _result[i+1].triful[0].topnum) {
                            winnerIdx = i;
                        }
                        if(_result[i].triful[0].topnum === _result[i+1].triful[0].topnum) {
                            winnerIdx = -1;
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.STRAIGHT:
                        if(_result[i].straight.cards[0].num > _result[i+1].straight.cards[0].num) {
                            winnerIdx = i;
                        }
                        else if(_result[i].straight.cards[0].num === _result[i+1].straight.cards[0].num){
                            if(_result[i].straight.cards[0].patten > _result[i+1].straight.cards[0].patten) {
                                winnerIdx = i;
                            }
                            else if(_result[i].straight.cards[0].patten === _result[i+1].straight.cards[0].patten) {
                                winnerIdx = -1;
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.FLUSH:
                        if(_result[i].flush.cards[0].patten > _result[i+1].flush.cards[0].patten) {
                            winnerIdx = i;
                        }
                        else if(_result[i].flush.cards[0].patten === _result[i+1].flush.cards[0].patten) {
                            if(_result[i].flush.cards[0].num > _result[i+1].flush.cards[0].num) {
                                winnerIdx = i;
                            }
                            else if(_result[i].flush.cards[0].num === _result[i+1].flush.cards[0].num){
                                winnerIdx = -1;
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.FULLHOUSE:
                        if(_result[i].triful[0].topnum > _result[i+1].triful[0].topnum) {
                            winnerIdx = i;
                        }
                        if(_result[i].triful[0].topnum === _result[i+1].triful[0].topnum) {
                            if(_result[i].pair[0].topnum > _result[i+1].pair[0].topnum) {
                                winnerIdx = i;
                            }
                            else if(_result[i].pair[0].topnum === _result[i+1].pair[0].topnum) {
                                if(_result[i].triful[0].patten.split(",")[0] > _result[i+1].triful[0].patten.split(",")[0]) {
                                    winnerIdx = i;
                                }
                                else if(_result[i].triful[0].patten.split(",")[0] === _result[i+1].triful[0].patten.split(",")[0]) {
                                    if(_result[i].pair[0].patten.split(",")[0] > _result[i+1].pair[0].patten.split(",")[0]) {
                                        winnerIdx = i;
                                    }
                                    else if(_result[i].pair[0].patten.split(",")[0] === _result[i+1].pair[0].patten.split(",")[0]) {
                                        winnerIdx = -1;
                                    }
                                    else {
                                        winnerIdx = i+1;
                                    }
                                }
                                else {
                                    winnerIdx = i+1;
                                }
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.FOURCARD:
                        if(_result[i].fourcard[0].topnum > _result[i+1].fourcard[0].topnum) {
                            winnerIdx = i;
                        }
                        if(_result[i].fourcard[0].topnum === _result[i+1].fourcard[0].topnum) {
                            winnerIdx = -1;
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.STRAIGHTFLUSH:
                        if(_result[i].straight.cards[0].num > _result[i+1].straight.cards[0].num) {
                            winnerIdx = i;
                        }
                        else if(_result[i].straight.cards[0].num === _result[i+1].straight.cards[0].num){
                            if(_result[i].straight.cards[0].patten > _result[i+1].straight.cards[0].patten) {
                                winnerIdx = i;
                            }
                            else if(_result[i].straight.cards[0].patten === _result[i+1].straight.cards[0].patten) {
                                winnerIdx = -1;
                            }
                            else {
                                winnerIdx = i+1;
                            }
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                    case this.RESULTCARD.ROYALSTRAIGHTFLUSH:
                        if(_result[i].straight.cards[0].patten > _result[i+1].straight.cards[0].patten) {
                            winnerIdx = i;
                        }
                        else if(_result[i].straight.cards[0].patten === _result[i+1].straight.cards[0].patten) {
                            winnerIdx = -1;
                        }
                        else {
                            winnerIdx = i+1;
                        }
                        break;
                }
            }
            if(winnerIdx === -1)
                this.ClearPot();
            else
                this.ClearPot(_result[winnerIdx].name);
        }
    };


    this.isS = function(_list) {
        var rtn = {result:false, cards:[]};
        var count = 0, i;

        var list = [];
        for(i = 0; i < _list.length; ++i) {
            list.push(_list[i]);
            if(_list[i].num === 1) {
                list.push({num:14, patten:_list[i].patten});
            }
        }

        list.sort(function(a,b) {
            return a.patten > b.patten ? -1 : (a.patten < b.patten ? 1 : 0);
        });
        list.sort(function(a,b) {
            return a.num > b.num ? -1 : (a.num < b.num ? 1 : 0);
        });

        for(i = 0; i < list.length - 1; ++i) {
            if(list[i].num - list[i+1].num === 1) {
                ++count;
                rtn.cards.push(list[i]);
            }
            else if(list[i].num - list[i+1].num === 0) {

            }
            else {
                count = 0;
                rtn.cards.splice(0,rtn.cards.length);
            }

            if(count === 4) {
                rtn.cards.push(list[i+1]);
                rtn.result = true;
                break;
            }
        }
        for(i = 0; i < rtn.cards.length; ++i) {
            if(rtn.cards[i].num === 14)
                rtn.cards[i].num = 1;
        }
        return rtn;
    };
    this.isF = function(_list) {
        var rtn = {result:false, cards:[]};
        var i;

        var spade = 0, spList = [];
        var dia = 0, diList = [];
        var clover = 0, clList = [];
        var heart = 0, heList = [];

        for(i = 0; i < _list.length; ++i) {
            switch(_list[i].patten) {
                case 4:
                    spade++;
                    spList.push(_list[i]);
                    break;
                case 3:
                    dia++;
                    diList.push(_list[i]);
                    break;
                case 2:
                    clover++;
                    clList.push(_list[i]);
                    break;
                case 1:
                    heart++;
                    heList.push(_list[i]);
                    break;
            }
            if(spade === 5) {
                rtn.result = true;
                rtn.cards = spList;
                break;
            }
            else if(dia === 5) {
                rtn.result = true;
                rtn.cards = diList;
                break;
            }
            else if(clover === 5) {
                rtn.result = true;
                rtn.cards = clList;
                break;
            }
            else if(heart === 5) {
                rtn.result = true;
                rtn.cards = heList;
                break;
            }
        }
        return rtn;
    };
    this.isPair = function(_list, _cnt) {
        var rtn = []; // {result:false, cards:[]}

        var result = {};
        var patten = {};
        _list.forEach((x) => {
          result[x.num] = (result[x.num] || 0) + 1;
          patten[x.num] = patten[x.num]===undefined?x.patten:(patten[x.num] + "," + x.patten);
        });

        for(var number in result) {
            if(result[number] === _cnt) {
                rtn.push({result:true, topnum:Number(number), patten:patten[number]});
            }
        }
        rtn.sort(function(a,b) {
            return a.topnum > b.topnum ? -1 : (a.topnum < b.topnum ? 1 : 0);
        });
        return rtn;
    };

    this.changePattentoChar = function(_patten) {
        switch("" + _patten) {
            case "♠":
                return 4;
            case "♦":
                return 3;
            case "♥":
                return 2;
            case "♣":
                return 1;
            case "4":
                return "♠";
            case "3":
                return "♦";
            case "2":
                return "♥";
            case "1":
                return "♣";
        }
    };
    this.changeNumtoChar = function(_char) {
        switch(_char) {
            case "J":
                return 11;
            case "Q":
                return 12;
            case "K":
                return 13;
            case "A":
                return 1;
            default :
                return Number(_char);
        }
    };
    this.changeChartoNum = function(_num) {
        var char = ""+_num;
        switch(char) {
            case "11":
                return "J";
            case "12":
                return "Q";
            case "13":
                return "K";
            case "1":
                return "A";
            default :
                return char;
        }
    };
    this.changeResultName = function(_target) {
        switch(_target) {
            case this.RESULTCARD.NONE:
                return "없음";
            case this.RESULTCARD.ONEPAIR:
                return "원페어";
            case this.RESULTCARD.TWOPAIR:
                return "투페어";
            case this.RESULTCARD.THREEFUL:
                return "트리플";
            case this.RESULTCARD.STRAIGHT:
                return "스트레이트";
            case this.RESULTCARD.FLUSH:
                return "플러쉬";
            case this.RESULTCARD.FULLHOUSE:
                return "풀하우스";
            case this.RESULTCARD.FOURCARD:
                return "포카드";
            case this.RESULTCARD.STRAIGHTFLUSH:
                return "스트레이트플러쉬";
            case this.RESULTCARD.ROYALSTRAIGHTFLUSH:
                return "로열스트레이트플러쉬";
            default :
                return "";
        }
    };
    this.getTargetCard = function(_result) {
        var i, j, tmp, splitPatten, rtnStr = "";
        switch(_result.result) {
            case this.RESULTCARD.NONE:
                break;
            case this.RESULTCARD.ONEPAIR:
                tmp = _result.pair[0];
                splitPatten = tmp.patten.split(",");
                for(i = 0; i < splitPatten.length; ++i) {
                    rtnStr += this.changePattentoChar(splitPatten[i]) + "" + this.changeChartoNum(tmp.topnum)  + " ";
                }
                break;
            case this.RESULTCARD.TWOPAIR:
                tmp = _result.pair;
                for(j = tmp.length - 1; j >= 0; --j) {
                    splitPatten = tmp[j].patten.split(",");
                    for(i = 0; i < splitPatten.length; ++i) {
                        rtnStr += this.changePattentoChar(splitPatten[i]) + "" + this.changeChartoNum(tmp[j].topnum)  + " ";
                    }
                }
                break;
            case this.RESULTCARD.FULLHOUSE:
                tmp = _result.triful[_result.triful.length - 1];
                splitPatten = tmp.patten.split(",");
                for(i = 0; i < splitPatten.length; ++i) {
                    rtnStr += this.changePattentoChar(splitPatten[i]) + "" + this.changeChartoNum(tmp.topnum)  + " ";
                }
                tmp = _result.pair[_result.pair.length - 1];
                splitPatten = tmp.patten.split(",");
                for(i = 0; i < splitPatten.length; ++i) {
                    rtnStr += this.changePattentoChar(splitPatten[i]) + "" + this.changeChartoNum(tmp.topnum)  + " ";
                }
                break;
            case this.RESULTCARD.THREEFUL:
                tmp = _result.triful[_result.triful.length - 1];
                splitPatten = tmp.patten.split(",");
                for(i = 0; i < splitPatten.length; ++i) {
                    rtnStr += this.changePattentoChar(splitPatten[i]) + "" + this.changeChartoNum(tmp.topnum)  + " ";
                }
                break;
            case this.RESULTCARD.STRAIGHT:
                tmp = _result.straight.cards;
                for(i = 0; i < tmp.length; ++i) {
                    rtnStr += this.changePattentoChar(tmp[i].patten) + "" + this.changeChartoNum(tmp[i].num)  + " ";
                }
                break;
            case this.RESULTCARD.FLUSH:
                tmp = _result.flush.cards;
                for(i = 0; i < tmp.length; ++i) {
                    rtnStr += this.changePattentoChar(tmp[i].patten) + "" + this.changeChartoNum(tmp[i].num)  + " ";
                }
                break;
            case this.RESULTCARD.FOURCARD:
                tmp = _result.fourcard[0];
                splitPatten = tmp.patten.split(",");
                for(i = 0; i < splitPatten.length; ++i) {
                    rtnStr += this.changePattentoChar(splitPatten[i]) + "" + this.changeChartoNum(tmp.topnum)  + " ";
                }
                break;
            case this.RESULTCARD.STRAIGHTFLUSH:
                tmp = _result.straight.cards;
                for(i = 0; i < tmp.length; ++i) {
                    rtnStr += this.changePattentoChar(tmp[i].patten) + "" + this.changeChartoNum(tmp[i].num)  + " ";
                }
                break;
            case this.RESULTCARD.ROYALSTRAIGHTFLUSH:
                tmp = _result.straight.cards;
                for(i = 0; i < tmp.length; ++i) {
                    rtnStr += this.changePattentoChar(tmp[i].patten) + "" + this.changeChartoNum(tmp[i].num)  + " ";
                }
                break;
        }

        return rtnStr;
    };

    this.shuffle = function() {
        Cards = JSON.parse(JSON.stringify(libConst.Deck));
    };
    this.setPlayer = function(_potlist) {
        var i, startIdx = 0;
        for(i = 0; i < _potlist.length; ++i) {
            if(startPlayer === _potlist[i]) {
                startIdx = i;
                break;
            }
        }

        Players = [];
        for(i = startIdx; i < _potlist.length; ++i) {
            Players.push({
                name : _potlist[i],
                mycard : [],
                allin : false,
                betcoin : 0,
                bettingtime : -1
            });
        }
        for(i = 0; i < startIdx; ++i) {
            Players.push({
                name : _potlist[i],
                mycard : [],
                allin : false,
                betcoin : 0,
                bettingtime : -1
            });
        }
    };
    this.setPot = function() {
        var user;
        if(GoDouble){
            GoDouble = false;
            BeforeCoin += PotCoin;
        }
        PotCoin = 0;
        RaiseCoin = libConst.Gamble_Ante;
        PotCard = [];
        for(i = 0; i < Players.length; ++i) {
            user = m_gManager.find(Players[i].name);
            if(user.addCoin(-libConst.Gamble_Ante * 3, false)) {
                this.SendMsgPlayer(Players[i].name, GameName + " 게임을 시작하였습니다.");
                user.addCoin(libConst.Gamble_Ante * 2, false)
                Players[i].betcoin += libConst.Gamble_Ante;
                PotCoin += libConst.Gamble_Ante;
                m_gManager.save();
            }
            else {
                this.SendMsgPlayer(Players[i].name, "코인이 없어 게임에서 추방됩니다. 최소 보유 금액 : " + libConst.Gamble_Ante * 3 + "Rune");
                this.removePot(Players[i].name);
                this.removeWait(Players[i].name);
                Players.splice(i,1);
            }
        }

        if(Players.length === 1) {
            Stats = this.STEP.NONE;
            this.SendMsgPlayer(Players[0].name, "플레이어가 한명이어서 게임을 종료합니다.");
            this.clearPot();
            return;
        }

        for(i = 0; i < Players.length; ++i) {
            Players[i].mycard.push(this.getCard());
            Players[i].mycard.push(this.getCard());
        }
        PotCard.push(this.getCard());
        PotCard.push(this.getCard());
        PotCard.push(this.getCard());

        this.ReplyMainRoom(GameName + " 게임을 시작하였습니다.\n\n 팟 카드 : " + JSON.stringify(this.getPotCard()));
    };
    this.getCard = function() {
        var r = libCommon.Rand(0, Cards.length - 1);
        var selcard = Cards[r];
        Cards.splice(r,1);
        return selcard;
    };
    this.BanPlayer = function() {
        var currTime = (new Date()).getTime();
        var remainTime = currTime - Players[bettingPlayer].bettingtime;

        if(Players[bettingPlayer].bettingtime !== -1 && remainTime > libConst.Gamble_PlayerTime) {
            GoDouble = true;
            Stats = this.STEP.NONE;
            this.removePot(Players[bettingPlayer].name);
            this.removeWait(Players[bettingPlayer].name);
            this.SendMsgAllPlayer(Players[bettingPlayer].name + "겜블러의 잠수로 게임이 파토되었습니다. 다시 시작합니다.");
            this.ReplyMainRoom(Players[bettingPlayer].name + "겜블러의 잠수로 게임이 파토되었습니다. 다시 시작합니다.");
            this.SendMsgPlayer(Players[bettingPlayer].name, "당신은 잠수로 강퇴되었습니다.");
            Players.splice(bettingPlayer,1);
            return true;
        }
        return false;
    };

    this.getPotCoin = function() {
        return PotCoin;
    };
    this.getBeforeCoin = function() {
        return BeforeCoin;
    };
    this.getPotCard = function() {
        return PotCard;
    };
    this.getPlayers = function() {
        return Players;
    };
    this.getPlayer = function(_id) {
        for(var i = 0; i < Players.length; ++i) {
            if(Players[i].name === _id){
                return Players[i];
            }
        }
        return null;
    };
    this.getStats = function() {
        return Stats;
    };
    this.getBettingTurn = function() {
        return Players[bettingPlayer].name;
    };

}
Holdem.prototype = new DefaultGame();
Holdem.prototype.constructor = DefaultGame;

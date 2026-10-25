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

function CardBattleManager() {
    var CardDeckList = [];
    var m_CradDeckDump = new libCommon.DumpModule();

    var _LoadData, _Find, _MakeJson, _Save, _Delete, _Create;
    var _mkDeck, _removeDeck;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["CardDeckList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            CardDeckList.push(libObject.clsCardDeckObj(tmpList[idx]));
        }
    }();

    _Find = function(_id) {
        var i;
        for (i = 0; i < m_CradDeckDump.dumpList.length; ++i) {
           if (m_CradDeckDump.dumpList[i].name === _id) {
              m_CradDeckDump.resetTimeStemp(i);
              return m_CradDeckDump.dumpList[i];
           }
        }
        for (i = 0; i < CardDeckList.length; ++i) {
           if (CardDeckList[i].name === _id) {
              m_CradDeckDump.addDump(CardDeckList[i]);
              return CardDeckList[i];
           }
        }

        return _Create(_id);
    };

    _Create = function(_id) {
        var obj = {name:_id, decklist:[]};

        CardDeckList.push(libObject.clsCardDeckObj(obj));

        _Save();
    };

    _Delete = function(_id) {
        m_CradDeckDump.clear();
        for (var i = 0; i < CardDeckList.length; ++i) {
           if (CardDeckList[i].name === _id) {
              CardDeckList.splice(i,1);
              break;
           }
        }
        _Save();
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < CardDeckList.length; ++i) {
            jsonArray.push(CardDeckList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("CardDeck", function() {
                libCommon.write(libConst.fileNameList["CardDeckList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["CardDeckList"], _MakeJson());
        }
    };
    _mkDeck = function(_id, _deckname) {
        var UserDeck = _Find(_id);
        var decklist = UserDeck.getDeckList();
        var deck = {deckname:_deckname, cards:[]};

        if(decklist.length >= libConst.DeckMaxCount) {
            return false;
        }
        else {
            decklist.push(deck);
            _Save();
            return true;
        }
    };
    _removeDeck = function(_id, _deckname) {
        var UserDeck = _Find(_id);
        var decklist = UserDeck.getDeckList();
        var tmpDeck = null, result = false;

        for(var i = 0; i < decklist.length; ++i) {
            tmpDeck = decklist[i];
            if(tmpDeck.deckname === _deckname) {
                decklist.splice(i, 1);
                result = true;
                _Save();
                break;
            }
        }

        return result;
    };

    return {
        Delete:_Delete,
        DeckList : function(_id) {
            var UserDeck = _Find(_id);
            var decklist = UserDeck.getDeckList();
            var rtnStr = "[덱 목록]\n\n", deck = null;

            if(decklist.length === 0) {
                rtnStr += "보유한 덱이 없습니다.\n\n";
            }
            else {
                for(var i = 0; i < decklist.length; ++i) {
                    deck = decklist[i];
                    rtnStr += (i+1) + ". " + deck.deckname + "\n";
                }
                rtnStr += "\n";
            }
            rtnStr += "덱 상황 : " + decklist.length + "/" + libConst.DeckMaxCount;

            return rtnStr;
        },
        Deck: function(_id, _deckname) {
            var UserDeck = _Find(_id);
            var deck = UserDeck.findDeck(_deckname);
            var list = [], card, cardidx;
            var rtnStr = "[덱 정보]\n\n";

            if(deck === null) {
                rtnStr += "해당 이름의 덱이 존재 하지 않습니다.";
            }
            else {
                list = deck.cards;
                rtnStr += " - 덱 이름 : " + deck.deckname + "\n";
                rtnStr += " - 카드 목록\n";

                for(var i = 0; i < list.length; ++i) {
                    cardidx = list[i];
                    card = db_Manager.getItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, cardidx);

                    rtnStr += "   L " + card.name + "\n";
                }
                
            }
            return rtnStr;
        },
        MakeDeck: function(_id, _deckname) {
            var rtnStr = "";

            if(_mkDeck(_id, _deckname)) {
                rtnStr = "신규 덱을 생성하였습니다.\n\n";
            }
            else {
                rtnStr = "덱의 갯수가 " + libConst.DeckMaxCount + "개를 초과하였습니다.\n\n";
            }
            return rtnStr;
        },
        RemoveDeck: function(_id, _deckname) {
            var rtnStr = "";

            if(_removeDeck(_id, _deckname)) {
                rtnStr = "신규 덱을 삭제하였습니다.\n\n";
            }
            else {
                rtnStr = "덱 삭제에 실패하였습니다.\n\n";
            }
            return rtnStr;
        },
        InCard:function(_id, _deckidx, _cardname) {
            var UserDeck = _Find(_id), deckCount = 0;
            var deck = UserDeck.findDeckbyIndex(_deckidx - 1);
            var card = db_Manager.getItemByName(_cardname);
            var rtnStr = "";

            if(deck === null) {
                rtnStr = "해당 인덱스의 덱이 없습니다.";
            }
            else {
                if(card.obj === null) {
                    rtnStr = _cardname + " 카드는 존재 하지 않는 카드이름 입니다.";
                }
                else {
                    if(card.kind === libConst.ITEM_KIND.FUNCTIONALITYITEM && card.obj.kind === "battlecard") {
                        if(UserDeck.getAllCount(deck.deckname) < libConst.MaxCardCount) {
                            deckCount = UserDeck.getCardCount(deck.deckname, card.obj.index);
                            if(deckCount >= libConst.SameCardmax ) {
                                rtnStr = "이미" + card.obj.name + "은(는) 투입 한도를 초과하였습니다.";
                            }
                            else {

                                UserDeck.addCard(deck.deckname, card.obj.index);
                                rtnStr = _cardname + " 카드를 " + deck.deckname + "덱에 추가하였습니다.";
                                _Save();
                            }
                        }
                        else {
                            rtnStr = "해당 덱은 카드 한도를 초과하였습니다.";
                        }
                    }
                    else {
                        rtnStr = card.obj.name + "은(는) 배틀용 카드가 아닙니다.";
                    }
                }
            }

            return rtnStr;
        },
        OutCard:function(_id, _deckidx, _cardname) {
            var UserDeck = _Find(_id), deckCount = 0;
            var deck = UserDeck.findDeckbyIndex(_deckidx - 1);
            var card = db_Manager.getItemByName(_cardname), rtnStr = "";

            if(deck === null) {
                rtnStr = "해당 인덱스의 덱이 없습니다.";
            }
            else {
                if(card.obj === null) {
                    rtnStr = _cardname + " 카드는 존재 하지 않는 카드이름 입니다.";
                }
                else {
                    deckCount = UserDeck.getCardCount(deck.deckname, card.obj.index);
                    if(deckCount === 0) {
                        rtnStr = card.obj.name + "은(는) 해당 덱에 포함되어 있지 않습니다.";
                    }
                    else {
                        UserDeck.removeCard(deck.deckname, card.obj.index);
                        rtnStr = _cardname + " 카드를 " + deck.deckname + "덱에서 제거하였습니다.";
                        _Save();
                    }
                }
            }

            return rtnStr;
        }
    };
}
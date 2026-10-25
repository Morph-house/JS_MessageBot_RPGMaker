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

function ExchangeManager(_charactorManager) {
    var m_ExchangeList = [], m_CManager = _charactorManager;
    var m_MarketPrice = [];
    var BuyQueue = [];

    var _LoadData, _FindSalerList, _FindItemList, _FindMarketPrice, _RemoveExchangeList, _isPutLimit, _createSalerObj, _createMPObj, _recordMP, _MakeJson, _MakeJson_MP, _Save, _Save_MP, _Delete;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["ExchangeList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_ExchangeList.push(libObject.clsExchange(tmpList[idx]));
        }

        tmpList = libCommon.read(libConst.fileNameList["MarketPrice"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_MarketPrice.push(libObject.clsMarketPrice(tmpList[idx]));
        }

    }();
    _FindSalerList = function(_id) {
        var list = [];
        for (var i = 0; i < m_ExchangeList.length; ++i) {
           if (m_ExchangeList[i].saler === _id) {
              list.push(m_ExchangeList[i]);
           }
        }
        return list;
    };
    _FindItemList = function(_itemname, _islike, _id) {
        var list = [];
        for (var i = 0; i < m_ExchangeList.length; ++i) {
            if(m_ExchangeList[i].saler === _id)
                continue;

            if(_itemname === "all") {
                list.push(m_ExchangeList[i]);
            }
            else {
                if(_islike) {
                    if (m_ExchangeList[i].itemname.indexOf(_itemname) !== -1) {
                        list.push(m_ExchangeList[i]);
                    }
                }
                else {
                    if (m_ExchangeList[i].itemname === _itemname) {
                        list.push(m_ExchangeList[i]);
                    }
                }
            }
        }
        return list;
    };
    _RemoveExchangeList = function(_saler, _date) {
        for (var i = 0; i < m_ExchangeList.length; ++i) {
            if (m_ExchangeList[i].saler === _saler && m_ExchangeList[i].date === _date) {
              m_ExchangeList.splice(i, 1);
              break;
            }
        }
    };
    _FindMarketPrice = function(_name) {
        for (var i = 0; i < m_MarketPrice.length; ++i) {
           if (m_MarketPrice[i].name === _name) {
              return m_MarketPrice[i];
           }
        }
        return null;
    };
    _isPutLimit = function(_id) {
        var list = _FindSalerList(_id);

        return list.length;
    };
    _createSalerObj = function(_saler, _item, _kind, _itemcnt, _rune) {
        var rtnobj = libObject.clsExchange({
            date: (new Date()).getTime(),
            saler:_saler,
            rune:Number(_rune),
            itemname:_item.name,
            itemidx:_item.index,
            itemkind:_kind,
            itemcnt:Number(_itemcnt)
        });
        m_ExchangeList.push(rtnobj);
        _Save();
        return rtnobj;
    };
    _createMPObj = function(_itemname, _rune) {
        var rtnobj = libObject.clsMarketPrice({name:_itemname, marketprice:_rune, rcdprice:[]});
        m_MarketPrice.push(rtnobj);
        _Save_MP();
        return rtnobj;
    };
    _recordMP = function(_itemname, _itemcnt, _rune) {
        var mp = _FindMarketPrice(_itemname);
        var agree, item;
        if(mp === null) {
            item = db_Manager.getItemByName(_itemname);
            agree = db_Manager.getExchangeObj(item.obj.index, item.kind);
            mp = _createMPObj(_itemname, agree.defualtrune);
            mp.record(_rune, _itemcnt);
        }
        else {
            mp.record(_rune, _itemcnt);
        }
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_ExchangeList.length; ++i) {
            jsonArray.push(m_ExchangeList[i].getJson());
        }
        return jsonArray;
    };
    _MakeJson_MP = function() {
        var jsonArray = [];
        for(var i = 0; i < m_MarketPrice.length; ++i) {
            jsonArray.push(m_MarketPrice[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Exchange", function() {
                libCommon.write(libConst.fileNameList["ExchangeList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["ExchangeList"], _MakeJson());
        }
    };
    _Save_MP = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Market", function() {
                libCommon.write(libConst.fileNameList["MarketPrice"], _MakeJson_MP());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["MarketPrice"], _MakeJson_MP());
        }
    };

    _Delete = function(_id) {
        for (var i = m_ExchangeList.length - 1; i >= 0; --i) {
           if (m_ExchangeList[i].saler === _id) {
              m_ExchangeList.splice(i,1);
           }
        }
        _Save();
    };

    return {
        Delete:_Delete,
        getMarketPrice:function(_id, _itemname) {
            var user = m_CManager.findUser(_id);
            var item = db_Manager.getItemByName(_itemname);
            var rtnstr = "", user_loc, facilityDB;
            var marketprice, agree;

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("시세확인")) {
                rtnstr = "현재위치에서는 시세확인을 할수 없습니다.";
                return rtnstr;
            }

            marketprice = _FindMarketPrice(_itemname);
            if(marketprice != null) {
                rtnstr += "[" + _itemname + "] 시세확인\n\n";
                rtnstr += "   - 현재가 : " + marketprice.getMarketPrice() + " rune\n";
                rtnstr += "   - 최저등록가 : " + marketprice.getMinPrice() + " rune\n";
                rtnstr += "   - 최고등록가 : " + marketprice.getMaxPrice() + " rune\n";
            }
            else {
                if(item.obj === null) {
                    rtnstr = _itemname + " (이)란 아이템은 존재 하지 않습니다.";
                }
                else {
                    agree = db_Manager.getExchangeObj(item.obj.index, item.kind);
                    if(agree !== null) {
                        rtnstr += "[" + _itemname + "] 시세확인\n\n";
                        rtnstr += "   - 아직까지 시세가 형성되지 않은 물품입니다.\n";
                        rtnstr += "   - 초기 가격 : " + agree.defualtrune ;
                    }
                    else {
                        rtnstr += "[" + _itemname + "] 시세확인\n\n";
                        rtnstr += "   - 해당 물품은 거래 제한 품목입니다.";
                    }
                }
            }
            return rtnstr;
        },
        putMarket:function(_saler, _itemname, _itemcnt, _rune) {
            var user = m_CManager.findUser(_saler);
            var spl_item = _itemname.split("+");
            var itemlevel, itemname, item;
            var rtnstr = "", user_loc, facilityDB;
            var agree, marketprice, min, max;

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("물품등록")) {
                rtnstr = "현재위치에서는 물품등록을 할수 없습니다.";
                return rtnstr;
            }

            if(spl_item.length > 1) {
                rtnstr = "강화된 장비는 거래소에 판매가 불가능합니다.";
                return rtnstr;
            }

            itemname = spl_item[0];
            item = db_Manager.getItemByName(itemname);

            if(item.obj === null) {
                rtnstr = itemname + " (이)란 아이템은 존재 하지 않습니다.";
            }
            else {
                if(_isPutLimit(_saler) < libConst.MPrice_PutLimit) {
                    agree = db_Manager.getExchangeObj(item.obj.index, item.kind);
                    if(agree !== null) {
                        marketprice = _FindMarketPrice(itemname);
                        if(marketprice !== null) {
                            min = marketprice.getMinPrice();
                            max = marketprice.getMaxPrice();
                        }
                        else {
                            min = Number(agree.defualtrune) - (Number(agree.defualtrune) * libConst.MPrice_Gap);
                            if(min < libConst.MPrice_Minimum) {
                                min = libConst.MPrice_Minimum;
                            }
                            max = Number(agree.defualtrune) + (Number(agree.defualtrune) * libConst.MPrice_Gap);
                            if(max < libConst.MPrice_Minimum) {
                                max = libConst.MPrice_Minimum;
                            }
                        }
                        if(min <= _rune && max >= _rune) {
                            if(user.isItemCount(item.kind, item.obj.index, _itemcnt)){
                                _createSalerObj(_saler, item.obj, item.kind, _itemcnt, _rune);
                                user.removeItem(item.kind, item.obj.index, _itemcnt);
                                m_CManager.SaveUser();
                                _Save();
                                rtnstr = "성공적으로 물품을 거래소에 등록하였습니다.";
                            }
                            else {
                                rtnstr = itemname + " 아이템 갯수가 부족합니다.";
                            }
                        }
                        else {
                            rtnstr = "시세범위를 넘어섰습니다.\n\n";
                            rtnstr += "[" + itemname + "] 시세확인\n";
                            rtnstr += "   - 현재가 : " + (marketprice === null ? agree.defualtrune : marketprice.getMarketPrice()) + " rune\n";
                            rtnstr += "   - 최저등록가 : " + min + " rune\n";
                            rtnstr += "   - 최고등록가 : " + max + " rune\n";
                        }
                    }
                    else {
                        rtnstr = "거래가 허가된 물품이 아닙니다.";
                    }
                }
                else {
                    rtnstr = "거래소 등록 갯수 초과입니다.\n 거래소 등록 물품 총 갯수 : " + libConst.MPrice_PutLimit;
                }
            }
            return rtnstr;
        },
        searchItem:function(_id, _itemname) {
            var user = m_CManager.findUser(_id);
            var searchList = _FindItemList(_itemname, true, _id);
            var rtnstr = "", user_loc, facilityDB, obj;

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("물품검색")) {
                rtnstr = "현재위치에서는 물품검색을 할수 없습니다.";
                return rtnstr;
            }

            if(searchList.length > 0) {
                searchList.sort(function(a,b) {
                    return a.rune < b.rune ? -1 : (a.rune > b.rune ? 1 : 0);
                });
                rtnstr = "[" + _itemname + "] 내림차순 검색결과\n\n";
                for(var i = 0; i < searchList.length; ++i) {
                    obj = searchList[i];
                    rtnstr += "(" + obj.itemname + ")\n";
                    rtnstr += "  L 가격 : " + obj.rune + " rune\n";
                    rtnstr += "  L 잔여 갯수 : " + obj.getItemCnt() + "개 \n";
                    rtnstr += "  L 판매자 : " + obj.saler + "\n\n";
                }
            }
            else {
                rtnstr = "거래소에 관련 상품이 없습니다.";
            }
            return rtnstr;

        },
        getMineSaleList:function(_name) {
            var salelist = _FindSalerList(_name);
            var rtnstr = "", sale, date;
            if(salelist.length === 0) {
                rtnstr += "현재 거래소에 등록한 물품이 없습니다.";
            }
            else {
                for(var i = 0; i < salelist.length; ++i) {
                    sale = salelist[i];
                    date = new Date(sale.date);
                    rtnstr += (i+1) + ". [" + (date.getYear()+1900) + ". " + (date.getMonth() + 1) + ". " + date.getDate() +
                    " - " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "]\n";
                    rtnstr += "  L " + sale.itemname + " x " + sale.getItemCnt() + "\n  L " + sale.rune + " rune\n\n";
                }
            }
            return rtnstr;
        },
        buyItem:function(_id, _itemname, _count) {
            BuyQueue.push({id:_id, itemname:_itemname, count:_count});
            while(BuyQueue.length > 0) {
                if(BuyQueue[0].id === _id) {
                    break;
                }
                java.lang.Thread.sleep(200);
            }

            var user = m_CManager.findUser(_id);
            var item = db_Manager.getItemByName(_itemname).obj;
            var rtnstr = "[물품 거래 로그]\n\n", user_loc, facilityDB;
            var totalcount = _count, search, saler, buycnt, searchCnt;
            var isRune = true, isComplite = false;

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("물품거래")) {
                rtnstr = "현재위치에서는 물품거래을 할수 없습니다.";
                BuyQueue.splice(0,1);
                return rtnstr;
            }

            if(item === null) {
                rtnstr = _itemname + "은(는) 존재하지 않는 아이템 입니다.";
                BuyQueue.splice(0,1);
                return rtnstr;
            }

            var searchList = _FindItemList(_itemname, false, _id);
            if(searchList.length > 0) {
                searchList.sort(function(a,b) {
                    return a.rune < b.rune ? -1 : (a.rune > b.rune ? 1 : 0);
                });

                for(var i = 0; i < searchList.length; ++i) {
                    search = searchList[i];
                    saler = m_CManager.findUser(search.saler);

                    rtnstr += "  - " + item.name + " 을(를) " + search.rune + " 가격에 구매 시작합니다.(VAT 별도)\n";
                    buycnt = 0;
                    searchCnt = search.getItemCnt();
                    for(var c = 0; c < searchCnt; ++c) {
                        if(user.addRune(-Math.floor(search.rune * (1 + libConst.MPrice_Surtax)))) {
                            saler.addRune(Math.floor(search.rune * (1 - libConst.MPrice_Fee)));
                            user.addItem(search.itemkind, search.itemindex,1);
                            totalcount--;
                            buycnt++;
                            search.removeCnt(1);

                        }
                        else{
                            rtnstr += "  - 구매할 룬이 부족하여 보유 룬만큼 구매합니다.\n";
                            isRune = false;
                            break;
                        }

                        if(totalcount === 0) {
                            rtnstr += "  - 물품구매를 완료하엿습니다.\n";
                            isComplite = true;
                            break;
                        }
                    }
                    rtnstr += "  - 구매결과 : " + item.name + " 을(를) " + buycnt + " 개 구매 완료합니다.\n";
                    rtnstr += "  - 발생비용 : " + (search.rune * buycnt) + " rune ,  (VAT : " + (search.rune * buycnt * libConst.MPrice_Surtax) + ")\n";
                    _recordMP(search.itemname, buycnt, search.rune);
                    libCommon.AlarmMainRoom(_id + "님이 거래소에서 " + _itemname + "을(를)" + buycnt + "개 구매하였습니다.\n  - 한 개당 가격 : " + search.rune + "rune");
                    libCommon.replyID(search.saler, "거래소에서 물품이 판매되어 " + (search.rune * buycnt) + " rune이 지급되었습니다.(수수료 차감 : " + (search.rune * buycnt * libConst.MPrice_Fee)  + "rune)");

                    if(search.getItemCnt() === 0) {
                        _RemoveExchangeList(search.saler, search.date);
                    }

                    if(!isRune) {
                        break;
                    }
                    else if(isComplite) {
                        break;
                    }
                }
                rtnstr += "거래 완료";
                m_CManager.SaveUser();
                _Save();
                _Save_MP();
            }
            else {
                rtnstr += "거래소에 관련 상품이 없습니다.";
            }

            BuyQueue.splice(0,1);
            return rtnstr;

        },
        cancelMarket:function(_id, _index) {
            var user = m_CManager.findUser(_id);
            var rtnstr = "[물품 취소]\n\n", user_loc, facilityDB;
            var salelist = _FindSalerList(_id), saleobj;
            var idx = _index - 1;
            var item;

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("거래취소")) {
                rtnstr = "현재위치에서는 거래취소을 할수 없습니다.";
                return rtnstr;
            }

            if(salelist.length <= idx) {
                rtnstr += "입력한 번호의 거래내역이 없습니다.";
            }
            else {
                saleobj = salelist[idx];
                item = db_Manager.getItem(saleobj.itemkind, saleobj.itemindex);
                rtnstr += "거래를 취소하였습니다.\n";
                rtnstr += "" + item.name + "을(를) " + saleobj.getItemCnt() + "개를 돌려 받습니다.";
                user.addItem(saleobj.itemkind, saleobj.itemindex, saleobj.getItemCnt());
                _RemoveExchangeList(saleobj.saler, saleobj.date);

                m_CManager.SaveUser();
                _Save();
            }
            return rtnstr;
        },
        counterfeitMP:function(_item, _rune) {
            var item = db_Manager.getItemByName(_item);
            var rtnstr = "", marketprice;

            if(item.obj === null) {
                rtnstr = _item + " (이)란 아이템은 존재 하지 않습니다.";
            }
            else {
                marketprice = _FindMarketPrice(_item);
                if(marketprice === null) {
                    rtnstr = "아직까지 시세가 형성되지 않은 물품입니다";
                }
                else {
                    marketprice.initRecord(_rune);
                    _Save_MP();
                    rtnstr = "해당 아이템의 거래소 시세를 조작 완료하였습니다.";
                }
            }

            return rtnstr;
        }
    };
}

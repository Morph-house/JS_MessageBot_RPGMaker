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

function StockManager(_charactorManager) {
    var m_CManager = _charactorManager;
    var m_CurrStockList = [];
    var m_CurrStockDump = new libCommon.DumpModule();

    var m_UserStockList = [];
    var m_UserStockDump = new libCommon.DumpModule();

    var _LoadData, _FindUserStock, _CreateUserStock, _MakeJsonUserStock, _SaveUserStock, _DeleteUserStock, 
        _InitStock, _FindCurrStock, _FindCurrStockByName, _CreateCurrStock, _ReloadCurrStock, _MakeJsonCurrStock, _SaveCurrStock, _DeleteCurrStock,
        _MakeNewsList, _CalcStock;
    
    var CalcTime = (new Date()).getTime();
    var lock = false;
    var Waiting = [];

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["UserStockList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_UserStockList.push(libObject.clsUserStock(tmpList[idx]));
        }

        tmpList = libCommon.read(libConst.fileNameList["CurrentStock"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_CurrStockList.push(libObject.clsCurrentStock(tmpList[idx]));
        }
    }();

    _InitStock = function() {
        var db_stock = db_Manager.getAllStock();
        var tmpdbStock = null;
        

        for(var i = 0; i < db_stock.length; ++i) {
            tmpdbStock = db_stock[i];
            if(_FindCurrStock(tmpdbStock.index) === null) {
                _CreateCurrStock(tmpdbStock.name, tmpdbStock.index, Number(tmpdbStock.ori_price), Number(tmpdbStock.ori_dividend), _MakeNewsList(tmpdbStock));
            }
        }
    };
    _MakeNewsList = function(_db_stock) {
        var newsList = _db_stock.newslist;
        var totalRate = 0, tmpRand = 0;
        var tmpNews, preRate = 0, currRate = 0;
        var rtnArray = [];

        for(var j = 0; j < newsList.length; ++j) {
            totalRate += Number(newsList[j].rate);
        }
        tmpRand = libCommon.Randfloat(0,totalRate);
        preRate = 0;
        currRate = 0;
        for(var m = 0; m < newsList.length; ++m) {
            tmpNews = newsList[m];
            preRate += (m===0?0:Number(newsList[m-1].rate));
            currRate += Number(tmpNews.rate);
            if(tmpRand >= preRate && tmpRand < currRate) {
                rtnArray.push(tmpNews.news);
            }
        }

        return rtnArray;
    };
    _CalcStock = function(_id) {
        Waiting.push(_id);
        while(Waiting.length !== 0) {
            if(Waiting[0] === _id) {
                if(!lock) {
                    lock = true;
                    
                    var currDate = (new Date()).getTime();
                    var count = Math.floor((currDate - CalcTime) / libConst.StockCalcTime);
                    var tmpstock, tmpuser, tmpuserstock, stockCnt, i, j, k, m;
                    for(i = 0; i < count; ++i) {
                        for(j = 0; j < m_CurrStockList.length; ++j) {
                            tmpstock = m_CurrStockList[j];
                            
                            for(k = 0; k < m_UserStockList.length; ++k) {
                                tmpuser = m_UserStockList[k];
                                tmpuserstock = tmpuser.getStockList(tmpstock.index);
                                stockCnt = 0;
                                for(m = 0; m < tmpuserstock.length; ++m) {
                                    stockCnt += tmpuserstock[m].count;
                                }
                                tmpuser.addAccrue(tmpstock.getCurrDividend() * stockCnt);
                            }
                        }
                        _ReloadCurrStock();
                        CalcTime = (new Date()).getTime();
                    }
                    _SaveCurrStock();
                    _SaveUserStock();
                    Waiting.splice(0,1);
                    lock = false;
                    
                    break;
                }
            }
        }
    };

    //유저 주식정보 관련
    _FindUserStock = function(_id) {
        var i;
        for (i = 0; i < m_UserStockDump.dumpList.length; ++i) {
           if (m_UserStockDump.dumpList[i].name === _id) {
            m_UserStockDump.resetTimeStemp(i);
              return m_UserStockDump.dumpList[i];
           }
        }
        for (i = 0; i < m_UserStockList.length; ++i) {
           if (m_UserStockList[i].name === _id) {
            m_UserStockDump.addDump(m_UserStockList[i]);
              return m_UserStockList[i];
           }
        }

        return null;
    };
    _CreateUserStock = function(_id) {
        var obj = {name:_id, accrue:0, stocklist:[]};

        m_UserStockList.push(libObject.clsUserStock(obj));

        _SaveUserStock();
    };
    _DeleteUserStock = function(_id) {
        m_UserStockDump.clear();
        for (var i = 0; i < m_UserStockList.length; ++i) {
           if (m_UserStockList[i].name === _id) {
            m_UserStockList.splice(i,1);
              break;
           }
        }
        _SaveUserStock();
    };
    _MakeJsonUserStock = function() {
        var jsonArray = [];
        for(var i = 0; i < m_UserStockList.length; ++i) {
            jsonArray.push(m_UserStockList[i].getJson());
        }
        return jsonArray;
    };
    _SaveUserStock = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("UserStock", function() {
                libCommon.write(libConst.fileNameList["UserStockList"], _MakeJsonUserStock());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["UserStockList"], _MakeJsonUserStock());
        }
    };

    // 현재 주식 정보 관련
    _FindCurrStock = function(_index) {
        var i;
        for (i = 0; i < m_CurrStockDump.dumpList.length; ++i) {
           if (m_CurrStockDump.dumpList[i].index === _index) {
            m_CurrStockDump.resetTimeStemp(i);
              return m_CurrStockDump.dumpList[i];
           }
        }
        for (i = 0; i < m_CurrStockList.length; ++i) {
           if (m_CurrStockList[i].index === _index) {
            m_CurrStockDump.addDump(m_CurrStockList[i]);
              return m_CurrStockList[i];
           }
        }

        return null;
    };
    _FindCurrStockByName = function(_name) {
        var i;
        for (i = 0; i < m_CurrStockDump.dumpList.length; ++i) {
           if (m_CurrStockDump.dumpList[i].name === _name) {
            m_CurrStockDump.resetTimeStemp(i);
              return m_CurrStockDump.dumpList[i];
           }
        }
        for (i = 0; i < m_CurrStockList.length; ++i) {
           if (m_CurrStockList[i].name === _name) {
            m_CurrStockDump.addDump(m_CurrStockList[i]);
              return m_CurrStockList[i];
           }
        }

        return null;
    };
    _CreateCurrStock = function(_name, _index, _currprice, _currdividend, _newslist) {
        var obj =  {name:_name, index:_index, curr_price:_currprice, curr_dividend:_currdividend, news_list:_newslist};

        m_CurrStockList.push(libObject.clsCurrentStock(obj));

        _SaveCurrStock();
    };
    _ReloadCurrStock = function() {
        var i, tmpcurrStock, tmpnewsList, db_news;
        var judgment, ranges;
        for(i = 0; i < m_CurrStockList.length; ++i) {
            tmpcurrStock = m_CurrStockList[i];
            tmpnewsList = tmpcurrStock.getNewsList();

            for(j = 0; j < tmpnewsList.length; ++j) {
                db_news = db_Manager.getNews(tmpnewsList[j]);
                judgment = libCommon.Randfloat(0,100);
                if(judgment <= Number(db_news.succ)) {
                    ranges = db_news.chgstock.split("~");
                    tmpcurrStock.addCurrPrice(libCommon.Rand(Number(ranges[0]),Number(ranges[1])));

                    ranges = db_news.chgdivid.split("~");
                    tmpcurrStock.addCurrDividend(libCommon.Rand(Number(ranges[0]),Number(ranges[1])));
                }

                tmpcurrStock.setNewsList(_MakeNewsList(db_Manager.getStock(tmpcurrStock.index)));
            }
        }
    };
    _DeleteCurrStock = function(_id) {
        m_CurrStockDump.clear();
        for (var i = 0; i < m_CurrStockList.length; ++i) {
           if (m_CurrStockList[i].name === _id) {
            m_CurrStockList.splice(i,1);
              break;
           }
        }
        _SaveCurrStock();
    };
    _MakeJsonCurrStock = function() {
        var jsonArray = [];
        for(var i = 0; i < m_CurrStockList.length; ++i) {
            jsonArray.push(m_CurrStockList[i].getJson());
        }
        return jsonArray;
    };
    _SaveCurrStock = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("CurrentStock", function() {
                libCommon.write(libConst.fileNameList["CurrentStock"], _MakeJsonCurrStock());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["CurrentStock"], _MakeJsonCurrStock());
        }
    };

    _InitStock();

    return {
        CalcStock:_CalcStock,
        Delete:_DeleteUserStock,
        MakeAccount:function(_id) {
            var account = _FindUserStock(_id);
            var user = m_CManager.findUser(_id);
            var rtnStr = "";
            var user_loc, facilityDB;

            _CalcStock(_id);

            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("계좌개설")) {
                rtnStr = "현재 위치에서 주식 계좌를 개설할 수 없습니다.";
                return rtnStr;
            }

            if(account === null) {
                _CreateUserStock(_id);
                rtnStr = "주식 계좌를 개설 하였습니다.";
            }
            else {
                rtnStr = "이미 주식 계좌를 보유하고 있습니다.";
            }

            return rtnStr;
        },
        MyAccount:function(_id) {
            var account = _FindUserStock(_id);
            var user = m_CManager.findUser(_id);
            var myStockList, stockInfo;
            var tmpmystock, tmpcurrprice;
            var rtnStr = "", i;

            _CalcStock(_id);
            
            if(user === null)
                return "유저정보가 없습니다.";

            if(account !== null) {
                rtnStr = "[내 계좌]\n\n";

                myStockList = account.getStockList("all");

                for(i = 0; i < myStockList.length; ++i) {
                    tmpmystock = myStockList[i];
                    stockInfo = _FindCurrStock(tmpmystock.index);
                    tmpcurrprice = stockInfo.getCurrPrice();
                    rtnStr += (i+1) + ". " + stockInfo.name + "\n";
                    rtnStr += "   L 구매가 : " + tmpmystock.purchase_price + " rune\n";
                    rtnStr += "   L 갯수 : " + tmpmystock.count + "\n";
                    rtnStr += "   L 현재가 : " + tmpcurrprice + " rune\n";
                    rtnStr += "   L 수익 : " + ((tmpcurrprice - tmpmystock.purchase_price) * tmpmystock.count) + " rune\n";
                    rtnStr += "   L 현재배당금 : " + stockInfo.getCurrDividend() + " rune\n\n";
                }

                rtnStr += "수령된 배당금 : " + account.getAccrue() + " rune";
            }
            else {
                rtnStr = "개설된 계좌가 없습니다.";
            }

            return rtnStr;
        },
        ShowStockList:function(_id) {
            var user = m_CManager.findUser(_id);
            var rtnStr = "", tmpstock, dbnews;
            var user_loc, facilityDB, DT;

            _CalcStock(_id);
            
            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("주식구매")) {
                rtnStr = "현재 위치에서 주식을 구매할 수 없습니다.";
                return rtnStr;
            }
            DT = new Date(CalcTime + libConst.StockCalcTime);
            rtnStr += "다음 갱신 시간 : " + DT.getFullYear() + "년 " + (DT.getMonth() + 1) + "월 " + DT.getDate() + "일 " + DT.getHours() + ":" + DT.getMinutes()  + ":" + DT.getSeconds();

            rtnStr += "\n\n[구매 가능한 주식]\n\n";
            for(var i = 0; i < m_CurrStockList.length; ++i) {
                tmpstock = m_CurrStockList[i];
                tmpnews = tmpstock.getNewsList();

                rtnStr += (i+1) + ". [" + tmpstock.name + "]\n";
                rtnStr += "  - 현재가 : " + tmpstock.getCurrPrice() + " rune\n";
                rtnStr += "  - 배당금 : " + tmpstock.getCurrDividend() + " rune\n";
                rtnStr += "  - 뉴스\n";

                for(var j = 0; j < tmpnews.length; ++j) {
                    dbnews = db_Manager.getNews(tmpnews[j]);
                    rtnStr += "    L [" + dbnews.kind + "] " + dbnews.description + "\n";
                }
                rtnStr += "\n";
            }

            return rtnStr;
        },
        PurchaseStock:function(_id, _count, _stockname) {
            var account = _FindUserStock(_id);
            var user = m_CManager.findUser(_id);
            var rtnStr = "";
            var user_loc, facilityDB;
            var StockCurrInfo, totalRune;

            _CalcStock(_id);
            
            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("주식구매")) {
                rtnStr = "현재 위치에서 주식을 구매할 수 없습니다.";
                return rtnStr;
            }

            if(account !== null) {
                StockCurrInfo = _FindCurrStockByName(_stockname);
                if(StockCurrInfo !== null) {
                    totalRune = StockCurrInfo.getCurrPrice() * Number(_count);

                    if(user.addRune(-totalRune)) {
                        account.addStock(StockCurrInfo.index, StockCurrInfo.getCurrPrice(), Number(_count));
                        _SaveUserStock();
                        m_CManager.SaveUser();
                        rtnStr = _stockname +"을(를) " + _count + "개 구매하여 " + totalRune + "Rune을 지출하였습니다.";
                    }
                    else {
                        rtnStr = "소지룬이 부족하여 해당 주식을 구매할 수 없습니다.\n보유중인 룬을 확인하시기 바랍니다.";
                    }
                }
                else {
                    rtnStr = "해당 이름의 주식은 존재하지 않습니다.";
                }
            }
            else {
                rtnStr = "개설된 계좌가 없습니다.";
            }
            return rtnStr;
        },
        SaleStock:function(_id, _count, _stockname) {
            var account = _FindUserStock(_id);
            var user = m_CManager.findUser(_id);
            var rtnStr = "";
            var user_loc, facilityDB;
            var StockCurrInfo, totalRune;
            var FeePricee;

            _CalcStock(_id);
            
            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("주식판매")) {
                rtnStr = "현재 위치에서 주식을 판매할 수 없습니다.";
                return rtnStr;
            }

            if(account !== null) {
                StockCurrInfo = _FindCurrStockByName(_stockname);
                if(StockCurrInfo !== null) {
                    totalRune = StockCurrInfo.getCurrPrice() * Number(_count);

                    if(account.removeStock(StockCurrInfo.index, Number(_count))) {
                        FeePricee = Math.floor(totalRune - (totalRune * libConst.StockFee));
                        user.addRune(FeePricee);
                        _SaveUserStock();
                        m_CManager.SaveUser();
                        
                        rtnStr = _stockname +"을(를) " + _count + "개 판매하여 " + FeePricee + "Rune을 획득하였습니다.\n";
                        rtnStr += "  - 총 판매 금액 : " + totalRune + "Rune\n";
                        rtnStr += "  - 판매 수수료 : " + Math.floor(totalRune * libConst.StockFee) + "Rune\n";
                    }
                    else {
                        rtnStr = "해당 주식을 보유하지 않거나, 보유중인 수량 갯수를 넘어섰습니다.";
                    }
                }
                else {
                    rtnStr = "해당 이름의 주식은 존재하지 않습니다.";
                }
            }
            else {
                rtnStr = "개설된 계좌가 없습니다.";
            }
            return rtnStr;
        },
        CalcDividend:function(_id, _count, _stockname) {
            var account = _FindUserStock(_id);
            var user = m_CManager.findUser(_id);
            var rtnStr = "";
            var user_loc, facilityDB;
            var accrue;

            _CalcStock(_id);
            
            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("배당정산")) {
                rtnStr = "현재 위치에서 배당을 정산받을 수 없습니다.";
                return rtnStr;
            }

            if(account !== null) {
                accrue = account.getAccrue();
                account.addAccrue(-accrue);
                user.addRune(accrue);
                _SaveUserStock();
                m_CManager.SaveUser();
                rtnStr = "배당금을 정산받습니다. \n  - 정산금 : " + accrue + " rune";
            }
            else {
                rtnStr = "개설된 계좌가 없습니다.";
            }
            return rtnStr;
        }
    };
}

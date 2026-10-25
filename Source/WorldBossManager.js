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
const libObject = Bridge.getScopeOf("Object.js"); // Object Lib

var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체

function WorldBossManager(_postmgr) {
    var PostManager = _postmgr;
    var m_statusList = [];

    var _LoadData, _Find, _SearchMonsterIndex, _CreateWorldBossStatus, _GetStatus, _MakeJson, _getItemName, _Save, _Delete;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["WorldBossStatus"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_statusList.push(libObject.clsWorldBoss(tmpList[idx]));
        }
    }();

    _Find = function(_idx) {
        for (var i = 0; i < m_statusList.length; ++i) {
           if (m_statusList[i].index === _idx) {
              return m_statusList[i];
           }
        }
        return null;
    };
    _SearchMonsterIndex = function(_city, _facility) {
        return db_Manager.getWBLocalInfo(_city, _facility);
    };
    _CreateWorldBossStatus = function(_index, _fullhp) {
        var newobj = libObject.clsWorldBoss({index:_index,
                                            summonrune:0,
                                            rankinglist:[],
                                            runelist:[],
                                            bosshp:_fullhp,
                                            issummon:false});
        m_statusList.push(newobj);
        _Save();
        return newobj;

    };
    _GetStatus = function(_userLoc) {
        var bossinfo = _SearchMonsterIndex(_userLoc.city, _userLoc.facility);
        var monsterinfo = db_Manager.getMonster(bossinfo.monsteridx);
        var totalRune = 0;

        var status = _Find(bossinfo.monsteridx);
        if(status === null)
            status = _CreateWorldBossStatus(monsterinfo.index, monsterinfo.ability.hp);

        return status;
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_statusList.length; ++i) {
            jsonArray.push(m_statusList[i].getJson());
        }
        return jsonArray;
    };
    _getItemName = function(_idx, _kind) {
        var tmpitem = null;
        var db = null;
        if(_kind === libConst.ITEM_KIND.SUNDRYITEM){
            db = db_Manager.getSundryItem(_idx);
        }
        else if(_kind === libConst.ITEM_KIND.WEARITEM){
            db = db_Manager.getWearItem(_idx);
        }
        else if(_kind === libConst.ITEM_KIND.FUNCTIONALITYITEM){
            db = db_Manager.getFunctionalityItem(_idx);
        }
        return db.name;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("WorldBossStatus", function() {
                libCommon.write(libConst.fileNameList["WorldBossStatus"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["WorldBossStatus"], _MakeJson());
        }
    };
    _Delete = function(_id) {
        for(var i = 0; i < m_statusList.length; ++i) {
            m_statusList[i].delete(_id);
        }
        _Save();
    };

    return {
        Delete:_Delete,
        injectRune:function(_username, _userLoc, _rune) {
            var status = _GetStatus(_userLoc);
            totalRune = status.addSummonRune(_username, _rune);
            status.SortRecord();
            _Save();

            return totalRune;

        },
        getLocalBossInfo:function(_userLoc) {
            return _GetStatus(_userLoc).bossinfo;
        },
        getBossStatus:function(_userLoc) {
            return _GetStatus(_userLoc);
        },
        getMyinjectRune:function(_username, _userLoc) {
            var status = _GetStatus(_userLoc);
            return status.getMineRune(_username);
        },
        getTotalinjectRune:function(_userLoc) {
            var status = _GetStatus(_userLoc);
            return status.getSummonRune();
        },
        getRemainRune:function(_userLoc) {
            var status = _GetStatus(_userLoc);
            return Number(status.infoNeedRune()) - status.getSummonRune();
        },
        getSummonNeedrune:function(_userLoc) {
          var status = _GetStatus(_userLoc);
          return Number(status.infoNeedRune());
        },
        getSummonYN:function(_userLoc) {
            var status = _GetStatus(_userLoc);
            return status.isSummon();
        },
        getInjectList:function(_userLoc) {
            var status = _GetStatus(_userLoc);
            return status.getInjectRuneList();
        },
        getDamageRankList:function(_userLoc) {
          var status = _GetStatus(_userLoc);
          return status.getDamageRanker();
        },
        Summon:function(_userLoc) {
            var status = _GetStatus(_userLoc);
            var result = status.mkLegendMonster();
            _Save();

            return result;
        },
        ResultAndReward:function(_userLoc) {
            var ranklist, runelist, rewardlist;
            var status = _GetStatus(_userLoc);
            status.SortRecord();

            if(status.getHP() <= 0) {
                ranklist = status.getDamageRanker();
                runelist = status.getRuneRanker();
                rewardlist = status.getRewardList();

                var tmpReward, tmpRank, tmpRune, sndItemList = [], s;
                for(var i = 0; i < rewardlist.length; ++i) {
                    tmpReward = rewardlist[i];

                    for(var r = 0; r < ranklist.length; ++r) {
                        tmpRank = ranklist[r];
                        if(tmpReward.Ranking === tmpRank.rank.toString()) {
                            sndItemList = [];
                            for(s = 0; s < tmpReward.items.length; ++s) {
                                sndItemList.push(PostManager.mkItemObj(_getItemName(tmpReward.items[s].index, tmpReward.items[s].kind), tmpReward.items[s].count));
                            }
                            PostManager.postMsg(tmpRank.userid, sndItemList, tmpReward.rune, "[월드 보스 보상]\n데미지 " + tmpRank.rank + "위 보상을 전달 드립니다.");
                            libCommon.replyID(tmpRank.userid, "우편이 도착했습니다. '!우편' 명령어로 확인 하시기 바랍니다.");
                        }
                    }
                    for(var n = 0; n < runelist.length; ++n) {
                        tmpRune = runelist[n];
                        if(tmpReward.Ranking === tmpRune.rank.toString()) {
                            sndItemList = [];
                            for(s = 0; s < tmpReward.items.length; ++s) {
                                sndItemList.push(PostManager.mkItemObj(_getItemName(tmpReward.items[s].index, tmpReward.items[s].kind), tmpReward.items[s].count));
                            }
                            PostManager.postMsg(tmpRune.userid, sndItemList, tmpReward.rune, "[월드 보스 보상]\n룬 기부 " + tmpRune.rank + "위 보상을 전달 드립니다.");
                            libCommon.replyID(tmpRune.userid, "우편이 도착했습니다. '!우편' 명령어로 확인 하시기 바랍니다.");
                        }
                    }
                    status.initLegendMonster();
                }

                _Save();
                return true;
            }
            else {
                _Save();
                return false;
            }
        },
        checkAutoSummon: function() {
            var tmpStatus = null, rtnText = "";
            var currTime = (new Date()).getTime();
            var GapTime = 0, summonCnt = 0, remainTime = 0;
            var DBWorldBossInfo, DBAutoRate, judgment;

            for (var i = 0; i < m_statusList.length; ++i) {
                tmpStatus = m_statusList[i];

                if(tmpStatus.isSummon()) {
                    tmpStatus.setAutoSummonTime(currTime);
                    continue;
                }

                GapTime = currTime - Number(tmpStatus.getAutoSummonTime());
                summonCnt = Math.floor(GapTime / (libConst.WorldBossAutoSommon * 60000));
                remainTime = GapTime % (libConst.WorldBossAutoSommon * 60000);

                for(var t = 0; t < summonCnt; ++t) {
                    DBWorldBossInfo = db_Manager.getWBLocalInfobyIdx(tmpStatus.index);
                    DBAutoRate = Number(DBWorldBossInfo.autosnmrate);
                    judgment = libCommon.Randfloat(0,100);

                    if(judgment <= DBAutoRate) {
                        if(tmpStatus.autoSummonMonster()){
                            
                            rtnText += " - 월드보스 " + tmpStatus.name + "이(가) 자동 소환되었습니다.\n";
                        }
                        break;
                    }
                }
                tmpStatus.setAutoSummonTime(currTime - remainTime);
            }

            _Save();

            return rtnText;
        }
    };
}

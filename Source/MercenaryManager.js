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

function MercenaryManager() {
    var m_MineMercenaryList = [];
    var m_MineMercenaryDump = new libCommon.DumpModule();
    var _LoadData, _Find, _Delete, _MakeJson, _CreateMercenary, _Save;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["MercenaryList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_MineMercenaryList.push(libObject.clsMineMercenary(tmpList[idx]));
        }
    }();
    _Find = function(_id) {
        var i;
        for (i = 0; i < m_MineMercenaryDump.dumpList.length; ++i) {
           if (m_MineMercenaryDump.dumpList[i].name === _id) {
              m_MineMercenaryDump.resetTimeStemp(i);
              return m_MineMercenaryDump.dumpList[i];
           }
        }
        for (i = 0; i < m_MineMercenaryList.length; ++i) {
           if (m_MineMercenaryList[i].name === _id) {
              m_MineMercenaryDump.addDump(m_MineMercenaryList[i]);
              return m_MineMercenaryList[i];
           }
        }

        return _CreateMercenary(_id);
    };
    _Delete = function(_id) {
        m_MineMercenaryDump.clear();
        for (var i = 0; i < m_MineMercenaryList.length; ++i) {
           if (m_MineMercenaryList[i].name === _id) {
              m_MineMercenaryList.splice(i,1);
              break;
           }
        }
        _Save();
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_MineMercenaryList.length; ++i) {
            jsonArray.push(m_MineMercenaryList[i].getJson());
        }
        return jsonArray;
    };
    _CreateMercenary = function(_id) {
        var obj = {
             name:_id,
             mercenarylist:[]
         };

        m_MineMercenaryList.push(libObject.clsMineMercenary(obj));
        _Save();
        return m_MineMercenaryList[m_MineMercenaryList.length - 1];
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Mercenary", function() {
                libCommon.write(libConst.fileNameList["MercenaryList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["MercenaryList"], _MakeJson());
        }
    };

    return {
        Save:_Save,
        Find:_Find,
        Delete:function(_id) {
            _Delete(_id);
        },
        Hire:function(_id, _mercenaryidx){
            var merc = _Find(_id);
            var result =  merc.addMercenary(_mercenaryidx);
            _Save();

            return result;
        },
        Fire:function(_id, _arrayidx) {
            var merc = _Find(_id);
            var result = merc.removeMercenary(_arrayidx);
            _Save();

            return result;
        },
        getMercenary:function(_id) {
            var merc = _Find(_id);

            return merc.getMercenaryList();
        },
        AllHPMPRecovery:function(_id) {
            var merc = _Find(_id);
            var mercentList = merc.getMercenaryList();

            for(var i = 0; i < mercentList.length; ++i) {
                merc.recovery(i, "hp", 100);
                merc.recovery(i, "mp", 100);
                merc.recovery(i, "sp", 100);
            }
            _Save();
        },
        incExp:function(_id, _count) {
            var merc = _Find(_id);
            merc.incExp(_count);
            _Save();
        },
        ChangeMercenary:function(_id, _arrayidx, _name) {
            var merc = _Find(_id);
            var rtn = merc.ChangeMercenary(_arrayidx, _name);
            _Save();

            return rtn;
        },
        setUse:function(_id, _arrayidx, _use) {
            var merc = _Find(_id);
            var rtn = merc.setUse(_arrayidx, _use);
            _Save();

            return rtn;
        },
        activeMercenary:function(_mer) {
            m_MineMercenaryList.push(libObject.clsMineMercenary(_mer));
            _Save();
        }
    };
}

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


const libConst = Bridge.getScopeOf("Const.js");
var Session_Map = {}; // replier 저장 Obj
var Thread_Queue = [];    // 일반 메시지 큐

var SaveCounterList = {};
var SaveTimeList = {};
var SaveThreadList = {};
var SaveCallBackList = {};

var context = null;

function mkpath(_p_path)
{
    return libConst.rootPath + _p_path;
}
function read(_p_path)
{
    var rtnObj = null;

    try {
        rtnObj = JSON.parse(FileStream.read(mkpath(_p_path)));
    } catch(e) {
        log_e("read()", e);
    }

    return rtnObj;
}
function write(_p_path, _obj)
{
    try {
        FileStream.write(mkpath(_p_path), JSON.stringify(_obj));

    } catch(e) {
        log_e("write()", e);
    }
}
function read_text(_p_path)
{
    var rtnObj = null;
    try {
        rtnObj = FileStream.read(mkpath(_p_path));

    } catch(e) {
        log_e("read_text()", e);
    }
    return rtnObj;
}
function append_text(_p_path, _obj)
{
    var rtnObj = null;
    try {
        rtnObj = FileStream.append(mkpath(_p_path), _obj);

    } catch(e) {
        log_e("append_text()", e);
    }
    return rtnObj;
}
function delete_text(_p_path)
{
    try {
        FileStream.write(mkpath(_p_path), "");

    } catch(e) {
        log_e("delete_text()", e);
    }
}
function remove(_p_path)
{
    try {
        FileStream.remove(mkpath(_p_path));

    } catch(e) {
        log_e("remove()", e);
    }
}

function OccupyIncludeTime() {
    var result = false;
    var Curr = new Date();
    var Day = Curr.getDay()
    var Start = new Date();
    var End = new Date();

    Start.setHours(String(libConst.OccupyStartTime));
    Start.setMinutes("0");
    Start.setSeconds("0");

    End.setHours(String(libConst.OccupyStartTime));
    End.setMinutes("0");
    End.setSeconds("0");
    End.setTime(End.getTime() + libConst.OccupyTime * 60 * 1000);
    
    if(Day === libConst.OccupyDayofWeek) {
        log_i("Curr >= Start", Curr >= Start);
        log_i("Curr < End", Curr < End);
        log_i("Curr", Curr);
        log_i("Start", Start);
        log_i("End", End);
        if(Curr >= Start && Curr < End) {
            result = true;
        }
    }
    return result;
}

function getDayText(_index) {
    var text = "";
    switch(_index) {
        case 0: text="일"; break;
        case 1: text="월"; break;
        case 2: text="화"; break;
        case 3: text="수"; break;
        case 4: text="목"; break;
        case 5: text="금"; break;
        case 6: text="토"; break;
    }
    return text;
}


function Rand(_start, _end){
    return (_start + Math.floor(Math.random() * (_end - _start + 1)));
}
function Randfloat(_start, _end) {
    var floatNum = (_start + (Math.random() * (_end - _start)));

    return floatNum;
}

function saveSession(roomName, replier) {
    if (!roomName || !replier) return;
    Session_Map[roomName] = replier;
}

function replyID(_id, _msg) {
    if (!_id || !_msg) return;

    Thread_Queue.push({ id: _id, msg: _msg });

    if (Thread_Queue.length > 1) return;

    new java.lang.Thread({
        run: function() {
            try {
                java.lang.Thread.sleep(150);

                while (Thread_Queue.length > 0) {
                    var currentTask = Thread_Queue[0];
                    var targetRoom = currentTask.id;
                    var message = currentTask.msg;

                    if (Session_Map[targetRoom]) {
                        Session_Map[targetRoom].reply(message);
                    } else if (typeof Api !== "undefined" && Api.canReply(targetRoom)) {

                        Api.replyRoom(targetRoom, message);
                    } else {
                        if (typeof log_e === "function") {
                            log_e("replyID", targetRoom + " 방의 전송 세션을 찾을 수 없습니다.");
                        }
                    }

                    Thread_Queue.splice(0, 1);

                    java.lang.Thread.sleep(200);
                }
            } catch (e) {
                if (typeof log_e === "function") {
                    log_e("replyID Error", e);
                }
            }
        }
    }).start();
}
function replyIDbyArray(_idlist, _msg) {
    for(var i = 0; i < _idlist.length; ++i) {
        replyID(_idlist[i], _msg);
    }
}
function AlarmMainRoom(_msg) {
    for(var i = 0; i < libConst.MainRoomName.length; ++i) {
        if(libConst.MainRoomAlarm[i]){
            replyID(libConst.MainRoomName[i], _msg);
        }
    }
}

function log_i(_funcName, _data)
{
    if(libConst.def_Log)
      Log.i(_funcName + " func --- " + _data);
}
function log_e(_funcName, _data)
{
    if(libConst.def_Log)
      Log.e(_funcName + " func --- " + _data);
}
function TS(_data) {
    if(libConst.def_Log)
      Log.e("[" + (new Date).getTime() + "] " + _data);
}

var DumpModule = function() {
    this.dumpList = [];
    this.timeStemp = [];
    this.Lock = false;

    this.removeDumpTimeout = function() {
        if(!this.Lock) {
            this.Lock = true;
            var tmp;
            for(var i = 0; i < this.timeStemp.length; ++i) {
                tmp = this.timeStemp[i];
                if((new Date()).getTime() - tmp > libConst.DumpTimeOut)
                {
                    this.dumpList.splice(i,1);
                    this.timeStemp.splice(i,1);
                }
            }
            this.Lock = false;
        }
    };
    this.addDump = function(_obj) {
        if(!this.Lock) {
            this.dumpList.push(_obj);
            this.timeStemp.push((new Date()).getTime());
            this.removeDumpTimeout();
        }
    };
    this.resetTimeStemp = function(_idx) {
        if(!this.Lock)
            this.timeStemp[_idx] = (new Date()).getTime();
    };
    this.clear = function() {
        if(!this.Lock) {
            this.Lock = true;
            this.dumpList = [];
            this.timeStemp = [];
            this.Lock = false;
        }
    };
};

var MapLinkedList = function(_index, _gate, _name, _power, _boss, _moblist, _count, _rune, _itemlist, _desc) {
    this.Direction = []; // 연결된 다른 맵 인덱스
    this.Index = _index;    // 인덱스
    this.Gate = _gate;      //출입구 종류
    this.Name = _name;      // 맵 이름
    this.PowerRate = _power;    // 파워배율
    this.Boss = _boss;      // 보스몹 인덱스 (없으면 -1)
    this.Monster = _moblist; // 몹 인덱스 리스트
    this.MobCount = _count; // 총 몬스터 숫자
    this.Rune = _rune;  // 클리어 보상 룬
    this.ClearItem = _itemlist; // 클리어 보상 템
    this.isClear = false;   // 클리어한 맵 유무
    this.Description = _desc;   // 맵 설명

    this.Mappush = function(_map) {
        if(this.getMakeRate()) {
            if(_map.Direction.push(this)) {
                this.Direction.push(_map);
                return true;
            }
        }
        return false;
    };
    this.getDirectionCount = function() {
        return this.Direction.length;
    };
    this.getMakeRate = function() {
        if(this.Direction.length <= 1) {
            return true;
        }
        else if(this.Direction.length === libConst.DungeonCrossCount){
            return false;
        }
        else {
            if(Rand(0,1) === 0) {
                return true;
            }
            else {
                return false;
            }
        }
    };
    this.ContainIndex = function(_idx) {
        var tmpObj = null;
        for(var i = 0; i < this.Direction.length; ++i) {
            tmpObj = this.Direction[i];

            if(tmpObj.Index === _idx)
                return true;
        }
        return false;
    };
};

function StartSaveThread(_funcID, _callBack) {
    if(SaveCounterList[_funcID] === undefined) {
        SaveCounterList[_funcID] = 0;
        SaveTimeList[_funcID] = libConst.SaveCycle;
        SaveThreadList[_funcID] = null;
        SaveCallBackList[_funcID] = _callBack;
    }

    if(SaveThreadList[_funcID] === null) {
        SaveTimeList[_funcID] = libConst.SaveCycle;
        SaveThreadList[_funcID] = new java.lang.Thread() {
            run:function() {
                var tmpThread = null;
                try {
                    while(true) {
                        java.lang.Thread.sleep(1000);
                        tmpThread = SaveThreadList[_funcID];
                        if(SaveCounterList[_funcID] >= libConst.SaveMaxCount) {
                            //log_i("SaveThread", "Counter 0 : Saved >> " + _funcID );
                            Api.showToast("Counter 0 : Saved >> " + _funcID , Toast.LENGTH_SHORT);
                            SaveCounterList[_funcID] = 0;
                            SaveCallBackList[_funcID]();
                            SaveThreadList[_funcID] = null;
                            break;
                        }
                        SaveTimeList[_funcID]--;
                        if(SaveTimeList[_funcID] <= 0) {
                            //log_i("SaveThread", "Timer 0 : Saved >> " + _funcID );
                            Api.showToast("Timer 0 : Saved >> " + _funcID , Toast.LENGTH_SHORT);
                            SaveCounterList[_funcID] = 0;
                            SaveCallBackList[_funcID]();
                            SaveThreadList[_funcID] = null;
                            break;
                        }
                    }
                }
                catch (e) {
                    log_e("StartSaveThread", e);
                } finally {
                    if(tmpThread !== undefined && tmpThread !== null)
                        tmpThread.interrupt();
                    tmpThread = null;
                }
                
            }
        }.start();
    }
    else {
        SaveTimeList[_funcID] = libConst.SaveCycle;
    }
    SaveCounterList[_funcID]++;

}


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
}
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
var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체

function clsUserInfo(_info) {
    var m_id = _info.id,
        m_pwd = _info.pwd,
        m_key = _info.key,
        m_mainroom = (_info.mainroom === undefined?{authcode:null, roomname:null, key:null, id:null}:_info.mainroom),
        m_shortcut = (_info.shortcut === undefined?{}:_info.shortcut),
        m_logintime = (_info.logintime === undefined?-1:_info.logintime),
        m_sleepaccount = (_info.sleepaccount === undefined?"N":_info.sleepaccount), // 휴면여부 "Y" or "N"
        m_login_state = false;

    var f_equalID,
        f_equalPWD,
        tmp_logintime = -1;

    f_equalID = function(_id) {
        return m_id === _id;
    };
    f_equalPWD = function(_pwd) {
        return m_pwd === _pwd;
    };

    return {
        id:m_id,
        loginstate:function() {
            return m_login_state;
        },
        changePwd:function(_pwd){
            m_pwd = _pwd;
        },
        equal:function(_obj) { // _obj는 clsUserInfo클래스 객체
            return f_equalID(_obj.id) && f_equalPWD(_obj.pwd);
        },
        setState:function(_state) { // true는 로그인상태, false는 비로그인상태
            m_login_state = _state;
        },
        setLoginTime:function() {
            tmp_logintime = m_logintime;
            m_logintime = (new Date()).getTime();
        },
        getLoginTime:function() {
            return m_logintime;
        },
        getBeforeLoginTime:function() {
            return tmp_logintime;
        },
        getJson:function() {
            return {id:m_id, pwd:m_pwd, key:m_key, mainroom:m_mainroom, shortcut:m_shortcut, logintime:m_logintime, sleepaccount:m_sleepaccount};
        },
        equalKey:function(_key) {
            if(_key === m_key)
                return true;
            return false;
        },
        setKey:function(_key) {
            m_key = _key;
        },
        getShortCut:function(_index) {
            return m_shortcut[_index];
        },
        getAllShortCut:function() {
            return m_shortcut;
        },
        addShortCut:function(_index, _text) {
            if(m_shortcut[_index] === undefined || m_shortcut[_index] === null) {
                m_shortcut[_index] = [];
            }
            if(m_shortcut[_index].length < libConst.ShortCutCount) {
                m_shortcut[_index].push(_text);
                return true;
            }
            else {
                return false;
            }
        },
        clearShortCut:function(_index) {
            if(m_shortcut[_index] === undefined || m_shortcut[_index] === null) {
                m_shortcut[_index] = [];
            }
            m_shortcut[_index].splice(0);
        },
        setSleepAccount:function(_issleep) {
            m_sleepaccount = _issleep;
        },
        getSleepAccount:function() {
            return m_sleepaccount;
        },
        setAuthCode:function(_code) {
            m_mainroom.id = "";
            m_mainroom.roomname = "";
            m_mainroom.key = "";
            m_mainroom.authcode = _code;
        },
        equalAuthCode:function(_code) {
            return String(m_mainroom.authcode) === _code;
        },
        setAuthMainInfo:function(_id, _room, _key) {
            m_mainroom.id = _id;
            m_mainroom.roomname = _room;
            m_mainroom.key = _key;
            m_mainroom.authcode = null;
        },
        equalSubRoom:function(_id, _room, _key) {
            return (m_mainroom.id === _id && m_mainroom.roomname === _room && m_mainroom.key === _key);
        },
        equalSubRoomWithoutRoom:function(_id, _key) {
            return (m_mainroom.id === _id && m_mainroom.key === _key);
        }
    };
}

const ENUM_MAKE_CHARACTOR = {NONE:-1, START:0, MAKING:1, COMPLITE:2};
const EQUIPMENTNAME = ["head", "body", "leg", "glove", "shoes", "righthand", "lefthand", "earing", "necklace", "ring1", "ring2", "backdeco"];
const LOCATION_INFO = ["country", "city", "facility", "field", "dungeon", "home"];
const ABILITY_NAME = ["attack", "magic", "defense", "atkspeed", "accuracy", "avoid", "critical", "friendly", "godevil"];
const MINEITEMLIST = db_Manager.getMineList();
function clsCharactor(_charinfo, _generate, make_stat) {

    var m_name = _charinfo.name, // 이름
        m_species = _charinfo.species, // 종족
        m_rune = _charinfo.rune, // 통합재화
        m_purchasestat = _charinfo.purchasestat, //(현재 스텟 구매 카운터)
        m_status = _charinfo.status, //{str, con, dex, agi, int, luk, ept, com, spr } 힘, 체질, 민첩, 재주, 지능, 운, 효율 교감 영혼
        m_ability = _charinfo.ability, //{attack, magic, defense, atkspeed, accuracy, avoid, critical, friendly, godevil, hp, mp, sp, dp, ap} 공격, 마공, 방어, 공속, 정확도, 회피, 크리, 친화력, 신마력, 체력, 마력, 기력, 정신력, 행동력
        m_vitality = (_charinfo.vitality === undefined?{technic:0, wisdom:0, insight:0}:_charinfo.vitality), // {technic, wisdom, insight} 기술력, 지혜, 통찰력
        m_accrue_aptime = (libConst.AutoAPRecovery?(_charinfo.accrue_aptime === undefined?(new Date()).getTime():_charinfo.accrue_aptime):-1), // 자동회복 Ap 획득시간
        m_talent = _charinfo.talent, //특기 [index, ....]
        m_skill = _charinfo.skill, // 스킬 [index, ....]
        m_smnskill = (_charinfo.smnskill === undefined?[]:_charinfo.smnskill), // 소환스킬 [index ....]
        m_smntype = (_charinfo.smntype === undefined?"":_charinfo.smntype), // 소환타입
        m_buff = (_charinfo.buff === undefined?[]:_charinfo.buff), // 버프 [{stat, amount, count} ....]
        m_inventory = _charinfo.inventory, // 가방 [{kind, index, count, strength}  ....]
        m_equipment = _charinfo.equipment, // 장착 {head, body, leg, glove, shoes, righthand, lefthand, earing, necklace, ring1, ring2, backdeco} 머리, 몸, 다리, 장갑, 신발, 오른손, 왼손, 귀걸이, 목걸이, 링, 링, 등장식
        m_equipmentlevel = _charinfo.equipmentlevel, // 장착 장비 레벨 {head, body, leg, glove, shoes, righthand, lefthand, earing, necklace, ring1, ring2, backdeco}
        m_location = _charinfo.location, // 왕국 위치 {country, city, facility, field, dungeon, home}
        m_miningtime = _charinfo.miningtime,
        m_fellingtime = (_charinfo.fellingtime === undefined?-1:_charinfo.fellingtime),
        m_stoningtime = (_charinfo.stoningtime === undefined?-1:_charinfo.stoningtime),
        m_gettingtime = (_charinfo.gettingtime === undefined?-1:_charinfo.gettingtime),
        m_playdungeontime = (_charinfo.playdungeontime === undefined?-1:_charinfo.playdungeontime),
        m_passport = _charinfo.passport, //[index .... ]
        m_questlist = _charinfo.questlist, //[{index, goal} .... ]
        m_complitequest = _charinfo.complitequest, //[index .... ]
        m_clan = _charinfo.clan,        // 클랜명
        m_clanbuff = _charinfo.clanbuff,        // 클랜 버프
        m_recipe = (_charinfo.recipe === undefined?[]:_charinfo.recipe),        // 레시피
        m_loan = _charinfo.loan,        // 대출 및 예금 {kind, index, rune, time,  }
        m_tower = _charinfo.tower,        // 타워 기록 {city, facility, floor}
        m_isdungeon = (_charinfo.isdungeon === undefined?false:_charinfo.isdungeon),  // 던전 플레이중 유무
        m_isoccupy = (_charinfo.isoccupy === undefined?false:_charinfo.isoccupy),  // 점령전 플레이중 유무
        m_dungeonloc = (_charinfo.dungeonloc === undefined?null:_charinfo.dungeonloc),  // 현재 던전/점령전 맵 위치
        m_writer = (_charinfo.writer === undefined?"F":_charinfo.writer);        // 작가 권한 유무 "F", "T"

    var m_generation = _generate,
        m_make_stat = make_stat,
        m_curr_loc,
        m_target_quest = "";

    var _Init, _CalcAbility, _FindInventory, _FindInventoryOverStrength, _Recovery, _RecoveryforNum, _MaxPoint, _MiningResult, _FellingResult, 
        _StoningResult, _GettingResult, _FindFloor, _CalcAutoRecoveryAP, _AutoRecoveryAPEnd;

    _Init = function() {
        var i;
        for(i = LOCATION_INFO.length -1; i >= 0; --i){
            if(m_location[LOCATION_INFO[i]] !== "") {

                m_curr_loc = LOCATION_INFO[i];
                break;
            }
        }
        
        if(m_species !== "")
            _CalcAbility(false);
    };
    _CalcAbility = function(_notpoint) {
        var uspecies = db_Manager.getSpecies(m_species);
        var w_db = db_Manager.getWearItem(m_equipment[EQUIPMENTNAME[5]]), t_db, s_db;
        var i, s, tmp, level;
        var buff = {attack:0, defense:0, atkspeed:0, magic:0, accuracy:0, critical:0, avoid:0, friendly:0, godevil:0, hp:0, mp:0, sp:0, dp:0, ap:0, technic:0, wisdom:0, insight:0};
        var P_strength, C_strength = {attack:1, defense:1, atkspeed:1, magic:1, accuracy:1, critical:1, avoid:1, friendly:1, godevil:1, hp:1, mp:1, sp:1, dp:1, ap:1, technic:1, wisdom:1, insight:1};
        var t_hp = 0, t_mp = 0, t_sp = 0, t_dp = 0, t_ap = 0;
        var potionbuff = {str:0, con:0, dex:0, agi:0, int:0, luk:0, ept:0, com:0, spr:0};
        for(i = 0; i < m_buff.length; ++i) {
            potionbuff[m_buff[i].stat] += m_buff[i].amount;
        }

        var str = Math.floor((m_status.str + potionbuff.str)* Number(uspecies.inc_stat.str)),
        con = Math.floor((m_status.con + potionbuff.con) * Number(uspecies.inc_stat.con)),
        dex = Math.floor((m_status.dex + potionbuff.dex) * Number(uspecies.inc_stat.dex)),
        agi = Math.floor((m_status.agi + potionbuff.agi) * Number(uspecies.inc_stat.agi)),
        int = Math.floor((m_status.int + potionbuff.int) * Number(uspecies.inc_stat.int)),
        luk = Math.floor((m_status.luk + potionbuff.luk) * Number(uspecies.inc_stat.luk)),
        ept = Math.floor((m_status.ept + potionbuff.ept) * Number(uspecies.inc_stat.ept)),
        com = Math.floor((m_status.com + potionbuff.com) * Number(uspecies.inc_stat.com)),
        spr = Math.floor((m_status.spr + potionbuff.spr) * Number(uspecies.inc_stat.spr));

        for(i = 0; i < m_clanbuff.length; ++i) {
            tmp = m_clanbuff[i];
            buff[tmp.target] += tmp.percent;
        }

        if(w_db !== null && w_db.kind === libConst.WearItem_Kind.Far_Weapon)
            m_ability.attack = Math.floor(eval(libConst.FarAttack) * (1 + buff.attack/100));
        else
            m_ability.attack = Math.floor(eval(libConst.NearAttack) * (1 + buff.attack/100));
        m_ability.magic = Math.floor(eval(libConst.MagicAttack) * (1 + buff.magic/100));
        m_ability.defense = Math.floor(eval(libConst.Defense) * (1 + buff.defense/100));
        m_ability.atkspeed = Math.floor(eval(libConst.AttackSpeed) * (1 + buff.atkspeed/100));
        m_ability.accuracy = Math.floor(eval(libConst.Accuracy) * (1 + buff.accuracy/100));
        m_ability.avoid = Math.floor(eval(libConst.Avoid) * (1 + buff.avoid/100));
        m_ability.critical = Math.floor(eval(libConst.Critical) * (1 + buff.critical/100));
        m_ability.friendly = Math.floor(eval(libConst.Friendly) * (1 + buff.friendly/100));
        m_ability.godevil = Math.floor(eval(libConst.Godevil) * (1 + buff.godevil/100));

        m_vitality.technic = Math.floor(eval(libConst.Technic) * (1 + buff.technic/100));
        m_vitality.wisdom = Math.floor(eval(libConst.Wisdom) * (1 + buff.wisdom/100));
        m_vitality.insight = Math.floor(eval(libConst.Insight) * (1 + buff.insight/100));

        t_hp = Math.floor(eval(libConst.Hp) * (1 + buff.hp/100));
        t_mp = Math.floor(eval(libConst.Mp) * (1 + buff.mp/100));
        t_sp = Math.floor(eval(libConst.Sp) * (1 + buff.sp/100));
        t_dp = Math.floor(eval(libConst.Dp) * (1 + buff.dp/100));
        t_ap =  Math.floor((libConst.DefaultAP + eval(libConst.Ap)) * (1 + buff.ap/100));

        for(i = 0; i < m_talent.length; ++i) {
            t_db = db_Manager.getProperty(m_talent[i]);
            if(t_db === null)
                continue;
            m_ability.attack += Number(t_db.performance.attack);
            m_ability.magic += Number(t_db.performance.magic);
            m_ability.defense += Number(t_db.performance.defense);
            m_ability.atkspeed += Number(t_db.performance.atkspeed);
            m_ability.accuracy += Number(t_db.performance.accuracy);
            m_ability.avoid += Number(t_db.performance.avoid);
            m_ability.critical += Number(t_db.performance.critical);
            m_ability.friendly += Number(t_db.performance.friendly);
            m_ability.godevil += Number(t_db.performance.godevil);
            m_vitality.technic += Number(t_db.performance.technic);
            m_vitality.wisdom += Number(t_db.performance.wisdom);
            m_vitality.insight += Number(t_db.performance.insight);
            t_hp += Number(t_db.performance.hp);
            t_mp += Number(t_db.performance.mp);
            t_sp += Number(t_db.performance.sp);
            t_dp += Number(t_db.performance.dp);
            t_ap += Number(t_db.performance.ap);
        }

        for(i = 0; i < EQUIPMENTNAME.length; ++i) {
            w_db = db_Manager.getWearItem(m_equipment[EQUIPMENTNAME[i]]);
            level = m_equipmentlevel[EQUIPMENTNAME[i]];
            if(w_db === null)
                continue;
            P_strength = {attack:0, defense:0, atkspeed:0, magic:0, accuracy:0, critical:0, avoid:0, friendly:0, godevil:0, hp:0, mp:0, sp:0, dp:0, ap:0, technic:0, wisdom:0, insight:0};


            for(s = 0; s < level; ++s) {
                s_db = db_Manager.getStrengthList(w_db.strength[s]);
                if(s_db.unit === "PLUS") {
                    P_strength[s_db.performance] += Number(s_db.value);
                }
                else if(s_db.unit === "PERCENT") {
                    C_strength[s_db.performance] += (Number(s_db.value) / 100);
                }
            }

            m_ability.attack += Number(w_db.performance.attack) + P_strength.attack;
            m_ability.magic += Number(w_db.performance.magic) + P_strength.magic;
            m_ability.defense += Number(w_db.performance.defense) + P_strength.defense;
            m_ability.atkspeed += Number(w_db.performance.atkspeed) + P_strength.atkspeed;
            m_ability.accuracy += Number(w_db.performance.accuracy) + P_strength.accuracy;
            m_ability.avoid += Number(w_db.performance.avoid) + P_strength.avoid;
            m_ability.critical += Number(w_db.performance.critical) + P_strength.critical;
            m_ability.friendly += Number(w_db.performance.friendly) + P_strength.friendly;
            m_ability.godevil += Number(w_db.performance.godevil) + P_strength.godevil;
            m_vitality.technic += Number(w_db.performance.technic) + P_strength.technic;
            m_vitality.wisdom += Number(w_db.performance.wisdom) + P_strength.wisdom;
            m_vitality.insight += Number(w_db.performance.insight) + P_strength.insight;
            t_hp += Number(w_db.performance.hp) + P_strength.hp;
            t_mp += Number(w_db.performance.mp) + P_strength.mp;
            t_sp += Number(w_db.performance.sp) + P_strength.sp;
            t_dp += Number(w_db.performance.dp) + P_strength.dp;
            t_ap += Number(w_db.performance.ap) + P_strength.ap;
        }

        m_ability.attack = Math.floor(m_ability.attack * C_strength.attack);
        m_ability.magic = Math.floor(m_ability.magic * C_strength.magic);
        m_ability.defense = Math.floor(m_ability.defense * C_strength.defense);
        m_ability.atkspeed = Math.floor(m_ability.atkspeed * C_strength.atkspeed);
        m_ability.accuracy = Math.floor(m_ability.accuracy * C_strength.accuracy);
        m_ability.avoid = Math.floor(m_ability.avoid * C_strength.avoid);
        m_ability.critical = Math.floor(m_ability.critical * C_strength.critical);
        m_ability.friendly = Math.floor(m_ability.friendly * C_strength.friendly);
        m_ability.godevil = Math.floor(m_ability.godevil * C_strength.godevil);
        m_vitality.technic =  Math.floor(m_vitality.technic * C_strength.technic);
        m_vitality.wisdom =  Math.floor(m_vitality.wisdom * C_strength.wisdom);
        m_vitality.insight =  Math.floor(m_vitality.insight * C_strength.insight);
        t_hp = Math.floor(t_hp * C_strength.hp);
        t_mp = Math.floor(t_mp * C_strength.mp);
        t_sp = Math.floor(t_sp * C_strength.sp);
        t_dp = Math.floor(t_dp * C_strength.dp);
        t_ap = Math.floor(t_ap * C_strength.ap);
        if(_notpoint) {
            m_ability.hp = t_hp;
            m_ability.mp = t_mp;
            m_ability.sp = t_sp;
            m_ability.dp = t_dp;
            m_ability.ap = t_ap;
        }
        else {
            if(t_hp < m_ability.hp) {
                m_ability.hp = t_hp;
            }
            if(t_mp < m_ability.mp) {
                m_ability.mp = t_mp;
            }
            if(t_sp < m_ability.sp) {
                m_ability.sp = t_sp;
            }
            if(t_dp < m_ability.dp) {
                m_ability.dp = t_dp;
            }
            if(t_ap < m_ability.ap) {
                m_ability.ap = t_ap;
            }
        }
    };
    _Recovery = function(_target, _percent) {
        var sumPoint = _MaxPoint(_target), percentPoint;

        percentPoint = Math.floor(sumPoint * _percent / 100);
        m_ability[_target] += percentPoint;

        if(m_ability[_target] > sumPoint)
            m_ability[_target] = sumPoint;

    };
    _RecoveryforNum = function(_target, _plus) {
        var sumPoint = _MaxPoint(_target);

        m_ability[_target] += _plus;
        if(m_ability[_target] > sumPoint)
            m_ability[_target] = sumPoint;

    };
    _FindInventory = function(_kind, _itemindx, _strength) {
        var item;
        for(var i = 0; i < m_inventory.length; ++i) {
            item = m_inventory[i];
            if(item.kind === _kind && item.index === _itemindx && item.strength === _strength)
                return i;
        }
        return -1;
    };
    _FindInventoryOverStrength = function(_kind, _itemindx, _strength) {
        var item, rtnArray = [];
        for(var i = 0; i < m_inventory.length; ++i) {
            item = m_inventory[i];
            if(item.kind === _kind && item.index === _itemindx && Number(item.strength) >= _strength)
                rtnArray.push(item);
        }
        return rtnArray;
    };
    _MaxPoint = function(_target) {
        var uspecies = db_Manager.getSpecies(m_species), level;
        var buff = {attack:0, defense:0, atkspeed:0, magic:0, accuracy:0, critical:0, avoid:0, friendly:0, godevil:0, hp:0, mp:0, sp:0, dp:0, ap:0, technic:0, wisdom:0, insight:0};
        var P_strength, C_strength = {attack:1, defense:1, atkspeed:1, magic:1, accuracy:1, critical:1, avoid:1, friendly:1, godevil:1, hp:1, mp:1, sp:1, dp:1, ap:1, technic:1, wisdom:1, insight:1};


        var sumPoint = 0, w_db, t_db, s_db;
        var i, s, tmp;
        var potionbuff = {str:0, con:0, dex:0, agi:0, int:0, luk:0, ept:0, com:0, spr:0};
        for(i = 0; i < m_buff.length; ++i) {
            potionbuff[m_buff[i].stat] += m_buff[i].amount;
        }

        var str = Math.floor((m_status.str + potionbuff.str)* Number(uspecies.inc_stat.str)),
        con = Math.floor((m_status.con + potionbuff.con) * Number(uspecies.inc_stat.con)),
        dex = Math.floor((m_status.dex + potionbuff.dex) * Number(uspecies.inc_stat.dex)),
        agi = Math.floor((m_status.agi + potionbuff.agi) * Number(uspecies.inc_stat.agi)),
        int = Math.floor((m_status.int + potionbuff.int) * Number(uspecies.inc_stat.int)),
        luk = Math.floor((m_status.luk + potionbuff.luk) * Number(uspecies.inc_stat.luk)),
        ept = Math.floor((m_status.ept + potionbuff.ept) * Number(uspecies.inc_stat.ept)),
        com = Math.floor((m_status.com + potionbuff.com) * Number(uspecies.inc_stat.com)),
        spr = Math.floor((m_status.spr + potionbuff.spr) * Number(uspecies.inc_stat.spr));


        for(i = 0; i < m_clanbuff.length; ++i) {
            tmp = m_clanbuff[i];
            buff[tmp.target] += tmp.percent;
        }

        switch(_target) {
            case "hp":
                sumPoint = Math.floor(eval(libConst.Hp) * (1 + buff.hp/100));
                break;
            case "mp":
                sumPoint = Math.floor(eval(libConst.Mp) * (1 + buff.mp/100));
                break;
            case "sp":
                sumPoint = Math.floor(eval(libConst.Sp) * (1 + buff.sp/100));
                break;
            case "dp":
                sumPoint = Math.floor(eval(libConst.Dp) * (1 + buff.dp/100));
                break;
            case "ap":
                sumPoint = Math.floor((libConst.DefaultAP + eval(libConst.Ap)) * (1 + buff.ap/100));
                break;
        }

        for(i = 0; i < m_talent.length; ++i) {
            t_db = db_Manager.getProperty(m_talent[i]);
            if(t_db === null)
                continue;

            sumPoint += Number(t_db["performance"][_target]);
        }

        for(i = 0; i < EQUIPMENTNAME.length; ++i) {
            w_db = db_Manager.getWearItem(m_equipment[EQUIPMENTNAME[i]]);
            level = m_equipmentlevel[EQUIPMENTNAME[i]];
            if(w_db === null)
                continue;
            P_strength = {attack:0, defense:0, atkspeed:0, magic:0, accuracy:0, critical:0, avoid:0, friendly:0, godevil:0, hp:0, mp:0, sp:0, dp:0, ap:0, technic:0, wisdom:0, insight:0};

            for(s = 0; s < level; ++s) {
                s_db = db_Manager.getStrengthList(w_db.strength[s]);
                if(s_db.unit === "PLUS") {
                    P_strength[s_db.performance] += Number(s_db.value);
                }
                else if(s_db.unit === "PERCENT") {
                    C_strength[s_db.performance] += (Number(s_db.value) / 100);
                }
            }

            sumPoint += Number(w_db["performance"][_target]) + P_strength[_target];
        }

        sumPoint = Math.floor(sumPoint * C_strength[_target]);

        return sumPoint;
    };
    _MiningResult = function(_past_time, _buff) {
        var currTime = (new Date()).getTime();
        var remineTime = currTime - _past_time;
        var chance = Math.floor(remineTime / (libConst.MiningDefaultSpeed - (libConst.MiningDefaultSpeed * _buff / 100)));
        var tmpRand, rtnArray = [];
        var preRate = 0, currRate = 0;

        if(chance > libConst.MiningMaxCount) {
            chance = libConst.MiningMaxCount;
        }

        for(var i = 0; i < chance; ++i){
            tmpRand = libCommon.Randfloat(0,100);
            preRate = 0;
            currRate = 0;
            for(var m = 0; m < MINEITEMLIST.length; ++m) {
                preRate += (m===0?0:db_Manager.getMineRate(MINEITEMLIST[m - 1]));
                currRate += db_Manager.getMineRate(MINEITEMLIST[m]);
                if(tmpRand >= preRate && tmpRand < currRate) {
                    rtnArray.push(MINEITEMLIST[m]);
                    break;
                }
            }
        }

        return rtnArray;
    };
    _FellingResult = function(_city, _facility, _past_time, _buff) {
        var currTime = (new Date()).getTime();
        var remineTime = currTime - _past_time;
        var chance = Math.floor(remineTime / (libConst.FellingDefaultSpeed - (libConst.FellingDefaultSpeed * _buff / 100)));
        var tmpRand, rtnArray = [], i, tmpFell;
        var preRate = 0, currRate = 0;
        var dbFellList = db_Manager.getTreeList(_city, _facility);
        var maxRate = 0;

        for(i = 0; i < dbFellList.length; ++i) {
            maxRate += Number(dbFellList[i].rate);
        }

        if(chance > libConst.FellingMaxCount) {
            chance = libConst.FellingMaxCount;
        }

        for(i = 0; i < chance; ++i) {
            tmpRand = libCommon.Randfloat(0,maxRate);
            preRate = 0;
            currRate = 0;
            for(var m = 0; m < dbFellList.length; ++m) {
                tmpFell = dbFellList[m];
                preRate += (m===0?0:Number(dbFellList[m-1].rate));
                currRate += Number(tmpFell.rate);
                if(tmpRand >= preRate && tmpRand < currRate) {
                    rtnArray.push({index:tmpFell.item, count:tmpFell.count, kind:tmpFell.itemkind});
                    break;
                }
            }
        }
        return rtnArray;
    };
    _StoningResult = function(_city, _facility, _past_time, _buff) {
        var currTime = (new Date()).getTime();
        var remineTime = currTime - _past_time;
        var chance = Math.floor(remineTime / (libConst.StoningDefaultSpeed - (libConst.StoningDefaultSpeed * _buff / 100)));
        var tmpRand, rtnArray = [], i, tmpStone;
        var preRate = 0, currRate = 0;
        var dbStoneList = db_Manager.getStoneList(_city, _facility);
        var maxRate = 0;

        for(i = 0; i < dbStoneList.length; ++i) {
            maxRate += Number(dbStoneList[i].rate);
        }

        if(chance > libConst.StoningMaxCount) {
            chance = libConst.StoningMaxCount;
        }

        for(i = 0; i < chance; ++i) {
            tmpRand = libCommon.Randfloat(0,maxRate);
            preRate = 0;
            currRate = 0;
            for(var m = 0; m < dbStoneList.length; ++m) {
                tmpStone = dbStoneList[m];
                preRate += (m===0?0:Number(dbStoneList[m-1].rate));
                currRate += Number(tmpStone.rate);
                if(tmpRand >= preRate && tmpRand < currRate) {
                    rtnArray.push({index:tmpStone.item, count:tmpStone.count, kind:tmpStone.itemkind});
                    break;
                }
            }
        }
        return rtnArray;
    };
    _GettingResult = function(_city, _facility, _past_time, _buff) {
        var currTime = (new Date()).getTime();
        var remineTime = currTime - _past_time;
        var chance = Math.floor(remineTime / (libConst.GettingDefaultSpeed - (libConst.GettingDefaultSpeed * _buff / 100)));
        var tmpRand, rtnArray = [], i, tmpGetting;
        var preRate = 0, currRate = 0;
        var dbGettingList = db_Manager.getGettingList(_city, _facility);
        var maxRate = 0;

        for(i = 0; i < dbGettingList.length; ++i) {
            maxRate += Number(dbGettingList[i].rate);
        }

        if(chance > libConst.GettingMaxCount) {
            chance = libConst.GettingMaxCount;
        }

        for(i = 0; i < chance; ++i) {
            tmpRand = libCommon.Randfloat(0,maxRate);
            preRate = 0;
            currRate = 0;
            for(var m = 0; m < dbGettingList.length; ++m) {
                tmpGetting = dbGettingList[m];
                preRate += (m===0?0:Number(dbGettingList[m-1].rate));
                currRate += Number(tmpGetting.rate);
                if(tmpRand >= preRate && tmpRand < currRate) {
                    rtnArray.push({index:tmpGetting.item, count:tmpGetting.count, kind:tmpGetting.itemkind});
                    break;
                }
            }
        }
        return rtnArray;
    };

    _FindFloor = function(_city, _facility) {
        var rtnobj = null;
        for(var i = 0; i < m_tower.length; ++i) {
            if(m_tower[i].city === _city && m_tower[i].facility === _facility) {
                rtnobj = m_tower[i];
            }
        }
        return rtnobj;
    };

    _CalcAutoRecoveryAP = function() {
        var maxAP = _MaxPoint("ap");
        var currTime = (new Date()).getTime();
        var remainTime = currTime - m_accrue_aptime;
        var recoveryAP = Math.floor(remainTime / libConst.AutoAPRecoveryTime) * libConst.AutoAPRecoveryCount;
        if(recoveryAP > maxAP) {
            recoveryAP = maxAP;
        }

        return recoveryAP;
    };
    _AutoRecoveryAPEnd = function() {
        if(!libConst.AutoAPRecovery) {
            return null;
        }

        var maxAP = _MaxPoint("ap");
        var rtnAP = _CalcAutoRecoveryAP();
        var currTime = (new Date()).getTime();
        var Time = currTime - m_accrue_aptime;
        var reTime =  Time % libConst.AutoAPRecoveryTime;
        if(maxAP === rtnAP) {
            m_accrue_aptime = currTime;
        } 
        else {
            m_accrue_aptime = currTime - reTime;
        }
        
        return rtnAP;
    };

    _Init();

    return {
        name:m_name,
        const_MINEITEMLIST:MINEITEMLIST,
        //[랜덤스텟 관련 펑션]
        decMakeStat:function() {
            m_make_stat--;
        },
        getMakeStat:function() {
            return m_make_stat;
        },
        setMakeStat:function(_stat) {
            m_make_stat = _stat;
        },
        //[기본 평션 ]
        getJson:function() {
            return {name:m_name, species:m_species,
              rune:m_rune, purchasestat:m_purchasestat,
              status:m_status, ability:m_ability, vitality:m_vitality, accrue_aptime:m_accrue_aptime,
              talent:m_talent, skill:m_skill, smnskill:m_smnskill, smntype:m_smntype, buff:m_buff,
              inventory:m_inventory, equipment:m_equipment,
              equipmentlevel:m_equipmentlevel,
              location:m_location, miningtime:m_miningtime, fellingtime:m_fellingtime,
              stoningtime:m_stoningtime, gettingtime:m_gettingtime, playdungeontime:m_playdungeontime, passport:m_passport,
              questlist:m_questlist, complitequest:m_complitequest,
              clan:m_clan, clanbuff:m_clanbuff, recipe:m_recipe, loan:m_loan, tower:m_tower,
              isdungeon:false, dungeonloc:null, writer:m_writer};
        },
        getGeneration:function() {
            return m_generation;
        },
        setGeneration:function(_generate) {
            m_generation = _generate;
        },
        setSpecies:function(_spec) {
            m_species = _spec;
        },
        setOriginChar:function() {
            var origin = db_Manager.copyOriginChar(m_species);
            if(origin !== null) {
                m_rune = Number(origin.rune);
                m_skill = origin.skill;
                m_inventory = origin.inventory;
                m_equipment = origin.equipment;
                m_location = origin.location;
                m_location.home = "";
                m_location.dungeon = "";
                m_passport = [origin.location.country];
            }
        },
        getSpecies:function() {
            return m_species;
        },
        getStatus:function() {
            return m_status;
        },
        setStatus:function(_stat) {
            m_status = _stat;
        },
        setStatusForName:function(_statname, _incstat) {
            m_status[_statname] += _incstat;
            if(m_status[_statname] <= 0)
                m_status[_statname] = 0;
        },
        getAbility:function() {
            return m_ability;
        },
        getVitality:function() {
            return m_vitality;
        },
        calcAbility:function(_notpoint) {
            _CalcAbility(_notpoint);
        },
        getRune:function() {
            return m_rune;
        },
        setRune:function(_rune) {
            m_rune = _rune;
        },
        addRune:function(_rune) {
            if(m_rune + _rune < 0)
                return false;

            m_rune += _rune;
            return true;
        },
        getClanName:function() {
            return m_clan;
        },
        setClanName:function(_name) {
            m_clan = _name;
        },
        setClanBuff:function(_clanbuff) {
            m_clanbuff = _clanbuff;
            _CalcAbility(false);
        },
        removeClanBuff:function() {
            m_clanbuff = [];
            _CalcAbility(false);
        },
        getLocation:function() {
            return m_location;
        },
        getCurrentLocation:function() {
            return m_curr_loc;
        },
        moveLocation:function(_purpose, _conquest) {
            var mineLoc, i, tmpLoc;
            switch(m_curr_loc) {
                case LOCATION_INFO[0]: // country
                    mineLoc = db_Manager.getNation(m_location[m_curr_loc]);
                    for(i = 0; i < mineLoc.cities.length; ++i) {
                        tmpLoc = db_Manager.getCity(mineLoc.cities[i]);
                        if (_purpose === tmpLoc.name) {
                            m_location.city = tmpLoc.index;
                            m_curr_loc = LOCATION_INFO[1];
                            return true;
                        }
                    }
                    break;
                case LOCATION_INFO[1]: // city
                    if(_conquest){
                        mineLoc = db_Manager.getCity(m_location[m_curr_loc]);
                        for(i = 0; i < mineLoc.facilities.length; ++i) {
                            tmpLoc = db_Manager.getFacility(mineLoc.facilities[i]);
                            if (_purpose === tmpLoc.name) {
                                m_location.facility = tmpLoc.index;
                                m_curr_loc = LOCATION_INFO[2];
                                return true;
                            }
                        }
                        for(i = 0; i < mineLoc.fields.length; ++i) {
                            tmpLoc = db_Manager.getField(mineLoc.fields[i]);
                            if (_purpose === tmpLoc.name) {
                                m_location.field = tmpLoc.index;
                                m_curr_loc = LOCATION_INFO[3];
                                return true;
                            }
                        }
                        for(i = 0; i < mineLoc.dungeon.length; ++i) {
                            tmpLoc = db_Manager.getDungeon(mineLoc.dungeon[i]);
                            if (_purpose === tmpLoc.name) {
                                m_location.dungeon = tmpLoc.index;
                                m_curr_loc = LOCATION_INFO[4];
                                return true;
                            }
                        }
                    }
                    break;
                case LOCATION_INFO[2]: // facility
                    break;
                case LOCATION_INFO[3]: // field
                    break;
                case LOCATION_INFO[4]: // dungeon
                    break;
                case LOCATION_INFO[5]: // home
                    break;
            }

            return false;
        },
        moveMyHome:function() {
            if(m_curr_loc === LOCATION_INFO[1]) {
                m_location.home = m_name;
                m_curr_loc = LOCATION_INFO[5];
                return true;
            }
            return false;
        },
        backLocation:function() {
            //m_location[m_curr_loc] = "";
            switch(m_curr_loc) {
                case LOCATION_INFO[0]: // country
                    break;
                case LOCATION_INFO[1]: // city
                    m_location[m_curr_loc] = "";
                    m_curr_loc = LOCATION_INFO[0];
                    return true;
                case LOCATION_INFO[2]: // facility
                case LOCATION_INFO[3]: // field
                case LOCATION_INFO[4]: // dungeon
                case LOCATION_INFO[5]: // home
                    m_location[m_curr_loc] = "";
                    m_curr_loc = LOCATION_INFO[1];
                    return true;
            }
            return false;
        },
        setLocation:function(_country, _city, _facility, _field, _dungeon, _home){
            if(_country !== null) m_location.country = _country;
            if(_city !== null) m_location.city = _city;
            if(_facility !== null) m_location.facility = _facility;
            if(_field !== null) m_location.field = _field;
            if(_dungeon !== null) m_location.dungeon = _dungeon;
            if(_home !== null) m_location.home = _home;

            if(_facility !== "") m_curr_loc = LOCATION_INFO[2];
            else if(_field !== "") m_curr_loc = LOCATION_INFO[3];
            else if(_dungeon !== "") m_curr_loc = LOCATION_INFO[4];
            else if(_home !== "") m_curr_loc = LOCATION_INFO[5];
            else if(_city !== "") m_curr_loc = LOCATION_INFO[1];
            else if(_country !== "") m_curr_loc = LOCATION_INFO[0];
        },
        addItem:function(_kind, _itemidx, _count, _strength) {
            var strength = (_strength === undefined?0:_strength);
            var invenIdx = _FindInventory(_kind, _itemidx, strength);

            if(invenIdx === -1)
                m_inventory.push({kind:_kind, index:_itemidx, count:Number(_count), strength:strength});
            else
                m_inventory[invenIdx].count = Number(m_inventory[invenIdx].count) + Number(_count);
        },
        removeItem:function(_kind, _itemidx, _count, _strength) {
          var rtnValue = false;
          var strength = (_strength === undefined?0:_strength);
          var invenIdx = _FindInventory(_kind, _itemidx, strength);

          if(invenIdx !== -1) {
              if(Number(m_inventory[invenIdx].count) < Number(_count)) {
                  rtnValue = false;
              }
              else if(Number(m_inventory[invenIdx].count) === Number(_count)) {
                  m_inventory.splice(invenIdx, 1);
                  rtnValue = true;
              }
              else {
                  m_inventory[invenIdx].count = Number(m_inventory[invenIdx].count) - Number(_count);
                  rtnValue = true;
              }
          }
          return rtnValue;
        },
        removeItemOfUpStrength:function(_kind, _itemidx, _count, _strength) {
            var i;
            var strength = (_strength === undefined?0:_strength);
            var invenAry = _FindInventoryOverStrength(_kind, _itemidx, strength); //{kind, index, count, strength}
            var totalCnt = 0, remainCnt = 0, tmpitem, tmpidx;

            invenAry.sort(function(a,b) {
                return a.strength > b.strength ? 1 : (a.strength < b.strength ? -1 : 0);
            });

            for(i = 0; i < invenAry.length; ++i) {
                totalCnt += invenAry[i].count;
            }

            if(totalCnt < _count) {
                return false;
            }

            remainCnt = _count;
            for(i = 0; i < invenAry.length; ++i) {
                tmpitem = invenAry[i];
                tmpidx = _FindInventory(tmpitem.kind, tmpitem.index, tmpitem.strength);

                if(tmpitem.count <= remainCnt) {
                    m_inventory.splice(tmpidx, 1);
                    remainCnt -= tmpitem.count;
                }
                else {
                    m_inventory[tmpidx].count = Number(m_inventory[tmpidx].count) - Number(remainCnt);
                    remainCnt -= tmpitem.count;
                }
                if(remainCnt <= 0) {
                    break;
                }
            }
            return true;
        },
        getItemList:function(_kind) {
            var rtnArray = [], tmpitem;
            if(_kind === "all")
                return m_inventory;

            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind)
                    rtnArray.push(tmpitem);
            }
            return rtnArray;
        },
        isItem:function(_kind, _itemidx, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && tmpitem.strength === strength)
                    return true;
            }
            return false;
        },
        isItemCount:function(_kind, _itemidx, _count, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && Number(tmpitem.count) >= _count && tmpitem.strength === strength)
                    return true;
            }
            return false;
        },
        getItemCount:function(_kind, _itemidx, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && tmpitem.strength === strength)
                    return tmpitem.count;
            }
            return -1;
        },
        getItemCountOfUpStrength:function(_kind, _itemidx, _strength) {
            var tmpitem, totalCnt = 0;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && tmpitem.strength >= strength)
                    totalCnt += tmpitem.count;
            }
            return totalCnt;
        },
        setStrengthItem:function(_kind, _itemidx, _strength, _amount) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            var invenIdx = _FindInventory(_kind, _itemidx, strength);

            if(invenIdx !== -1) {
                tmpitem = m_inventory[invenIdx];
                this.removeItem(tmpitem.kind, tmpitem.index, 1, strength);
                this.addItem(tmpitem.kind, tmpitem.index, 1, strength + Number(_amount));
                return true;
            }
            return false;
        },
        HPMPRecovery:function() {
            _Recovery("hp", 100);
            _Recovery("mp", 100);
            _Recovery("sp", 100);
            _Recovery("dp", 100);
        },
        APRecovery:function() {
            _Recovery("ap", 100);
        },
        Recovery:function(_target, _percent) {
            _Recovery(_target, _percent);
        },
        RecoveryforNum:function(_target, _plus) {
            _RecoveryforNum(_target, _plus);
        },
        getMaxPoint:function(_target) {
            return _MaxPoint(_target);
        },
        addSkill:function(_skillidx) {
            m_skill.push(_skillidx);
        },
        getSkill:function() {
            return m_skill;
        },
        isSkill:function(_skillidx) {
            return m_skill.indexOf(_skillidx);
        },
        addSummonSkill:function(_skillidx) {
            m_smnskill.push(_skillidx);
        },
        getSummonSkill:function() {
            return m_smnskill;
        },
        isSummonSkill:function(_skillidx) {
            return m_smnskill.indexOf(_skillidx);
        },
        clearSummonSkill:function() {
            m_smnskill = [];
        },
        addTalent:function(_talentidx) {
            m_talent.push(_talentidx);
        },
        getTalent:function() {
            return m_talent;
        },
        isTalent:function(_talentidx) {
            return m_talent.indexOf(_talentidx);
        },
        isFarWeapon:function() {
            if(m_equipment.righthand !== "" && db_Manager.getWearItem(m_equipment.righthand).kind === libConst.WearItem_Kind.Far_Weapon)
                return true;
            else
                return false;
        },
        isEquimentArrow:function() {
            if(m_equipment.lefthand !== "" && db_Manager.getWearItem(m_equipment.lefthand).kind === libConst.WearItem_Kind.Assis_Arrow) {
                return true;
            }
            else {
                return false;
            }
        },
        decArrow:function() {
          if(m_equipment.lefthand !== "" && db_Manager.getWearItem(m_equipment.lefthand).kind === libConst.WearItem_Kind.Assis_Arrow) {
              if(this.removeItem(libConst.ITEM_KIND.WEARITEM, m_equipment.lefthand, 1)) {
                  return true;
              }
              else {
                  if(m_equipment.lefthand !== "") {
                      m_equipment.lefthand = "";
                      return true;
                  }
              }
          }
          return false;
        },
        getEquiment:function() {
            return m_equipment;
        },
        getEquimentLevel:function() {
            return m_equipmentlevel;
        },
        getEquimentInfo:function(_pos) {
            return db_Manager.getWearItem(m_equipment[_pos]);
        },
        setEquiment:function(_itemidx, _pos, _strength) {
            m_equipment[_pos] = _itemidx;
            m_equipmentlevel[_pos] = _strength;
        },
        removeEquiment:function(_pos) {
            m_equipment[_pos] = "";
            m_equipmentlevel[_pos] = 0;
        },
        startMining:function() {
            var d = new Date();
            m_miningtime = d.getTime();
        },
        getMiningTiem:function() {
            return m_miningtime;
        },
        endMining:function(_petbuff) {
            var result = _MiningResult(m_miningtime, _petbuff);
            m_miningtime = -1;

            return result;
        },
        startFelling:function() {
            var d = new Date();
            m_fellingtime = d.getTime();
        },
        getFellingTiem:function() {
            return m_fellingtime;
        },
        endFelling:function(_city, _facility, _petbuff) {
            var result = _FellingResult(_city, _facility, m_fellingtime, _petbuff);
            m_fellingtime = -1;

            return result;
        },
        startStoning:function() {
            var d = new Date();
            m_stoningtime = d.getTime();
        },
        getStoningTiem:function() {
            return m_stoningtime;
        },
        endStoning:function(_city, _facility, _petbuff) {
            var result = _StoningResult(_city, _facility, m_stoningtime, _petbuff);
            m_stoningtime = -1;

            return result;
        },
        startGetting:function() {
            var d = new Date();
            m_gettingtime = d.getTime();
        },
        getGettingTiem:function() {
            return m_gettingtime;
        },
        endGetting:function(_city, _facility, _petbuff) {
            var result = _GettingResult(_city, _facility, m_gettingtime, _petbuff);
            m_gettingtime = -1;

            return result;
        },
        getPurchaseStat:function() {
            return m_purchasestat;
        },
        incPurchaseStat:function() {
            m_purchasestat++;
        },
        decPurchaseStat:function() {
            m_purchasestat--;
        },
        calcNextPruchaseStat:function() {
            var n = m_purchasestat;
            var n_1 = (n - 1 <= 0)?1:n-1;
            return n * n_1 * 50 * (n%50 === 0?3:1);
        },
        getTargetQuest:function() {
            return m_target_quest;
        },
        setTargetQuest:function(_questidx) {
            m_target_quest = _questidx;
        },
        confirmTargetQuest:function() {
            var quest = db_Manager.getQuest(m_target_quest);
            var monidx = 0;
            if(quest.kind === "Monster")
                monidx = quest.target;
            m_questlist.push({index:m_target_quest, monsteridx:monidx, goal:0});
        },
        isQuest:function(_questidx) {
            for(var i = 0; i < m_questlist.length; ++i){
                if(m_questlist[i].index === _questidx)
                    return true;
            }
            return false;
        },
        getCurrQuest:function() {
            return m_questlist;
        },
        addQuestMob:function(_questidx) {
            for(var i = 0; i < m_questlist.length; ++i){
                if(m_questlist[i].index === _questidx) {
                    m_questlist[i].goal++;
                    return true;
                }
            }
            return false;
        },
        isCompliteQuest:function(_questidx) {
            for(var i = 0; i < m_complitequest.length; ++i) {
                if(m_complitequest[i] === _questidx) {
                    return true;
                }
            }
            return false;
        },
        CompliteQuest:function(_index, _continue) {
            var target = -1;
            for(var i = 0; i < m_questlist.length; ++i){
                if(m_questlist[i].index === _index)
                {
                    target = i;
                    break;
                }
            }
            if(target === -1)
                return false;
            m_questlist.splice(target,1);
            if(!_continue)
                m_complitequest.push(_index);

            return true;
        },
        removeQuest:function(_index) {
            if(_index < m_questlist.length) {
                m_questlist.splice(_index,1);
                return true;
            }
            return false;
        },
        getPassPort:function() {
            return m_passport;
        },
        setPassPort:function(_ppindex) {
            m_passport.push(_ppindex);
        },
        isPassPort:function(_ppindex) {
            for(var i = 0; i < m_passport.length; ++i){
                if(m_passport[i] === _ppindex)
                    return true;
            }
            return false;
        },
        getLoan:function() {
            return m_loan;
        },
        setLoan:function(_index, _kind, _rune) {
            if(m_loan.index === "") {
                m_loan.index = _index;
                m_loan.kind = _kind;
                m_loan.rune = _rune;
                m_loan.time = (new Date()).getTime();
                return true;
            }
            return false;
        },
        removeLoan:function() {
            m_loan.index = "";
            m_loan.kind = "";
            m_loan.rune = 0;
            m_loan.time = -1;
        },
        makeTowerFloor:function() {
            var floor = _FindFloor(m_location.city, m_location.facility);
            var tmp;
            if(floor === null) {
                tmp = {city:m_location.city, facility:m_location.facility, floor:1};
                m_tower.push(tmp);
            }
            return tmp;
        },
        getTowerFloor:function() {
            return _FindFloor(m_location.city, m_location.facility);
        },
        addTowerFloor:function() {
            var floor = _FindFloor(m_location.city, m_location.facility);
            if(floor === null) {
                return false;
            }
            else {
                floor.floor++;
                return true;
            }
        },
        addBuff:function(_kind, _amount, _count) {
            if(m_buff.length >= libConst.BuffCount) {
                m_buff.splice(0,1);
            }
            m_buff.push({stat:_kind, amount:_amount, count:_count});
            _CalcAbility(false);
        },
        getBuffCount:function() {
            return m_buff.length;
        },
        getBuffList:function() {
            return m_buff;
        },
        removeBuffCount:function() {
            var buff;
            var flag = false;
            for(var i = m_buff.length - 1; i >= 0; --i) {
                buff = m_buff[i];
                buff.count--;
                if(buff.count === 0) {
                    m_buff.splice(i, 1);
                    flag = true;
                }
            }
            if(flag){
                _CalcAbility(false);
            }
        },
        addRecipe:function(_recipeidx) {
            m_recipe.push(_recipeidx);
        },
        isRecipe:function(_recipeidx) {
            return (m_recipe.indexOf(_recipeidx)===-1?false:true);
        },
        getRecipeList:function() {
            return m_recipe;
        },
        setWriter:function(_flag) {
            if(_flag) {
                m_writer = "T";
            }
            else {
                m_writer = "F";
            }
        },
        getWriter:function() {
            return m_writer;
        },
        setSummonType:function(_type) {
            m_smntype = _type;
        },
        getSummonType:function() {
            return m_smntype;
        },
        setIsDungeon:function(_flag, _type) {
            if(_type === "dungeon") 
                m_isdungeon = _flag;
            else if(_type === "occupy")
                m_isoccupy = _flag;
            else {
                m_isdungeon = _flag;
                m_isoccupy = _flag;
            }
        },
        getIsDungeon:function(_type) {
            if(_type === "dungeon") 
                return m_isdungeon;
            else if(_type === "occupy")
                return m_isoccupy;

            return m_isdungeon;
        },
        setDungeonLocation:function(_loc) {
            m_dungeonloc = _loc;
        },
        getDungeonLocation:function() {
            return m_dungeonloc;
        },
        calcAutoAP:function() {
            return _CalcAutoRecoveryAP();
        },
        endAutoAP:function() {
            return _AutoRecoveryAPEnd();
        }
    };
}

function clsUserOption(_info) {
    var m_userName = _info.name,
        m_potionOpt = _info.potionopt, // {hp:{index, percent}, mp:{index, percent}, sp:{index, percent}, dp:{index, percent}}
        m_apOpt = (_info.apopt === undefined?"":_info.apopt),
        m_skillOpt = _info.skillopt, // {atkskill[], healskill:{index, percent}, helpskill, cureskill:index}
        m_pvpskillOpt = _info.pvpskillopt, // {atkskill[], healskill:{index, percent}, helpskill, cureskill:index}
        m_campingOpt = _info.campingopt, // {equipment, food}
        m_privateOpt = (_info.privateopt === undefined?"N":_info.privateopt),
        m_summonskillOpt = (_info.summonskillopt === undefined?[]:_info.summonskillopt), // [{turn, index}]
        m_pvpsummonskillOpt = (_info.pvpsummonskillOpt === undefined?[]:_info.pvpsummonskillOpt), // [{turn, index}]
        m_huntingOpt = (_info.huntingopt === undefined?"Y":_info.huntingopt);

        if(!Array.isArray(m_skillOpt.healskill)) { // healskill change
            m_skillOpt.healskill = [];
        }
        if(!Array.isArray(m_pvpskillOpt.healskill)) { // healskill change
            m_pvpskillOpt.healskill = [];
        }

    return {
        name:m_userName,
        getJson:function() {
            return {name:m_userName, potionopt:m_potionOpt, apopt:m_apOpt, skillopt:m_skillOpt,
                    pvpskillopt:m_pvpskillOpt, campingopt:m_campingOpt, privateopt:m_privateOpt,
                    summonskillopt:m_summonskillOpt, pvpsummonskillOpt:m_pvpsummonskillOpt, huntingopt:m_huntingOpt};
        },
        setAttSkillOpt:function(_slot, _skillidx) {
            m_skillOpt["atkskill"][_slot] = _skillidx;
        },
        resetAttSkillOpt:function() {
            m_skillOpt["atkskill"] = [];
        },
        getattSkillOpt:function() {
            return m_skillOpt.atkskill;
        },
        removeAttSkillOpt:function(_skillidx) {
            for(var i = 0; i < m_skillOpt.atkskill.length; ++i) {
                if(m_skillOpt.atkskill[i] === _skillidx) {
                    m_skillOpt.atkskill[i] = null;
                }
            }
        },
        setHealSkillOpt:function(_slot, _skillidx, _percent) {
            m_skillOpt["healskill"][_slot] = {index:_skillidx, percent:_percent};
        },
        resetHealSkillOpt:function() {
            m_skillOpt["healskill"] = [];
        },
        getHealSkillOpt:function() {
            return m_skillOpt.healskill;
        },
        removeHealSkillOpt:function(_skillidx) {
            for(var i = 0; i < m_skillOpt.healskill.length; ++i) {
                if(m_skillOpt.healskill[i] != null && m_skillOpt.healskill[i].index === _skillidx) {
                    m_skillOpt.healskill[i] = null;
                }
            }
        },
        setCureSkillOpt:function(_skillidx) {
            m_skillOpt.cureskill = _skillidx;
        },
        getCureSkillOpt:function() {
            return m_skillOpt.cureskill;
        },
        setPvpAttSkillOpt:function(_slot, _skillidx) {
            m_pvpskillOpt["atkskill"][_slot] = _skillidx;
        },
        resetPvpAttSkillOpt:function() {
            m_pvpskillOpt["atkskill"] = [];
        },
        getPvpAttSkillOpt:function() {
            return m_pvpskillOpt.atkskill;
        },
        removePvpAttSkillOpt:function(_skillidx) {
            for(var i = 0; i < m_pvpskillOpt.atkskill.length; ++i) {
                if(m_pvpskillOpt.atkskill[i] === _skillidx) {
                    m_pvpskillOpt.atkskill[i] = null;
                }
            }
        },
        setpotionOpt:function(_type, _itemidx, _percent) {
            m_potionOpt[_type]["index"] = _itemidx;
            m_potionOpt[_type]["percent"] = _percent;
        },
        getpotionOpt:function() {
            return m_potionOpt;
        },
        setApOpt:function(_itemidx) {
            m_apOpt = _itemidx;
        },
        getApOpt:function() {
            return m_apOpt;
        },
        setCampingEquOpt:function(_itemidx) {
            m_campingOpt.equipment = _itemidx;
        },
        setCampingFood:function(_itemidx) {
            m_campingOpt.food = _itemidx;
        },
        getCampingOpt:function() {
            return m_campingOpt;
        },
        onPrivateOpt:function() {
            m_privateOpt = "Y";
        },
        offPrivateOpt:function() {
            m_privateOpt = "N";
        },
        getPrivateOpt:function() {
            return m_privateOpt;
        },
        getSummonSkillOpt:function() {
            return m_summonskillOpt;
        },
        addSummonSkillOpt:function(_turn, _skillidx) {
            m_summonskillOpt.push({turn:_turn, index:_skillidx});
        },
        clearSummonSkillOpt:function() {
            m_summonskillOpt = [];
        },
        removeSummonSkillOpt:function(_idx) {
            m_summonskillOpt.splice(_idx, 1);
        },
        getPvpSummonSkillOpt:function() {
            return m_pvpsummonskillOpt;
        },
        addPvpSummonSkillOpt:function(_turn, _skillidx) {
            m_pvpsummonskillOpt.push({turn:_turn, index:_skillidx});
        },
        clearPvpSummonSkillOpt:function() {
            m_pvpsummonskillOpt = [];
        },
        removePvpSummonSkillOpt:function(_idx) {
            m_pvpsummonskillOpt.splice(_idx, 1);
        },
        onHuntingOpt:function() {
            m_huntingOpt = "Y";
        },
        offHuntingOpt:function() {
            m_huntingOpt = "N";
        },
        getHuntingOpt:function() {
            return m_huntingOpt;
        }
    };
}
function clsUserRecord(_info) {
    var m_userName = _info.name,
        m_monsterCounter = _info.monstercounter, //[{mobidx, count}, ........ ]
        m_gambleVictory = _info.gamblevictory,
        m_gambleDefeat = _info.gambledefeat,
        m_skillCounter = _info.skillcounter,
        m_maxStatus = _info.maxstatus, //{str:0, con:0, dex:0, agi:0, int:0, luk:0 ept:0, com:0, spr:0}
        m_timeMine = _info.timemine,
        m_timeFell = (_info.timefell===undefined?0:_info.timefell),
        m_timeStone = (_info.timestone===undefined?0:_info.timestone),
        m_timeGetter = (_info.timegetter===undefined?0:_info.timegetter),
        m_maxRune = _info.maxrune,
        m_action = _info.action, // {eatfood, sleep, drunk}
        m_pvpwin = _info.pvpwin,
        m_pvplost = _info.pvplost,
        m_lastworldboss = _info.lastworldboss,
        m_topclearfloor = (_info.topclearfloor===undefined?[]:_info.topclearfloor), // {city, facility, floor}
        m_clangiverune = (_info.clangiverune===undefined?0:_info.clangiverune),
        m_clangiveitem = (_info.clangiveitem===undefined?0:_info.clangiveitem),
        m_petawaken = (_info.petawaken===undefined?0:_info.petawaken),
        m_fishingcount = (_info.fishingcount===undefined?0:_info.fishingcount);

        if(m_maxStatus.ept === undefined)
            m_maxStatus.ept = 0;
        if(m_maxStatus.com === undefined)
            m_maxStatus.com = 0;
        if(m_maxStatus.spr === undefined)
            m_maxStatus.spr = 0;

    return {
        EATFOOD:"eatfood",
        SLEEP:"sleep",
        DRUNK:"drunk",
        name:m_userName,
        getJson:function() {
            return {name:m_userName, monstercounter:m_monsterCounter, gamblevictory:m_gambleVictory,
                          gambledefeat:m_gambleDefeat, skillcounter:m_skillCounter, maxstatus:m_maxStatus,
                          timemine:m_timeMine, timefell:m_timeFell, timestone:m_timeStone, timegetter:m_timeGetter,
                          maxrune:m_maxRune, action:m_action, pvpwin:m_pvpwin, pvplost:m_pvplost,lastworldboss:m_lastworldboss,
                          topclearfloor:m_topclearfloor,clangiverune:m_clangiverune, clangiveitem:m_clangiveitem,
                          petawaken:m_petawaken, fishingcount:m_fishingcount};
        },
        addMonsterCount:function(_monsteridx, _count){
            var tmpCnt = null, isMonster = true;
            for(var i = 0; i < m_monsterCounter.length; ++i)
            {
                tmpCnt = m_monsterCounter[i];
                if(tmpCnt.mobidx === _monsteridx) {
                    tmpCnt.count += _count;
                    isMonster = false;
                    break;
                }
            }

            if(isMonster) {
                m_monsterCounter.push({mobidx:_monsteridx, count:_count});
            }
        },
        getMonsterCount:function(_idxlist){
            var tmpCnt = 0;
            for(var i = 0; i < _idxlist.length; ++i)
            {
                for(var r = 0; r < m_monsterCounter.length; ++r) {
                    if(m_monsterCounter[r].mobidx === _idxlist[i])
                    {
                        tmpCnt += m_monsterCounter[r].count;
                        break;
                    }
                }
            }

            return tmpCnt;
        },
        addGambleVictory:function() {
            m_gambleVictory++;
        },
        getGambleVictory:function() {
            return m_gambleVictory;
        },
        addGambleDefeat:function() {
            m_gambleDefeat++;
        },
        getGambleDefeat:function() {
            return m_gambleDefeat;
        },
        addSkillCnt:function() {
            m_skillCounter++;
        },
        getSkillCnt:function() {
            return m_skillCounter;
        },
        setMaxStatus:function(_stat) {
            m_maxStatus = {str:_stat.str, con:_stat.con, dex:_stat.dex, agi:_stat.agi, int:_stat.int, luk:_stat.luk, ept:_stat.ept, com:_stat.com, spr:_stat.spr};
        },
        setStatus:function(_statname, _statcnt) {
            if(m_maxStatus[_statname] < _statcnt) {
                m_maxStatus[_statname] = _statcnt;
            }
        },
        getStatus:function(_statname) {
            return m_maxStatus[_statname];
        },
        addTimeMineCnt:function(_cnt) {
            m_timeMine += _cnt;
        },
        getTimeMineCnt:function() {
            return m_timeMine;
        },
        addTimeFellCnt:function(_cnt) {
            m_timeFell += _cnt;
        },
        getTimeFellCnt:function() {
            return m_timeFell;
        },
        addTimeStoneCnt:function(_cnt) {
            m_timeStone += _cnt;
        },
        getTimeStoneCnt:function() {
            return m_timeStone;
        },
        addTimeGetterCnt:function(_cnt) {
            m_timeGetter += _cnt;
        },
        getTimeGetterCnt:function() {
            return m_timeGetter;
        },
        addMaxRune:function(_cnt) {
            m_maxRune = Number(m_maxRune) +  Number(_cnt);
        },
        getMaxRune:function() {
            return m_maxRune;
        },
        addAction:function(_act) {
            m_action[_act]++;
        },
        getAction:function(_act) {
            return m_action[_act];
        },
        addPVPWin:function() {
            m_pvpwin++;
        },
        getPVPWin:function() {
            return m_pvpwin;
        },
        addPVPLost:function() {
            m_pvplost++;
        },
        getPVPLost:function() {
            return m_pvplost;
        },
        addLastWorldBoss:function() {
            m_lastworldboss++;
        },
        getLastWorldBoss:function() {
            return m_lastworldboss;
        },
        addClanRuneCount:function(_rune) {
            m_clangiverune = Number(m_clangiverune) +  Number(_rune);
        },
        getClanRuneCount:function() {
            return m_clangiverune;
        },
        addClanItemCount:function(_cnt) {
            m_clangiveitem = Number(m_clangiveitem) +  Number(_cnt);
        },
        getClanItemCount:function() {
            return m_clangiveitem;
        },
        setMaxTowerFloor:function(_city, _facility, _lastfloor) {
            var tmpflr, flag = true;
            for(var i = 0; i < m_topclearfloor.length; ++i) {
                tmpflr = m_topclearfloor[i];
                if(tmpflr.city === _city && tmpflr.facility === _facility) {
                    if(tmpflr.floor < Number(_lastfloor)) {
                        tmpflr.floor = Number(_lastfloor);
                    }
                    flag = false;
                    break;
                }
            }
            if(flag) {
                m_topclearfloor.push({city:_city, facility:_facility, floor:Number(_lastfloor)});
            }
        },
        getMaxTowerFloor:function(_city, _facility) {
            var tmpflr;
            for(var i = 0; i < m_topclearfloor.length; ++i) {
                tmpflr = m_topclearfloor[i];
                if(tmpflr.city === _city && tmpflr.facility === _facility) {
                    return tmpflr.floor;
                }
            }
            return 0;
        },
        addPetAwaken:function() {
            m_petawaken++;
        },
        getPetAwaken:function() {
            return m_petawaken;
        },
        addFishingCount:function() {
            m_fishingcount++;
        },
        getFishingCount:function() {
            return m_fishingcount;
        }
    };
}
function clsWorldBoss(_info) {
    var m_index = _info.index;
    var m_summonRune = _info.summonrune;
    var m_rankinglist = _info.rankinglist; // [{userid, damage, (rank)}......]
    var m_runelist = _info.runelist; // [{userid, rune, (rank)}......]
    var m_bossHP = _info.bosshp;
    var m_isSummon = _info.issummon;
    var m_autoSummonTime = (_info.autosummontime === undefined?(new Date()).getTime():_info.autosummontime);
    var m_bossinfo = db_Manager.getMonster(_info.index);
    var m_rewardinfo = db_Manager.getWBReward(_info.index);
    var m_needRuneinfo = db_Manager.getWBLocalInfobyIdx(_info.index);

    var _FindRunelist, _updateRunelist, _FindRankinglist, _updateRankinglist, _SortRanking, _SortRune, _Delete;

    _FindRunelist = function(_username) {
        var rtnObj = null;
        for(var i = 0; i < m_runelist.length; ++i) {
            if(m_runelist[i].userid === _username){
                rtnObj = m_runelist[i];
                break;
            }
        }

        return rtnObj;
    };
    _updateRunelist = function(_username, _rune) {
        var targetObj = _FindRunelist(_username);
        if(targetObj === null) {
            m_runelist.push({userid:_username, rune:_rune, rank:-1});
        }
        else {
            targetObj.rune += _rune;
        }
    };

    _FindRankinglist = function(_username) {
        var rtnObj = null;
        for(var i = 0; i < m_rankinglist.length; ++i) {
            if(m_rankinglist[i].userid === _username){
                rtnObj = m_rankinglist[i];
                break;
            }
        }

        return rtnObj;
    };
    _updateRankinglist = function(_username, _damage) {
        var targetObj = _FindRankinglist(_username);
        if(targetObj === null) {
            m_rankinglist.push({userid:_username, damage:_damage, rank:-1});
        }
        else {
            targetObj.damage += _damage;
        }
    };

    _SortRanking = function() {
        m_rankinglist.sort(function(a,b) {
            return a.damage > b.damage ? -1 : (a.damage < b.damage ? 1 : 0);
        });
        var rankNum = 0, obj, tmpDam = 0;
        for(var i = 0; i < m_rankinglist.length; ++i) {
            obj = m_rankinglist[i];
            if(tmpDam !== obj.damage) {
                rankNum++;
            }
            obj.rank = rankNum;
            tmpDam = obj.damage;
        }
    };

    _SortRune = function() {
        m_runelist.sort(function(a,b) {
            return a.rune > b.rune ? -1 : (a.rune < b.rune ? 1 : 0);
        });
        var rankNum = 0, obj, tmpRune = 0;
        for(var i = 0; i < m_runelist.length; ++i) {
            obj = m_runelist[i];
            if(tmpRune !== obj.rune) {
                rankNum++;
            }
            obj.rank = rankNum;
            tmpRune = obj.rune;
        }
    };
    _Delete = function(_id) {
        var rankinfo = _FindRankinglist(_id);
        var runeinfo = _FindRunelist(_id);
        if(runeinfo !== null) {
            for (i = 0; i < m_runelist.length; ++i) {
               if (m_runelist[i].rank > runeinfo.rank) {
                  m_runelist[i].rank = m_runelist[i].rank - 1;
               }
            }
            for (i = 0; i < m_runelist.length; ++i) {
               if (m_runelist[i].userid === _id) {
                  m_runelist.splice(i,1);
                  break;
               }
            }
        }
        if(rankinfo !== null) {
            for (i = 0; i < m_rankinglist.length; ++i) {
               if (m_rankinglist[i].rank > rankinfo.rank) {
                  m_rankinglist[i].rank = m_rankinglist[i].rank - 1;
               }
            }
            for (i = 0; i < m_rankinglist.length; ++i) {
               if (m_rankinglist[i].userid === _id) {
                  m_rankinglist.splice(i,1);
                  break;
               }
            }
        }
    };

    return {
        delete:_Delete,
        name:m_bossinfo.name,
        index:m_index,
        bossinfo:m_bossinfo,
        getJson:function() {
            return {index:m_index,
                    summonrune:m_summonRune,
                    rankinglist:m_rankinglist,
                    runelist:m_runelist,
                    bosshp:m_bossHP,
                    issummon:m_isSummon,
                    autosummontime:m_autoSummonTime};
        },
        addSummonRune:function(_username, _rune) {
            m_summonRune += Number(_rune);
            _updateRunelist(_username, Number(_rune));
            return m_summonRune;
        },
        getMineRune:function(_username) {
            var obj = _FindRunelist(_username);
            if(obj === null)
                return 0;
            else
                return obj.rune;
        },
        getSummonRune:function() {
            return m_summonRune;
        },
        getInjectRuneList:function() {
            return m_runelist;
        },

        isSummon:function() {
            return m_isSummon;
        },
        infoNeedRune:function() {
            return m_needRuneinfo.needrune;
        },
        mkLegendMonster:function() {
            if(m_summonRune - m_needRuneinfo.needrune >= 0) {
                m_summonRune = 0;
                m_bossHP = m_bossinfo.ability.hp;
                m_isSummon = true;
                return true;
            }
            else {
                return false;
            }
        },
        autoSummonMonster:function() {
            if(!m_isSummon) {
                m_summonRune = 0;
                m_bossHP = m_bossinfo.ability.hp;
                m_isSummon = true;
                return true;
            }

            return false;
        },
        getHP:function() {
            return m_bossHP;
        },
        removeHP:function(_username, _damage) {
            m_bossHP -= _damage;
            _updateRankinglist(_username, _damage);
        },
        SortRecord:function() {
            _SortRanking();
            _SortRune();
        },
        getDamageRanker:function() {
            return m_rankinglist;
        },
        getRuneRanker:function() {
            return m_runelist;
        },
        getRewardList:function() {
            return m_rewardinfo;
        },
        initLegendMonster:function() {
            m_summonRune = 0;
            m_rankinglist = [];
            m_runelist = [];
            m_bossHP =  m_bossinfo.ability.hp;
            m_isSummon = false;
        },
        getAutoSummonTime:function() {
            return m_autoSummonTime;
        },
        setAutoSummonTime:function(_time) {
            m_autoSummonTime = _time;
        }
    };
}
function clsBattleObj(_info) {
    var m_name = _info.name;
    var m_score = _info.score; // {win, draw, lost}
    var m_record = _info.record; // [{matcher, result}, ...]
    var m_ranking = _info.ranking;

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name,
                    score:m_score,
                    record:m_record,
                    ranking:m_ranking};
        },
        getScoreWin:function() {
            return m_score.win;
        },
        getScoreLost:function() {
            return m_score.lost;
        },
        getScoreDraw:function() {
            return m_score.draw;
        },
        incScoreWin:function() {
            m_score.win++;
        },
        incScoreLost:function() {
            m_score.lost++;
        },
        incScoreDraw:function() {
            m_score.draw++;
        },
        getRank:function() {
            return m_ranking;
        },
        setRank:function(_rank) {
            m_ranking = _rank;
        },
        addRecord:function(_name, _result) {
            if(m_record.length >= 5)
                m_record.splice(0,1);

            m_record.push({matcher:_name, result:_result});
        },
        getRecord:function() {
            return m_record;
        }
    };
}
function clsMineMercenary(_info) {
    var m_name = _info.name;
    var m_mercenarylist = _info.mercenarylist;
    if(m_mercenarylist.length > 0 && m_mercenarylist[0].isuse === undefined) {
        for(var t = 0; t < m_mercenarylist.length; ++t) {
            m_mercenarylist[t].isuse = "Y";
        }
    }

    var _Recovery, _Upgrade;

    _Recovery = function(_arrayidx, _target, _percent) {
        var merc = m_mercenarylist[_arrayidx];
        var db_merc = db_Manager.getMercenary(merc.index);
        var sumPoint = Number(db_merc.ability[_target]), percentPoint;

        percentPoint = Math.floor(sumPoint * _percent / 100);
        merc[_target] += percentPoint;

        if(merc[_target] > sumPoint)
            merc[_target] = sumPoint;

    };
    _Upgrade = function(_arrayidx, _name) {
        var merc = m_mercenarylist[_arrayidx];
        var db_upmerc = db_Manager.getMercenarybyName(_name);
        if(db_upmerc.lowkind === merc.index) {
            if(merc.exp > Number(db_upmerc.upcounter)) {
                merc.name = db_upmerc.name;
                merc.index = db_upmerc.index;
                merc.exp = merc.exp - Number(db_upmerc.upcounter);
                merc.hp = Number(db_upmerc.ability.hp);
                merc.mp = Number(db_upmerc.ability.mp);
                merc.sp = Number(db_upmerc.ability.sp);
                merc.pay = Number(db_upmerc.pay);
                return true;
            }
        }

        return false;
    };

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, mercenarylist:m_mercenarylist};
        },
        addMercenary:function(_mercenaryidx) {
            var merc;
            if(m_mercenarylist.length < libConst.MercenaryCount) {
                merc = db_Manager.getMercenary(_mercenaryidx);
                m_mercenarylist.push({name:merc.name, index:merc.index, exp:0, hp:Number(merc.ability.hp), mp:Number(merc.ability.mp), sp:Number(merc.ability.sp), pay:Number(merc.pay), isuse:"Y"});
                return true;
            }

            return false;
        },
        removeMercenary:function(_arrayidx) {
            var rtn = false;
            if(m_mercenarylist.length > _arrayidx) {
                m_mercenarylist.splice(_arrayidx,1);
                rtn = true;
            }

            return rtn;
        },
        getMercenaryList:function() {
            return m_mercenarylist;
        },
        recovery:function(_arrayidx, _target, _percent) {
            _Recovery(_arrayidx, _target, _percent);
        },
        incExp:function(_count) {
            var merc;
            for(var i = 0; i < m_mercenarylist.length; ++i) {
                m_mercenarylist[i].exp += _count;
            }
        },
        ChangeMercenary:function(_arrayidx, _name) {
            var rtn = false;
            if(m_mercenarylist.length > _arrayidx) {
                rtn = _Upgrade(_arrayidx, _name);
            }

            return rtn;
        },
        setUse:function(_arrayidx, _use) {
            var merc = m_mercenarylist[_arrayidx];
            if(merc !== undefined && merc !== null) {
                if(_use === "Y" || _use === "N")  {
                    merc.isuse = _use;
                    return true;
                }
            }
            return false;
        }
    };
}
function clsExplorer(_info) {
    var m_name = _info.name;
    var m_stat = _info.stat; // {str, dex, luk}
    var m_grade = _info.grade; // C~SS
    var m_lock = _info.lock;
    var m_huntingtime = _info.huntingtime;
    var m_huntingloc = _info.huntingloc;

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, stat:m_stat, grade:m_grade, lock:m_lock, huntingtime:m_huntingtime, huntingloc:m_huntingloc};
        },
        setGrade:function(_grade) {
            m_grade = _grade;
        },
        getGrade:function() {
            return m_grade;
        },
        setStat:function(_stat) {
            m_stat = _stat;
        },
        getStat:function() {
            return m_stat;
        },
        setLock:function(_lock) {
            m_lock = _lock;
        },
        getLock:function() {
            return m_lock;
        },
        setTime:function(_time) {
            m_huntingtime = _time;
        },
        getTime:function() {
          return m_huntingtime;
        },
        setLoc:function(_loc) {
            m_huntingloc = _loc;
        },
        getLoc:function() {
          return m_huntingloc;
        }
    };
}
function clsClan(_info) {
    var m_name = _info.name;
    var m_clanuser = _info.clanuser; // [{id, duty, donation} ..... ]
    var m_inviteuser = _info.inviteuser; // [id] 초대 리스트``
    var m_requestuser = _info.requestuser; // [id] 신청 리스트
    var m_rune = _info.rune;
    var m_storage = _info.storage; // [{index, count, kind} ... ]
    var m_conquest = (_info.conquest === undefined?[]:_info.conquest); // [{nation, city, islock} .... ]
    var m_clancount = _info.clancount;  // 클랜원 카운터
    var m_bless = _info.bless; // [{index, level}]
    var m_buff = _info.buff; // [{target:(attack, magic, defense, atkspeed, accuracy, avoid, critical...), percent:10, }]
    var m_godweapon = _info.godweapon;  // [] 신기리스트
    var m_isopen = _info.isopen;    // T면 오픈된거고 F면 오픈전

    var _FindStorage, _FindBlessLevel, _FindBless, _IncBless, _calcBuff, _FindBuff;

    _FindStorage = function(_kind, _itemindx) {
        var item;
        for(var i = 0; i < m_storage.length; ++i) {
            item = m_storage[i];
            if(item.kind === _kind && item.index === _itemindx)
                return i;
        }
        return -1;
    };
    _FindBlessLevel = function(_index) {
        var bless;
        for(var i = 0; i < m_bless.length; ++i) {
            bless = m_bless[i];
            if(bless.index === _index)
                return bless.level;
        }
        return 0;
    };
    _FindBless = function(_index) {
        var bless;
        for(var i = 0; i < m_bless.length; ++i) {
            bless = m_bless[i];
            if(bless.index === _index)
                return bless;
        }
        return null;
    };
    _IncBless = function(_index) {
        var bless = _FindBless(_index);

        if(bless === null)
            m_bless.push({index:_index, level:1});
        else
            bless.level++;

        _calcBuff();
    };
    _calcBuff = function() {
        var buff;
        m_buff = [];
        for(var i = 0; i < m_bless.length; ++i) {
            buff = db_Manager.getClanBuff(m_bless[i].index);
            m_buff.push({target:buff.buffname, percent:buff.rate[m_bless[i].level - 1]});
        }
    };
    _FindBuff = function(_target) {
        var buff;
        for(var i = 0; i < m_buff.length; ++i) {
            buff = m_buff[i];
            if(buff.target === _target)
                return buff;
        }
        return null;
    };

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, clanuser:m_clanuser, inviteuser:m_inviteuser, requestuser:m_requestuser,
                    rune:m_rune, storage:m_storage, conquest:m_conquest, clancount:m_clancount,
                    bless:m_bless, buff:m_buff, godweapon:m_godweapon, isopen:m_isopen};
        },
        getClanCount:function() {
            return m_clancount;
        },
        addClanCount:function() {
            m_clancount++;
        },
        decClanCount:function() {
            m_clancount--;
        },
        getClanMaxCount:function() {
            return Math.floor(libConst.ClanMinPersonCount * (1 + (_FindBuff("maxuser")===null?0:_FindBuff("maxuser").percent/100)));
        },
        remainCount:function() {
            return (m_clancount - this.getClanMaxCount() === 0?false:true);
        },
        openClan:function() {
            m_inviteuser = [];
            m_isopen = "T";
        },
        isOpen:function() {
            return (m_isopen === "T"?true:false);
        },
        getRune:function() {
            return m_rune;
        },
        addRune:function(_rune) {
            var remain = m_rune + _rune;
            if(remain >= 0) {
                m_rune = remain;
                return true;
            }
            return false;
        },
        addItem:function(_kind, _itemidx, _count) {
            var invenIdx = _FindStorage(_kind, _itemidx);
            if(invenIdx === -1)
                m_storage.push({kind:_kind, index:_itemidx, count:_count});
            else
                m_storage[invenIdx].count = Number(m_storage[invenIdx].count) + Number(_count);
        },
        removeItem:function(_kind, _itemidx, _count) {
          var rtnValue = false;
          var invenIdx = _FindStorage(_kind, _itemidx);

          if(invenIdx !== -1) {
              if(Number(m_storage[invenIdx].count) < Number(_count)) {
                  rtnValue = false;
              }
              else if(Number(m_storage[invenIdx].count) === Number(_count)) {
                  m_storage.splice(invenIdx, 1);
                  rtnValue = true;
              }
              else {
                  m_storage[invenIdx].count = Number(m_storage[invenIdx].count) - Number(_count);
                  rtnValue = true;
              }
          }
          return rtnValue;
        },
        getBuff:function() {
            return m_buff;
        },
        getStorage:function() {
            return m_storage;
        },
        setDonation:function(_id, _rune) {
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].id === _id) {
                    m_clanuser[i].donation += Math.floor(_rune/libConst.ClanPointPerDonation);
                    break;
                }
            }
        },
        getDonation:function(_id) {
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].id === _id) {
                    return m_clanuser[i].donation;
                }
            }
        },
        getUserforDuty:function(_duty) {
            var rtnArray = [];
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].duty === _duty) {
                    rtnArray.push(m_clanuser[i].id);
                }
            }
            return rtnArray;
        },
        getUsers:function() {
            return m_clanuser;
        },
        isUser:function(_id) {
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].id === _id) {
                    return true;
                }
            }
            return false;
        },
        getDuty:function(_id) {
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].id === _id) {

                    return m_clanuser[i].duty;
                }
            }
            return -1;
        },
        setDuty:function(_id, _duty) {
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].id === _id) {

                    m_clanuser[i].duty = _duty;
                    return true;
                }
            }
            return false;
        },
        removeUser:function(_id) {
            for(var i = 0; i < m_clanuser.length; ++i) {
                if(m_clanuser[i].id === _id) {
                    m_clanuser.splice(i,1);
                    return true;
                }
            }
            return false;
        },
        InviteUser:function(_id) {
            if(m_inviteuser.indexOf(_id) === -1) {
                m_inviteuser.push(_id);
                return true;
            }
            return false;
        },
        isInviteUser:function(_id) {
            for(var i = 0; i < m_inviteuser.length; ++i) {
                if(m_inviteuser[i] === _id) {
                    return true;
                }
            }
            return false;
        },
        removeInviteUser:function(_id) {
            var inviteuser = m_inviteuser.indexOf(_id);
            if(inviteuser === -1) {
                return false;
            }
            m_inviteuser.splice(inviteuser, 1);
            return true;
        },
        changeInviteUser:function(_id, _duty) {
            var inviteuser = m_inviteuser.indexOf(_id);
            var clanuser = m_clanuser.indexOf(_id);
            if(inviteuser === -1 || clanuser !== -1) {
                return false;
            }

            m_inviteuser.splice(inviteuser, 1);
            m_clanuser.push({id:_id, duty:_duty, donation:0});

            return true;
        },
        requestUser:function(_id) {
            if(m_requestuser.indexOf(_id) === -1) {
                m_requestuser.push(_id);
                return true;
            }
            return false;
        },
        isRequestUser:function(_id) {
            for(var i = 0; i < m_requestuser.length; ++i) {
                if(m_requestuser[i] === _id) {
                    return true;
                }
            }
            return false;
        },
        removeRequestUser:function(_id) {
            var requestuser = m_requestuser.indexOf(_id);
            if(requestuser === -1) {
                return false;
            }
            m_requestuser.splice(requestuser, 1);
            return true;
        },
        changeRequestUser:function(_id, _duty) {
            var requestuser = m_requestuser.indexOf(_id);
            var clanuser = m_clanuser.indexOf(_id);
            if(requestuser === -1 || clanuser !== -1) {
                return false;
            }

            m_requestuser.splice(requestuser, 1);
            m_clanuser.push({id:_id, duty:_duty, donation:0});

            return true;
        },
        getRequestUsers:function() {
            return m_requestuser;
        },
        getItemCount:function(_kind, _itemidx) {
            var tmpitem;
            for(var i = 0; i < m_storage.length; ++i) {
                tmpitem = m_storage[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx)
                    return tmpitem.count;
            }
            return -1;
        },
        getBlesslevel:function(_index) {
            return _FindBlessLevel(_index);
        },
        setBless:function(_index) {
            _IncBless(_index);
        },
        nextOwner:function() {
            m_clanuser[0].duty = 1;
        },
        getConquestList:function() {
            return m_conquest;
        },
        addConquest:function(_nation, _city) {
            var tmpconquest = null;
            for(var i = 0; i < m_conquest.length; ++i) {
                if(m_conquest[i].nation === _nation && m_conquest[i].city === _city) {
                    tmpconquest = m_conquest[i];
                    break;
                }
            }

            if(tmpconquest !== null) {
                tmpconquest.islock = true;
            }
            else {
                m_conquest.push({nation:_nation,
                    city:_city, 
                    islock:true});
            }
        },
        getLockedConquest:function(_nation, _city) {
            for(var i = 0; i < m_conquest.length; ++i) {
                if(m_conquest[i].nation === _nation && m_conquest[i].city === _city && m_conquest[i].islock) {
                    return m_conquest[i];
                }
            }
            return null;
        },
        setConquestLock:function(_islock) {
            for(var i = 0; i < m_conquest.length; ++i) {
                m_conquest[i].islock = _islock;
            }
        }
    };
}
function clsExchange(_info) {
    var m_date = _info.date;
    var m_saler = _info.saler;
    var m_rune = _info.rune;
    var m_itemname = _info.itemname;
    var m_itemidx = _info.itemidx;
    var m_itemkind = _info.itemkind;
    var m_itemcnt = _info.itemcnt;

    return {
        saler:m_saler,
        date:m_date,
        rune:m_rune,
        itemname:m_itemname,
        itemkind:m_itemkind,
        itemindex:m_itemidx,
        getJson:function() {
            return {date:m_date, saler:m_saler, rune:m_rune, itemname:m_itemname, itemidx:m_itemidx, itemkind:m_itemkind, itemcnt:m_itemcnt};
        },
        getItemCnt:function() {
            return m_itemcnt;
        },
        removeCnt:function(_cnt) {
            m_itemcnt -= _cnt;
            return m_itemcnt;
        }
    };
}
function clsMarketPrice(_info) {
    var m_name = _info.name;
    var m_marketprice = _info.marketprice;
    var m_rcdprice = _info.rcdprice; //[{price:_price, count:_count}] 최근 20개 평균을 잰다.

    var minprice;
    var maxprice;

    var _init = function() {
        var rcdLength = m_rcdprice.length;
        minprice = Math.floor(m_marketprice - (m_marketprice * libConst.MPrice_Gap));
        if(minprice < libConst.MPrice_Minimum) {
            minprice = libConst.MPrice_Minimum;
        }
        maxprice = Math.floor(m_marketprice + (m_marketprice * libConst.MPrice_Gap));
        if(maxprice < libConst.MPrice_Minimum) {
            maxprice = libConst.MPrice_Minimum;
        }
        
        for(var i = 0; i < libConst.MPrice_Average - rcdLength; ++i) {
            m_rcdprice.push({price:m_marketprice, count:100});
        }
    };
    _init();
    var _checkRecord = function() {
        var rcd, total_price = 0, total_count = 0;
        for(var i = 0; i < m_rcdprice.length ; ++i) {
            rcd = m_rcdprice[i];
            total_price += (rcd.price * rcd.count);
            total_count += rcd.count;
        }

        m_marketprice = Math.floor(total_price / total_count);
        minprice = Math.floor(m_marketprice - (m_marketprice * libConst.MPrice_Gap));
        if(minprice < libConst.MPrice_Minimum) {
            minprice = libConst.MPrice_Minimum;
        }
        maxprice = Math.floor(m_marketprice + (m_marketprice * libConst.MPrice_Gap));
        if(maxprice < libConst.MPrice_Minimum) {
            maxprice = libConst.MPrice_Minimum;
        }
    };

    return {
        name: m_name,
        getJson:function() {
            return {name:m_name, marketprice:m_marketprice, rcdprice:m_rcdprice};
        },
        getMarketPrice:function() {
            return m_marketprice;
        },
        getMaxPrice:function() {
            return maxprice;
        },
        getMinPrice:function() {
            return minprice;
        },
        record:function(_price, _count) {
            m_rcdprice.push({price:_price, count:_count});
            m_rcdprice.splice(0,1);
            _checkRecord();
        },
        initRecord:function(_price) {
            m_rcdprice = [];
            m_marketprice = _price;
            _init();
        }
    };

}
function clsGamblerInfo(_info) {
    var m_name = _info.name;            // 유저명
    var m_coin = _info.coin;            // 보유 코인
    var m_grade = _info.grade;          // 등급
    var m_score = _info.score;          // 획득 점수
    var m_exchangecoin = _info.exchangecoin;  // 환전 코인 누적량

    return {
        name : m_name,
        getJson:function() {
            return {name:m_name, coin:m_coin, grade:m_grade, score:m_score, exchangecoin:m_exchangecoin};
        },
        addCoin:function(_coin, _isexchange) {
            var remain = m_coin + _coin;
            if(remain >= 0) {
                m_coin = remain;
                if(_isexchange) {
                    m_exchangecoin += _coin;
                }
                return true;
            }
            return false;
        },
        getCoin:function() {
            return m_coin;
        }
    };
}
function clsPet(_info) {
    var m_name = _info.name;        // 유저명
    var m_petname = _info.petname;    // 펫명
    var m_inventory = _info.inventory;  // 펫 창고 [{kind, index, count, strength}    ]
    var m_buff = _info.buff;            // 펫 버프 [{index, amount} , .....]; 총 n개가 랜덤으로 붙는다. 전투시에 적용되는 버프
    var m_familiarity = _info.familiarity;  // 펫 친밀도
    var m_conversationtime = _info.conversationtime;  // 대화 텀 계산시 사용

    var _FindInventory;

    var isStore = m_familiarity >= libConst.Pet_Store_Familiarity;

    _FindInventory = function(_kind, _itemindx, _strength) {
        var item;
        for(var i = 0; i < m_inventory.length; ++i) {
            item = m_inventory[i];
            if(item.kind === _kind && item.index === _itemindx && item.strength === _strength)
                return i;

        }
        return -1;
    };

    return {
        name : m_name,
        getJson:function() {
            return {name:m_name, petname:m_petname, inventory:m_inventory, buff:m_buff, familiarity:m_familiarity, conversationtime:m_conversationtime};
        },
        getPetName:function() {
            return m_petname;
        },
        getFamiliarity:function() {
            return m_familiarity;
        },
        addFamiliarity:function(_point) {
            m_familiarity += _point;
        },
        getConversationTime:function() {
            return m_conversationtime;
        },
        resetConversationTime:function() {
            m_conversationtime = (new Date()).getTime();
        },
        getPetName:function() {
            return m_petname;
        },
        confirmStroe:function() {
            isStore = m_familiarity >= libConst.Pet_Store_Familiarity;
        },
        isStore:function() {
            return isStore;
        },
        getInventory:function() {
            return m_inventory;
        },
        addItem:function(_kind, _itemidx, _count, _strength) {
            var strength = (_strength === undefined?0:_strength);
            var invenIdx = _FindInventory(_kind, _itemidx, strength);

            if(invenIdx === -1)
                m_inventory.push({kind:_kind, index:_itemidx, count:Number(_count), strength:strength});
            else
                m_inventory[invenIdx].count = Number(m_inventory[invenIdx].count) + Number(_count);
        },
        removeItem:function(_kind, _itemidx, _count, _strength) {
          var rtnValue = false;
          var strength = (_strength === undefined?0:_strength);
          var invenIdx = _FindInventory(_kind, _itemidx, strength);

          if(invenIdx !== -1) {
              if(Number(m_inventory[invenIdx].count) < Number(_count)) {
                  rtnValue = false;
              }
              else if(Number(m_inventory[invenIdx].count) === Number(_count)) {
                  m_inventory.splice(invenIdx, 1);
                  rtnValue = true;
              }
              else {
                  m_inventory[invenIdx].count = Number(m_inventory[invenIdx].count) - Number(_count);
                  rtnValue = true;
              }
          }
          return rtnValue;
        },
        isItemCount:function(_kind, _itemidx, _count, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && Number(tmpitem.count) >= _count && tmpitem.strength === strength)
                    return true;
            }
            return false;
        },
        getItemCount:function(_kind, _itemidx, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_inventory.length; ++i) {
                tmpitem = m_inventory[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && tmpitem.strength === strength)
                    return tmpitem.count;
            }
            return -1;
        },
        setBuff:function(_bufflist) {
            m_buff = _bufflist;
        },
        getBuff:function() {
            return m_buff;
        }
    };
}
function clsHome(_info) {
    var m_name = _info.name;
    var m_homename = _info.homename;
    var m_location = _info.location; //위치 {country, city, facility, field, dungeon}
    var m_level = _info.level;
    var m_inspace = _info.inspace;
    var m_outspace = _info.outspace;
    var m_furniturelist = _info.furniturelist;  //[1, 2, ....]
    var m_farmlist = _info.farmlist;
    var m_box = _info.box; // [{kind, index, count, strength}  ....]
    var m_savelocation = (_info.savelocation===undefined?[]:_info.savelocation); // [{locname, country, city, facility, field}, ....]


    var environment = libConst.House_DefualtEnvironment;
    var savemaxcnt = 0;

    var _CalcEnvironment, _CalcMaxSaveLocation, _FindSavePoint, _FindBox;

    if(m_location.dungeon === undefined)
        m_location.dungeon = "";

    _CalcEnvironment = function() {
        var i, db;
        environment = libConst.House_DefualtEnvironment;
        for(i = 0; i < m_furniturelist.length; ++i) {
            db = db_Manager.getFunctionalityItem(m_furniturelist[i]);
            if(db.effect === "deco") {
                environment += Number(db.amount);
            }
            else {
                environment -= Number(db.amount);
            }
        }
    };
    _CalcMaxSaveLocation = function() {
        var i, db;
        savemaxcnt = 0;
        for(i = 0; i < m_furniturelist.length; ++i) {
            db = db_Manager.getFunctionalityItem(m_furniturelist[i]);
            if(db.effect === "go") {
                savemaxcnt += libConst.House_WarpGateCount;
            }
            else if(db.effect === "savelocation") {
                savemaxcnt += libConst.House_SaveLocationCount;
            }
        }
    };

    _FindSavePoint = function(_locname) {
        var loc;
        for(var i = 0; i < m_savelocation.length; ++i) {
            loc = m_savelocation[i];
            if(loc.locname === _locname)
                return i;
        }
        return -1;
    };
    _FindBox = function(_kind, _itemindx, _strength) {
        var item;
        for(var i = 0; i < m_box.length; ++i) {
            item = m_box[i];
            if(item.kind === _kind && item.index === _itemindx && item.strength === _strength)
                return i;
        }
        return -1;
    };

    _CalcEnvironment();
    _CalcMaxSaveLocation();

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, homename:m_homename, location:m_location, level:m_level, inspace:m_inspace, outspace:m_outspace,
                    furniturelist:m_furniturelist, farmlist:m_farmlist, box:m_box, savelocation:m_savelocation};
        },
        getHomeName:function() {
            return m_homename;
        },
        getHomeLevel:function() {
            return m_level;
        },
        getNextLevel:function() {
            return "" + (Number(m_level) + 1);
        },
        addHomeLevel:function() {
            m_level = "" + (Number(m_level) + 1);
        },
        getHomeLoc:function() {
            return m_location;
        },
        setHomeLoc:function(_country, _city, _facility, _field, _dungeon) {
            m_location.country = _country;
            m_location.city = _city;
            m_location.facility = _facility;
            m_location.field = _field;
            m_location.dungeon = _dungeon;
        },
        getHomeInspace:function() {
            return m_inspace;
        },
        getHomeOutspace:function() {
            return m_outspace;
        },
        isHomeInspace:function() {
            return m_inspace > m_furniturelist.length;
        },
        isHomeOutspace:function() {
            return m_outspace > m_farmlist.length;
        },
        setHomeInspace:function(_inspace) {
            m_inspace = _inspace;
        },
        setHomeOutspace:function(_outspacs) {
            m_outspace = _outspacs;
        },
        getFurnitureList:function() {
            return m_furniturelist;
        },
        addFurniture:function(_idx) {
            m_furniturelist.push(_idx);
            _CalcEnvironment();
            _CalcMaxSaveLocation();
        },
        removeFurniture:function(_idx) {
            m_furniturelist.splice(m_furniturelist.indexOf(_idx), 1);
            _CalcEnvironment();
            _CalcMaxSaveLocation();
        },
        isFurniture:function(_idx) {
            return (m_furniturelist.indexOf(_idx) !== -1);
        },
        getFarmList:function() {
            return m_farmlist;
        },
        addFarm:function(_idx) {
            m_farmlist.push(_idx);
        },
        removeFarm:function(_idx) {
            m_farmlist.splice(m_farmlist.indexOf(_idx), 1);
        },
        isFarm:function(_idx) {
            return (m_farmlist.indexOf(_idx) !== -1);
        },
        getEnvironment:function() {
            return environment;
        },
        getBox:function() {
            return m_box;
        },
        addItem:function(_kind, _itemidx, _count, _strength) {
            var strength = (_strength === undefined?0:_strength);
            var boxIdx = _FindBox(_kind, _itemidx, strength);

            if(boxIdx === -1)
                m_box.push({kind:_kind, index:_itemidx, count:Number(_count), strength:strength});
            else
                m_box[boxIdx].count = Number(m_box[boxIdx].count) + Number(_count);
        },
        removeItem:function(_kind, _itemidx, _count, _strength) {
            var rtnValue = false;
            var strength = (_strength === undefined?0:_strength);
            var boxIdx = _FindBox(_kind, _itemidx, strength);

            if(boxIdx !== -1) {
                if(Number(m_box[boxIdx].count) < Number(_count)) {
                    rtnValue = false;
                }
                else if(Number(m_box[boxIdx].count) === Number(_count)) {
                    m_box.splice(boxIdx, 1);
                    rtnValue = true;
                }
                else {
                    m_box[boxIdx].count = Number(m_box[boxIdx].count) - Number(_count);
                    rtnValue = true;
                }
            }
            return rtnValue;
        },
        isItemCount:function(_kind, _itemidx, _count, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_box.length; ++i) {
                tmpitem = m_box[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && Number(tmpitem.count) >= _count && tmpitem.strength === strength)
                    return true;
            }
            return false;
        },
        getItemCount:function(_kind, _itemidx, _strength) {
            var tmpitem;
            var strength = (_strength === undefined?0:_strength);
            for(var i = 0; i < m_box.length; ++i) {
                tmpitem = m_box[i];
                if(tmpitem.kind === _kind && tmpitem.index === _itemidx && tmpitem.strength === strength)
                    return tmpitem.count;
            }
            return -1;
        },
        addSaveLocation:function(_locname, _country, _city, _facility, _field, _dungeon){
            m_savelocation.push({locname:_locname, country:_country, city:_city, facility:_facility, field:_field, dungeon:_dungeon});
        },
        removeSaveLocation:function(_locname) {
            var idx = _FindSavePoint(_locname);
            if(idx === -1) {
                return false;
            }
            m_savelocation.splice(idx,1);
            return true;
        },
        findSavePoint:_FindSavePoint,
        getSaveLocation:function() {
            return m_savelocation;
        },
        getSaveMaxCnt:function() {
            return savemaxcnt;
        }
    };
}
function clsFisherMan(_info) {
    var m_name = _info.name;        // 유저명
    var m_setting = _info.setting;    // {fishinglod:"", reel:"", lure:"", fishinggut:""}
    var m_ability = _info.ability;  // {timeterm:-1, sizerate::-1, uniquerate:-1}

    var _CalcAbility;

    _CalcAbility = function() {
        var itemDB;
        var timeterm = 0, sizerate = 0, uniquerate = 0;
        for(var obj in m_setting) {
            itemDB = db_Manager.getFunctionalityItem(m_setting[obj]);
            if(itemDB === null)
                continue;

            if(itemDB.effect === "timeterm") {
                timeterm += Number(itemDB.amount);
            }
            else if(itemDB.effect === "sizerate") {
                sizerate += Number(itemDB.amount);
            }
            else if(itemDB.effect === "uniquerate") {
                uniquerate += Number(itemDB.amount);
            }
        }
        m_ability.timeterm = libConst.Fishing_Defualt_TimeTerm - timeterm;
        m_ability.sizerate = libConst.Fishing_Defualt_SizeRate + sizerate;
        m_ability.uniquerate = libConst.Fishing_Defualt_UniqueRate + uniquerate;
    };

    return {
        name : m_name,
        calcAbility:function(){
            _CalcAbility();
        },
        getJson:function() {
            return {name:m_name, setting:m_setting, ability:m_ability};
        },
        setFishingLod:function(_itemidx) {
            m_setting.fishinglod = _itemidx;
            _CalcAbility();
        },
        setReel:function(_itemidx) {
            m_setting.reel = _itemidx;
            _CalcAbility();
        },
        setLure:function(_itemidx) {
            m_setting.lure = _itemidx;
            _CalcAbility();
        },
        setFishingGut:function(_itemidx) {
            m_setting.fishinggut = _itemidx;
            _CalcAbility();
        },
        getFishingLod:function() {
            return m_setting.fishinglod;
        },
        getReel:function() {
            return m_setting.reel;
        },
        getLure:function() {
            return m_setting.lure;
        },
        getFishingGut:function() {
            return m_setting.fishinggut;
        },
        getAbility:function() {
            return m_ability;
        },
        getSetting:function() {
            return m_setting;
        }
    };
}
function clsFishRanking(_info) {
    var m_name = _info.name;        // 유저명
    var m_fishindex = _info.fishindex;  // 물고기 인덱스
    var m_fishkind = _info.fishkind;  // 물고기 종류
    var m_size = _info.size;  // 물고기사이즈
    var m_grade = _info.grade;  // 물고기등급

    var gradeNum;
    switch(m_grade){
        case "F":
            gradeNum = 1;
            break;
        case "E":
            gradeNum = 2;
            break;
        case "D":
            gradeNum = 3;
            break;
        case "C":
            gradeNum = 4;
            break;
        case "B":
            gradeNum = 5;
            break;
        case "A":
            gradeNum = 6;
            break;
        case "S":
            gradeNum = 7;
            break;
        case "SS":
            gradeNum = 8;
            break;
        case "US":
            gradeNum = 9;
            break;
        case "MS":
            gradeNum = 10;
            break;
        case "RS":
            gradeNum = 11;
            break;
        case "GS":
            gradeNum = 12;
            break;
    }

    return {
        name : m_name,
        fishindex: m_fishindex,
        fishkind:m_fishkind,
        grade:m_grade,
        gradeNum:gradeNum,
        getJson:function() {
            return {name:m_name, fishindex:m_fishindex, fishkind:m_fishkind, grade:m_grade, size:m_size};
        },
        getSize:function() {
            return m_size;
        },
        setSize:function(_size) {
            m_size = _size;
        }
    };
}
function clsAttendance(_info) {
    var m_day = _info.day;        // 현재 일수
    var m_month = _info.month;
    var m_year = _info.year;
    var m_pushlist = _info.pushlist;  // 오늘 보상 받은사람 리스트

    return {
        day:m_day,
        month:m_month,
        year:m_year,
        getJson:function() {
            return {day:m_day, month:m_month, year:m_year, pushlist:m_pushlist};
        },
        Push:function(_id) {
            m_pushlist.push(_id);
        },
        isUser:function(_id) {
            return (m_pushlist.indexOf(_id) !== -1);
        },
        removeUser:function(_id) {
            var idx = m_pushlist.indexOf(_id);
            if(idx !== -1) {
                m_pushlist.splice(idx, 1);
            }
        }
    };
}
function clsBook(_info) {
    var m_title = _info.title;
    var m_date = _info.date;
    var m_writer = _info.writer;
    var m_filepath = _info.filepath;
    var m_librarian = _info.librarian;
    var m_status = _info.status;
    var m_subscribe = _info.subscribe; // [id, id, id,....]

    return {
        title:m_title,
        writer:m_writer,
        filepath:m_filepath,
        getJson:function() {
            return {title:m_title, date:m_date, writer:m_writer, filepath:m_filepath, librarian:m_librarian, status:m_status, subscribe:m_subscribe};
        },
        getLibrarian:function() {
            return m_librarian;
        },
        setLibrarian:function(_libr) {
              m_librarian = _libr;
        },
        getDate:function() {
            return m_date;
        },
        setDate:function(_date) {
              m_date = _date;
        },
        getStatus:function() {
            return m_status;
        },
        setStatus:function(_status) {
            m_status = _status;
        },
        Subscribed:function(_id) {
            m_subscribe.push(_id);
        },
        getSubscibe:function() {
            return m_subscribe;
        },
        isSubscribe:function(_id) {
            return (m_subscribe.indexOf(_id) !== -1);
        }
    };
}
function clsParty(_info) {
    var m_name = _info.name;
    var m_list = _info.list;
    var m_waiting = _info.waiting;
    var m_captain = _info.captain;
    var m_notice = _info.notice;
    var m_inven = _info.inven; // [{index, kind, count, strength} .... ]
    var m_rune = _info.rune;


    var _FindInventory;

    _FindInventory = function(_kind, _itemindx, _strength) {
        var item;
        for(var i = 0; i < m_inven.length; ++i) {
            item = m_inven[i];
            if(item.kind === _kind && item.index === _itemindx && item.strength === _strength)
                return i;

        }
        return -1;
    };

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, list:m_list, waiting:m_waiting, captain:m_captain, notice:m_notice, inven:m_inven, rune:m_rune};
        },
        pushUser:function(_usernm) {
            m_list.push(_usernm);
        },
        popUser:function(_usernm) {
            var idx = m_list.indexOf(_usernm);

            if(idx !== -1) {
                m_list.splice(idx,1);
                return true;
            }
            return false;
        },
        isUser:function(_usernm) {
            var idx = m_list.indexOf(_usernm);
            if(idx !== -1) {
                return true;
            }
            return false;
        },
        getUserList:function() {
            return m_list;
        },
        getCaptain:function() {
            return m_captain;
        },
        setCaptain:function(_id) {
            if(m_list.indexOf(_id) !== -1) {
                m_captain = _id;
                return true;
            }
            return false;
        },
        setNotice:function(_content) {
            m_notice = _content;
        },
        getNotice:function() {
            return m_notice;
        },
        addItem:function(_kind, _itemidx, _count, _strength) {
            var strength = (_strength === undefined?0:_strength);
            var invenIdx = _FindInventory(_kind, _itemidx, strength);

            if(invenIdx === -1)
                m_inven.push({kind:_kind, index:_itemidx, count:Number(_count), strength:strength});
            else
                m_inven[invenIdx].count = Number(m_inven[invenIdx].count) + Number(_count);
        },
        getInven:function() {
            return m_inven;
        },
        addWaiting:function(_id) {
            m_waiting.push(_id);
        },
        removeWaiting:function(_id) {
            var idx = m_waiting.indexOf(_id);
            if(idx === -1) {
                return false;
            }

            m_waiting.splice(idx,1);
            return true;
        },
        getWaiting:function() {
            return m_waiting;
        },
        isWaiting:function(_id) {
            var idx = m_waiting.indexOf(_id);
            if(idx !== -1) {
                return true;
            }
            return false;
        }
    };
}

const ObtainKind = {MINING:0, FELLING:1, STONING:2, GETTING:3};
function clsAutoObtain(_info) {
    var m_name = _info.name;
    var m_kind = _info.kind;
    var m_starttime = _info.starttime;
    var m_endtime = _info.endtime;
    var m_location = _info.location; // 채굴 위치 {country, city, facility, field, dungeon, home}

    var Resulting;

    Resulting = function() {
        var remineTime = m_endtime - m_starttime;
        var chance;
        var tmpRand, rtnArray = [], i, tmpInfo;
        var preRate = 0, currRate = 0;
        var dbList;
        var maxRate = 0;

        switch(m_kind) {
            case ObtainKind.MINING:
                chance = Math.floor(remineTime / libConst.MiningDefaultSpeed);
                dbList = MINEITEMLIST;
                maxRate = 100;
                break;
            case ObtainKind.FELLING:
                chance = Math.floor(remineTime / libConst.FellingDefaultSpeed);
                dbList = db_Manager.getTreeList(m_location.city, m_location.facility);
                for(i = 0; i < dbList.length; ++i) {
                    maxRate += Number(dbList[i].rate);
                }
                break;
            case ObtainKind.STONING:
                chance = Math.floor(remineTime / libConst.StoningDefaultSpeed);
                dbList = db_Manager.getStoneList(m_location.city, m_location.facility);
                for(i = 0; i < dbList.length; ++i) {
                    maxRate += Number(dbList[i].rate);
                }
                break;
            case ObtainKind.GETTING:
                chance = Math.floor(remineTime / libConst.GettingDefaultSpeed);
                dbList = db_Manager.getGettingList(m_location.city, m_location.facility);
                for(i = 0; i < dbList.length; ++i) {
                    maxRate += Number(dbList[i].rate);
                }
                break;
        }


        for(i = 0; i < chance; ++i){
            tmpRand = libCommon.Randfloat(0,maxRate);
            preRate = 0;
            currRate = 0;
            for(var m = 0; m < dbList.length; ++m) {

                if(m_kind === ObtainKind.MINING) {
                    preRate += (m===0?0:db_Manager.getMineRate(dbList[m - 1]));
                    currRate += db_Manager.getMineRate(dbList[m]);
                    if(tmpRand >= preRate && tmpRand < currRate) {
                        rtnArray.push({index:dbList[m], count:1, kind:"SundryItem"});
                        break;
                    }
                }
                else {
                    tmpInfo = dbList[m];
                    preRate += (m===0?0:Number(dbList[m-1].rate));
                    currRate += Number(tmpInfo.rate);
                    if(tmpRand >= preRate && tmpRand < currRate) {
                        rtnArray.push({index:tmpInfo.item, count:tmpInfo.count, kind:tmpInfo.itemkind});
                        break;
                    }
                }
            }
        }
        return rtnArray;
    };

    return {
        name:m_name,
        kind:m_kind,
        getJson:function() {
            return {name:m_name, kind:m_kind, starttime:m_starttime, endtime:m_endtime, location:m_location};
        },
        setStartTime:function() {
            m_starttime = (new Date()).getTime();
        },
        getStartTime:function() {
            return m_starttime;
        },
        setEndTime:function(_worktime) { 
            // _worktime >> 초단위 ex 5초 : 5, 1분 : 60, 1시간 : 3600
            m_endtime = m_starttime + (_worktime * 1000);
        },
        getEndTime:function() {
            return m_endtime;
        },
        getLocation:function() {
            return m_location;
        },
        getResultItem:function() {
            var currTime = (new Date()).getTime();
            if(m_endtime <= currTime) {
                return Resulting();
            }
            return null;
        }
    };
}
function clsUserStock(_info) {
    var m_name = _info.name;
    var m_accrue = _info.accrue;
    var m_stocklist = _info.stocklist; // [{index, purchase_price, count}]

    var FindStock = function(_index) {
        var rtnArray = [];
        for(var i = 0; i < m_stocklist.length; ++i) {
            if(m_stocklist[i].index === _index) {
                rtnArray.push(m_stocklist[i]);
            }
        }

        return rtnArray;
    };
    var FindStockIndex = function(_index) {
        for(var i = 0; i < m_stocklist.length; ++i) {
            if(m_stocklist[i].index === _index) {
                return i;
            }
        }

        return -1;
    };

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, accrue:m_accrue, stocklist:m_stocklist};
        },
        getStockList:function(_index) {
            if(_index === "all") {
                return m_stocklist;
            }
            else {
                return FindStock(_index);
            }
        },
        addStock:function(_index, _price, _count) {
            var tmpstock = FindStock(_index);
            var average = 0;

            if(tmpstock.length === 0) {
                m_stocklist.push({index:_index, purchase_price:_price, count:_count});
            }
            else {
                average = ((tmpstock[0].purchase_price * tmpstock[0].count) + (_price * _count)) / (tmpstock[0].count + _count);
                tmpstock[0].purchase_price = average;
                tmpstock[0].count += _count;
            }
        },
        getAccrue:function() {
            return m_accrue;
        },
        addAccrue:function(_acc) {
            m_accrue += _acc;
        },
        isStock:function(_index, _count) {
            var tmpstock = FindStock(_index);

            if(tmpstock.length === 0) {
                return false;
            }
            else {
                if(tmpstock[0].count >= _count) {
                    return true;
                }
            }
            return false;
        },
        removeStock:function(_index, _count) {
            var rtnFlag = this.isStock(_index, _count);
            var tmpIndex = FindStockIndex(_index);

            if(rtnFlag) {
                m_stocklist[tmpIndex].count -= _count;
                if(m_stocklist[tmpIndex].count <= 0)
                    m_stocklist.splice(tmpIndex, 1);
            }

            return rtnFlag;
        }
        
    };
}

function clsCurrentStock(_info) {
    var m_index = _info.index;
    var m_name = _info.name;
    var m_curr_price = _info.curr_price;
    var m_curr_dividend = _info.curr_dividend;      // 배당금
    var m_news_list = _info.news_list; // [ newsindex, ... ]

    return {
        index:m_index,
        name:m_name,
        getJson:function() {
            return {name:m_name, 
                    index:m_index, 
                    curr_price:m_curr_price, 
                    curr_dividend:m_curr_dividend, 
                    news_list:m_news_list};
        },
        getCurrPrice:function() {
            return m_curr_price;
        },
        getCurrDividend:function() {
            return m_curr_dividend;
        },
        getNewsList:function() {
            return m_news_list;
        },
        addCurrPrice:function(_price) {
            if(m_curr_price + _price < 0)
                m_curr_price = 0;
            else
                m_curr_price += _price;
        },
        addCurrDividend:function(_price) {
            if(m_curr_dividend + _price < 0)
                m_curr_dividend = 0;
            else
                m_curr_dividend += _price;
        },
        setNewsList:function(_newslist) {
            m_news_list = _newslist;
        }
        
    };
}

function clsHomework(_info) {
    var m_name = _info.name;
    var m_homeworks = (_info.homeworks === undefined?[]:_info.homeworks); // [{index, kind, type, attain, isgain} ...]

    var _Init;

    _Init = function() {
        var db = null, target;
        var homeworkDB = db_Manager.getAllHomework();
        
        for(var i = 0; i < homeworkDB.length; ++i) {
            db = homeworkDB[i];
            target = m_homeworks.find(function(t) { return t.index === db.index});

            if(target === undefined || target === null) {
                m_homeworks.push({index:db.index, kind:db.kind, type:db.type, attain:0, isgain:"N"});
            }
        }
    }();

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, homeworks:m_homeworks};
        },
        getHomeWorkList:function() {
            return m_homeworks;
        },
        setHomeWorkByType:function(_type, _count) {
            var homeworkDB;
            var tmp_hw;
            var rewardList = [];
            for(var i = 0; i < m_homeworks.length; ++i) {
                tmp_hw = m_homeworks[i];
                if(tmp_hw.type === _type && tmp_hw.isgain === "N") {
                    tmp_hw.attain += _count;
                    homeworkDB = db_Manager.getHomework(tmp_hw.index);
                    if(Number(homeworkDB.count) === tmp_hw.attain) {
                        tmp_hw.isgain = "Y";
                        rewardList.push(tmp_hw.index);
                    }
                }
            }

            return rewardList;
        },
        resetAllByKind:function(_kind) {
            var tmp_hw;

            for(var i = 0; i < m_homeworks.length; ++i) {
                tmp_hw = m_homeworks[i];

                if(tmp_hw.kind === _kind) {
                    tmp_hw.attain = 0;
                    tmp_hw.isgain = "N";
                }
            }
        }
    };
}

function clsCardDeckObj(_info) {
    var m_name = _info.name;
    var m_decklist = _info.decklist; // [{deckname , cards : [index .....]},   ]

    return {
        name:m_name,
        getJson:function() {
            return {name:m_name, decklist:m_decklist};
        },
        getDeckList:function() {
            return m_decklist;
        },
        findDeck:function(_deckname) {
            var deck = null;
            for(var i =0; i < m_decklist.length; ++i) {
                deck = m_decklist[i];

                if(deck.deckname === _deckname) {
                    break;
                }
                deck = null;
            }

            return deck;
        },
        findDeckbyIndex:function(_index) {
            var deck = null;
            if(m_decklist.length > _index) {
                deck = m_decklist[_index];
            }
            return deck;
        },
        addCard:function(_deckname, _cardIdx) {
            var deck = this.findDeck(_deckname);

            if(deck !== null) {
                deck.cards.push(_cardIdx);
                return true;
            }
            return false;
        },
        removeCard:function(_deckname, _cardIdx) {
            var deck = this.findDeck(_deckname);
            var lastIndex = -1;

            if(deck !== null) {
                lastIndex = deck.cards.lastIndexOf(_cardIdx);

                if(lastIndex !== -1) {
                    deck.cards.splice(lastIndex, 1);
                    return true;
                }
            }
            return false;
        },
        getCardCount:function(_deckname, _cardIdx) {
            var deck = this.findDeck(_deckname);
            var count = -1;

            if(deck !== null) {
                count = deck.cards.filter(function(c) {
                    return c === _cardIdx;
                }).length;
            }

            return count;
        },
        getAllCount:function(_deckname) {
            var deck = this.findDeck(_deckname);
            var count = -1;

            if(deck !== null) {
                count = deck.cards.length;
            }

            return count;
        }
    };
}
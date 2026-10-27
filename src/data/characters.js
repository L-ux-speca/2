'use strict';
// Edit this array to adjust the existing roster.
const CHARS=[
{id:'yuzuha',name:'Такахаси Юзуха',short:'Юзуха',tag:'Изумрудный биомант',hp:120,pe:170,speed:10,punch:10,kick:12,color:'#67d693',hair:'#e5e9db',outfit:'#215346',palette:'projectile orbit field shield pulse',skills:[SK('Щупальце',20,6,'Удар на 2 м · 20 HP'),SK('Изумрудный всплеск',25,8,'Поток 1,8 с · 11 HP/с'),SK('Мимикрия',30,8,'Неуязвимость на 3 с')]},
{id:'caesar',name:'Цезарь Цеппели',short:'Цезарь',tag:'Мастер пузырей',hp:130,pe:70,speed:8,punch:12,kick:14,color:'#80cee9',hair:'#e9cf83',outfit:'#315f82',palette:'projectile orbit shield pulse field',skills:[SK('Пузырьковая пушка',15,6,'Поток 2 с · 10 HP/с'),SK('Пузырьковый резак',12,5,'18 HP · отбрасывание'),SK('Пузырьковый барьер',18,8,'Щит 30 HP · 7 с')]},
{id:'araya',name:'Арая Юору',short:'Арая',tag:'Командир флотилии',hp:100,pe:170,speed:7,punch:10,kick:10,color:'#bd9ee8',hair:'#2f2639',outfit:'#3e335d',palette:'projectile field pulse shield',skills:[SK('Пушки',15,7,'Корабль · 7 ядер'),SK('Таран',22,7,'Телеграф 2,5 с · 30 HP'),SK('Барьер',15,8,'Призрачное судно · щит 30 HP')]},
{id:'lapis',name:'Ляпис Исивара',short:'Ляпис',tag:'Электромагнитное поле',hp:120,pe:170,speed:9,punch:10,kick:14,color:'#8de1dd',hair:'#eceeed',outfit:'#9a3443',palette:'projectile orbit field pulse shield dash',skills:[SK('Орбиты',22,11,'Два шара · 3,4 с'),SK('Рельсотрон',25,7,'Низкий выстрел · 25 HP'),SK('Притяжение',10,5,'Летящий магнитный якорь · двойное A / D — перенос')]},
{id:'tori',name:'Тори Зенин',short:'Тори',tag:'Воздушная мобильность',hp:90,pe:170,speed:10,punch:10,kick:12,color:'#9dddbd',hair:'#223b37',outfit:'#406665',palette:'projectile dash pulse heal field',skills:[SK('Полёт',0,1,'Свободное движение · 5 ПЭ/с'),SK('Бросок',7,3,'Разгон 1 с · 18 HP'),SK('Падение',24,6,'Пикирование · 30 + 10 HP'),SK('ОПТ',30,8,'Восстановление 30 HP')]},
{id:'akira',name:'Акира Такагасира',short:'Акира',tag:'Манипуляция кровью',hp:100,pe:100,speed:10,punch:8,kick:10,color:'#f8798e',hair:'#3a2932',outfit:'#714052',palette:'projectile orbit field pulse',skills:[SK('Кровавый поток',15,8,'Поток 2 с · кровотечение'),SK('Кровавая плеть',20,6,'17 HP · средняя дистанция'),SK('Кровавый пол',15,9,'Низкая волна · кровотечение')]},
{id:'sonic',name:'Онсоку Соник',short:'Соник',tag:'Сверхскорость и клоны',hp:100,pe:100,speed:11,punch:6,kick:10,color:'#b59bea',hair:'#222333',outfit:'#34334d',palette:'projectile dash pulse summon',skills:[SK('Жертва',10,10,'−20 HP · +8 скорости на 6 с'),SK('Клоны',25,12,'Три двойника по 10 HP'),SK('Катана',15,9,'Увеличенная дальность · 8 с')]},
{id:'david',name:'Дэвид Ватанабэ',short:'Дэвид',tag:'Гниение и ловушки',hp:120,pe:200,speed:9,punch:10,kick:12,color:'#afce6e',hair:'#6e6f5a',outfit:'#535b3d',palette:'projectile field pulse shield',skills:[SK('Гниющий кулак',10,7,'+5 к урону кулака · 5 с'),SK('Гниющий снаряд',25,6,'25 HP · 1 с защиты'),SK('Токсичная среда',20,10,'Ловушки через 3 с · яд')]},
{id:'chieko',name:'Чиэко Зенин',short:'Чиэко',tag:'Четыре стихии',hp:90,pe:170,speed:10,punch:8,kick:10,color:'#a4d8fa',hair:'#c7dceb',outfit:'#395875',palette:'projectile field shield pulse',skills:[SK('Торнадо',7,6,'Контроль · стан 1,5 с'),SK('Солнечный удар',15,8,'Телеграф 0,5 с · 20 HP'),SK('Ледяной блок',12,8,'Контратака · замедление'),SK('Волна',20,10,'Круговой удар · 20 HP')]},
{id:'airi',name:'Айри Камиме',short:'Айри',tag:'Живой металл',hp:120,pe:170,speed:8,punch:10,kick:13,color:'#c9c9dd',hair:'#525070',outfit:'#68667e',palette:'projectile field shield summon orbit',skills:[SK('Манипуляция металлами',20,10,'Падение металла через 3 с'),SK('Металлический клон',10,12,'Автономный двойник · 10 HP'),SK('Металлические шипы',29,11,'Три разных высоты · по 12 HP')]},
{id:'dio',name:'Дио Камо',short:'Дио',tag:'Вампиризм и контратака',hp:100,pe:120,speed:10,punch:10,kick:12,color:'#f6bd71',hair:'#dbc46f',outfit:'#745332',palette:'projectile dash pulse shield',skills:[SK('Вампиризм',20,12,'10 HP · лечение 8 · усиление'),SK('Простая территория',10,9,'Контрстойка 2 с · ответ 25 HP'),SK('Последний шанс',30,0,'Один раз за раунд · спасение от KO',true)]},
{id:'kayano',name:'Каяно Микото',short:'Каяно',tag:'Бейсбольная комбинация',hp:100,pe:110,speed:8,punch:15,kick:10,color:'#f3a16f',hair:'#ae715e',outfit:'#75483e',palette:'projectile dash pulse field',skills:[SK('Метеор-комбинация',12,15,'Пять ударов · усиление от комбо')]},
{id:'mechamaru',name:'Кокичи Муто',short:'Мехамару',tag:'Механические куклы',hp:100,pe:1010,speed:5,punch:9,kick:0,color:'#8cc9ff',hair:'#787a76',outfit:'#525e64',palette:'projectile field pulse shield summon',skills:[SK('Ультимативный залп',95,8,'Предупреждение 0,8 с · 36 HP'),SK('Кукольный рой',80,9,'Наведение мышью или на врага · 3 с'),SK('Кукла',350,17,'Механическое тело · 55 HP')]},
{id:'kisei',name:'Кисей Микагами',short:'Кисей',tag:'Четыре шикигами',hp:120,pe:170,speed:9,punch:10,kick:12,color:'#ddadef',hair:'#272537',outfit:'#4e3e68',palette:'projectile field pulse summon',skills:[SK('Колесо Фортуны',20,8,'Наземный автомобиль · 25 HP'),SK('Серебряный Рыцарь',12,7,'Высокий выпад · 20 HP'),SK('Огненный Анх',10,6,'Навесной снаряд · горение'),SK('Император',8,.3,'Револьвер на 5 с · затем 4 ПЭ/выстрел')]}
];

// Optional characters can be appended here without editing the fight engine.
// Give each built-in skill an `effect` (see src/skills.js), or a custom handler.
const CharacterCatalog=Object.freeze({
  register(data){
    if(!data||typeof data!=='object'||!/^[a-z][a-z0-9_]*$/.test(data.id||''))
      throw Error('Invalid character id');
    if(CHARS.some(c=>c.id===data.id))throw Error('Duplicate character: '+data.id);
    for(const stat of ['hp','pe','speed','punch','kick'])
      if(!Number.isFinite(data[stat])||data[stat]<(stat==='kick'?0:1))
        throw Error(`Invalid ${stat} for ${data.id}`);
    if(!Array.isArray(data.skills)||data.skills.length<1||data.skills.length>4)
      throw Error('Characters must have 1–4 skills');
    const required=['name','short','tag','color','hair','outfit','palette'];
    if(required.some(k=>typeof data[k]!=='string'||!data[k]))
      throw Error('Missing character display fields');
    for(const skill of data.skills){
      if(typeof skill.name!=='string'||!Number.isFinite(skill.cost)||skill.cost<0||
         !Number.isFinite(skill.cd)||skill.cd<0||typeof skill.desc!=='string')
        throw Error('Invalid skill data');
    }
    const copy={...data,skills:data.skills.map(s=>({...s}))};
    CHARS.push(copy);
    return copy;
  },
  find(id){return CHARS.find(c=>c.id===id)||null;},
  all(){return [...CHARS];}
});

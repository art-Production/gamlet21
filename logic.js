/* Гамлет XXI века — общие данные и правила игры (браузер + сервер) */
(function(root){
'use strict';
const SRC=[null,
 {n:'Анонимный Telegram-канал «Правда без цензуры»',t:'анонимный канал',e:2,a:8},
 {n:'Telegram-канал «Новоград онлайн»',t:'новостной канал',e:4,a:5},
 {n:'Газета «Новоградский вестник»',t:'городское СМИ',e:6,a:4},
 {n:'Федеральное информационное агентство',t:'СМИ',e:7,a:3},
 {n:'Пресс-служба мэрии Новограда',t:'официальный орган',e:6,a:6},
 {n:'Санитарная служба Новограда',t:'официальный орган',e:8,a:2},
 {n:'Блог «Мама знает лучше»',t:'личный блог',e:1,a:6},
 {n:'Блогер-миллионник',t:'блог',e:2,a:7},
 {n:'Рецензируемый научный журнал',t:'научная статья',e:9,a:1},
 {n:'Препринт без рецензирования',t:'научная статья',e:6,a:2},
 {n:'Исследование, оплаченное производителем',t:'научная статья',e:7,a:8},
 {n:'Мета-анализ независимых исследований',t:'научная статья',e:10,a:1},
 {n:'Форум «Здоровье без врачей»',t:'форум',e:1,a:5},
 {n:'Статья онлайн-энциклопедии со ссылками',t:'справочник',e:5,a:2},
 {n:'Сайт-фактчекер «Проверено»',t:'фактчекинг',e:8,a:2},
 {n:'Пресс-релиз компании',t:'корпоративный источник',e:5,a:9},
 {n:'Рекламный сайт товара',t:'реклама',e:2,a:10},
 {n:'Независимый эксперт с публикациями по теме',t:'эксперт',e:8,a:2},
 {n:'Знаменитость вне своей области',t:'эксперт вне области',e:1,a:4},
 {n:'Политик-оппонент',t:'политик',e:3,a:9},
 {n:'Очевидец на месте событий',t:'свидетель',e:3,a:3},
 {n:'Аноним в комментариях',t:'комментарий',e:0,a:5},
 {n:'Сайт-двойник известной газеты',t:'поддельный сайт',e:0,a:10},
 {n:'Университетская лаборатория',t:'научная организация',e:9,a:2},
 {n:'Отраслевая ассоциация производителей',t:'ассоциация',e:6,a:8},
 {n:'Городской паблик «Подслушано Новоград»',t:'паблик',e:1,a:4},
 {n:'Официальная статистика',t:'официальный орган',e:8,a:3},
 {n:'Доклад международной организации',t:'международная организация',e:8,a:3},
 {n:'Канал-агрегатор без ссылок на источники',t:'анонимный канал',e:1,a:6},
 {n:'Журналист-расследователь',t:'СМИ',e:7,a:3}
];
const shiftOf=s=>Math.max(0,Math.floor((SRC[s].e-SRC[s].a)/3));

const VERD={true:'Правда',fake:'Фейк',opinion:'Мнение',insufficient:'Недостаточно данных'};
const DET=[['none','Ошибки нет'],['post_hoc','Post hoc: «после — значит вследствие»'],['correlation','Подмена корреляции причинностью'],['authority','Апелляция к авторитету'],['bandwagon','Апелляция к большинству'],['false_dilemma','Ложная дилемма'],['emotion','Апелляция к эмоциям'],['hasty','Поспешное обобщение'],['strawman','Соломенное чучело'],['anchor','Ловушка: эффект якоря'],['availability','Ловушка: ошибка доступности'],['survivor','Ловушка: ошибка выжившего']];
const DETL=Object.fromEntries(DET);
const TRAPCARD={anchor:'Эффект якоря',availability:'Ошибка доступности',survivor:'Ошибка выжившего'};
const SLOTS=[['claim','Тезис'],['data','Данные'],['warrant','Обоснование'],['backing','Подкрепление'],['qualifier','Ограничитель'],['rebuttal','Опровержение']];
const SLOTL=Object.fromEntries(SLOTS);

const CASES=[
 {id:1,name:'«Отравленная вода»',org:0,goal:0,clues:['Посты о «ядовитой воде» появились за час до запуска рекламы фильтров','Аккаунты-распространители созданы в один день','«Протокол лаборатории» не значится в реестре','Фото «ржавой воды» снято в другом городе в 2019 году','Сайт-«разоблачитель» зарегистрирован на рекламное агентство продавца фильтров']},
 {id:2,name:'«Мэр в казино»',org:1,goal:1,clues:['Видео смонтировано из двух разных записей','«Свидетель» — актёр массовки','Публикация вышла за три дня до выборов','Первоисточник — анонимный канал без истории публикаций','Реклама постов оплачена со счёта, связанного со штабом соперника']},
 {id:3,name:'«Банк на грани краха»',org:2,goal:2,clues:['В «утёкшем» документе ошибки в реквизитах банка','Скриншот «внутреннего чата» сфабрикован','За день до вброса резко выросли ставки на падение акций','Регулятор официально опроверг информацию','Одни и те же боты распространяли новость в трёх соцсетях']},
 {id:4,name:'«Чудо-таблетка»',org:3,goal:3,clues:['«Профессор» из рекламы не значится ни в одном вузе','«Исследование» опубликовано в журнале без рецензирования','Отзывы написаны с одинаковыми ошибками','Фото «до и после» взяты из фотобанка','Компания уже получала предписание за недостоверную рекламу']},
 {id:5,name:'«Закрытие университета»',org:4,goal:4,clues:['«Приказ ректора» оформлен на устаревшем бланке','Цитата министра вырвана из выступления о другом вузе','Вброс совпал с началом приёмной кампании','Ссылки ведут на сайт колледжа «Перспектива» с «особыми условиями перевода»','Университет и министерство опровергли новость']}
];
const ORGS=['Продавец фильтров «ЧистоПро»','Политтехнолог соперника на выборах','Группа биржевых спекулянтов','Производитель биодобавки «Ясный ум»','Частный колледж «Перспектива»','Санитарная служба Новограда','Редакция «Новоградского вестника»'];
const GOALS=['Вызвать панику и поднять продажи','Дискредитировать мэра перед выборами','Обрушить акции банка и скупить их дёшево','Продавать товар без доказанной эффективности','Переманить абитуриентов','Привлечь внимание к реальной проблеме'];

const CARDS=[
 {id:'c1',caseId:1,text:'Вода в Новограде отравлена — срочно покупайте фильтры!',pub:1,verdict:'fake',rel:[[6,'against'],[26,'for'],[15,'against']],extra:[[17,'for']],orig:'Пост впервые появился за час до запуска рекламы фильтров «ЧистоПро». «Протокол лаборатории» из поста не найден в реестре лабораторий.',err:'emotion',dis:'dis',expl:'Санитарная служба и фактчекеры опровергают сообщение, а пост давит на страх и сразу предлагает купить товар.'},
 {id:'c2',caseId:2,text:'Мэр Новограда проиграл в казино деньги на ремонт дорог. Есть видео!',pub:29,verdict:'fake',rel:[[30,'against'],[20,'for'],[15,'against']],extra:[[21,'for']],orig:'Полное видео: мэр на благотворительном вечере в 2021 году. Кадры с рулеткой вмонтированы из другой записи.',dis:'dis',expl:'Журналист и агентство нашли исходную запись: видео смонтировано. Его распространяют политические оппоненты.'},
 {id:'c3',caseId:3,text:'Новоградский банк ввёл лимит на снятие наличных — документ утёк в сеть.',pub:22,verdict:'fake',rel:[[4,'against'],[15,'against'],[26,'for']],extra:[[8,'for']],orig:'В «приказе» указан неверный ИНН банка и стоит подпись директора, уволенного год назад.',dis:'dis',expl:'Документ поддельный, надёжные источники опровергают «утечку».'},
 {id:'c4',caseId:4,text:'Биодобавка «Ясный ум» повышает IQ на 30 пунктов — её советует известный актёр.',pub:17,verdict:'fake',rel:[[19,'for'],[12,'against'],[11,'for']],extra:[[18,'against']],orig:'«Исследование» на сайте проведено на 12 добровольцах самим производителем и опубликовано в журнале без рецензирования.',err:'authority',dis:'dis',expl:'Актёр не эксперт в медицине, а мета-анализ не находит такого эффекта у биодобавок.'},
 {id:'c5',caseId:5,text:'Министр: «Этот вуз будет закрыт». Новоградский университет закрывается с 1 сентября.',pub:29,verdict:'fake',rel:[[26,'for'],[15,'against'],[4,'against']],extra:[[30,'against']],orig:'В полной стенограмме министр говорит о закрытии частного колледжа «Перспектива», а не университета.',dis:'dis',expl:'Цитата вырвана из контекста: речь шла о другом учебном заведении.'},
 {id:'c6',text:'После введения новой вакцины участились случаи аутизма, значит, вакцина вызывает аутизм.',pub:13,verdict:'fake',rel:[[12,'against'],[7,'for'],[9,'against']],extra:[[8,'for']],orig:'Рост числа диагнозов совпал с расширением критериев диагностики. Мета-анализ не нашёл связи с вакцинацией.',err:'post_hoc',dis:'mis',expl:'Совпадение по времени — не доказательство причины. Распространители чаще всего искренне верят в эту связь.'},
 {id:'c7',text:'Смартфон со скидкой: было 100 000 ₽, стало 80 000 ₽. Выгоднее не найдёте!',pub:17,verdict:'fake',rel:[[30,'against'],[8,'for'],[15,'against']],extra:[[14,'against']],orig:'Средняя цена этой модели в магазинах Новограда — 50 000 ₽. «Старая» цена появилась на сайте за день до акции.',trap:'anchor',dis:'dis',expl:'Цифра 100 000 ₽ работает как якорь: выгода мнимая, обычная цена вдвое ниже.'},
 {id:'c8',text:'В Новограде за год открылось 12 новых школ.',pub:5,verdict:'true',rel:[[27,'for'],[15,'for'],[26,'against']],extra:[[3,'for']],orig:'Отчёт управления образования за год: 12 школ введены в эксплуатацию, приложен список с адресами.',expl:'Проверяемый факт, подтверждённый официальной статистикой и фактчекерами.'},
 {id:'c9',text:'В Новограде строят слишком мало школ.',pub:20,verdict:'opinion',rel:[[3,'for'],[5,'against'],[26,'for']],extra:[],orig:'Фраза из предвыборной речи. Оценка «слишком мало» не опирается ни на норматив, ни на сравнение с другими городами.',expl:'Это оценка, а не проверяемый факт. Её можно обсуждать по обоснованности, но нельзя назвать правдой или фейком.'},
 {id:'c10',text:'Учёные доказали, что кофе продлевает жизнь на 10 лет.',pub:8,verdict:'fake',rel:[[9,'against'],[29,'for'],[18,'against']],extra:[],orig:'Исходное исследование нашло лишь связь умеренного потребления кофе с немного меньшим риском смертности — без «10 лет» и без доказательства причины.',err:'correlation',dis:'mis',expl:'Заголовок превращает связь в причину и выдумывает цифру.'},
 {id:'c11',text:'Продажи мороженого растут вместе с числом утоплений — мороженое опасно!',pub:26,verdict:'fake',rel:[[14,'against'],[18,'against'],[13,'for']],extra:[],orig:'Оба показателя растут летом: общая причина — жара и купальный сезон.',err:'correlation',dis:'mis',expl:'Два явления меняются вместе из-за третьей причины.'},
 {id:'c12',text:'Каждый третий житель Новограда пострадал от мошенников — об этом пишут все паблики!',pub:26,verdict:'insufficient',rel:[[29,'for'],[27,'against'],[8,'for']],extra:[[30,'against']],orig:'Цифра «каждый третий» взята из опроса в комментариях паблика. Официальной статистики по городу за этот год ещё нет.',err:'bandwagon',trap:'availability',expl:'«Пишут все» — не доказательство, а надёжных данных пока нет.'},
 {id:'c13',text:'Санитарная служба сообщила о плановом отключении воды 12 мая.',pub:6,verdict:'true',rel:[[3,'for'],[15,'for'],[22,'against']],extra:[],orig:'Объявление опубликовано на официальном сайте санитарной службы, указаны адреса и время работ.',expl:'Официальный источник и независимое подтверждение.'},
 {id:'c14',text:'Новый мост через реку откроют в декабре.',pub:5,verdict:'insufficient',rel:[[4,'for'],[30,'against'],[3,'for']],extra:[[16,'for']],orig:'Подрядчик сообщил о задержке поставок металла. Официальная дата в документах пока не утверждена.',expl:'Источники противоречат друг другу: честный ответ — данных недостаточно.'},
 {id:'c15',text:'Либо вырубаем парк под парковку, либо город задохнётся в пробках.',pub:20,verdict:'opinion',rel:[[18,'against'],[26,'for'],[3,'against']],extra:[],orig:'Транспортное исследование рассматривает пять вариантов, включая платную парковку и новые автобусные маршруты.',err:'false_dilemma',expl:'Мнение, построенное на ложной дилемме: вариантов больше двух.'},
 {id:'c16',text:'Все успешные предприниматели бросили учёбу — значит, диплом не нужен.',pub:8,verdict:'fake',rel:[[27,'against'],[18,'against'],[29,'for']],extra:[],orig:'Истории успеха без учёта тысяч бросивших учёбу и прогоревших. По статистике у выпускников вузов выше средние доходы.',err:'hasty',trap:'survivor',dis:'mis',expl:'Вывод сделан только по «выжившим» примерам.'},
 {id:'c17',text:'Завод сбросил в реку химикаты: видео очевидца.',pub:26,verdict:'insufficient',rel:[[21,'for'],[29,'for'],[30,'against']],extra:[[5,'against']],orig:'Видео снято вечером, место узнаётся, но результаты проб воды ещё не готовы.',expl:'Есть видео, но нет данных анализов: выносить вердикт рано.'},
 {id:'c18',text:'Проезд в автобусах подорожает на 5 рублей с 1 января — постановление мэрии.',pub:3,verdict:'true',rel:[[4,'for'],[15,'for'],[26,'against']],extra:[[5,'for']],orig:'Постановление № 412 опубликовано на официальном портале, новая цена — 42 ₽.',expl:'Первоисточник — официальный документ.'},
 {id:'c19',text:'Проезд дорожает, потому что мэрия хочет нажиться на горожанах.',pub:20,verdict:'opinion',rel:[[19,'for'],[4,'against'],[26,'for']],extra:[],orig:'В постановлении указана причина: рост цен на топливо и ремонт автобусов.',expl:'Приписывание мотивов — это мнение, а не факт.'},
 {id:'c20',text:'Фото: улицы Новограда затоплены после вчерашнего ливня.',pub:29,verdict:'fake',rel:[[15,'against'],[26,'for'],[4,'against']],extra:[],orig:'Обратный поиск: фото сделано в 2019 году в другом городе во время паводка.',dis:'mis',expl:'Старое фото из другого места. Пересылают его в основном доверчивые люди.'},
 {id:'c21',text:'В Новограде на следующей неделе ожидается аномальная жара +45 °C.',pub:23,verdict:'fake',rel:[[4,'against'],[15,'against'],[29,'for']],extra:[],orig:'Сайт novograd-vestnik.info — двойник «Новоградского вестника» (novograd-vestnik.ru), зарегистрирован неделю назад.',dis:'dis',expl:'Поддельный сайт под известную газету.'},
 {id:'c22',text:'Наш шампунь укрепляет волосы, потому что содержит кератин.',pub:17,verdict:'insufficient',rel:[[9,'against'],[7,'for'],[19,'for']],extra:[],orig:'Состав шампуня: кератин на 9-м месте. Ссылок на исследования эффекта нет.',arg:{fr:[['Наш шампунь укрепляет волосы','claim'],['Содержит кератин','data'],['(неявно) Кератин из шампуня укрепляет волосы','warrant']],missing:['backing','qualifier','rebuttal']},expl:'Обоснование не доказано, подкрепления нет: аргумент недоказан.'},
 {id:'c23',text:'Препарат безопасен: у 20 добровольцев побочных эффектов не выявлено.',pub:16,verdict:'insufficient',rel:[[24,'against'],[11,'for'],[8,'for']],extra:[],orig:'Испытание длилось две недели на 20 здоровых взрослых. Полные клинические испытания ещё не проводились.',err:'hasty',arg:{fr:[['Препарат безопасен','claim'],['У 20 добровольцев побочных эффектов не выявлено','data'],['(неявно) Если у 20 человек нет побочных эффектов, их нет ни у кого','warrant']],missing:['backing','qualifier','rebuttal']},expl:'Выборка слишком мала для такого вывода.'},
 {id:'c24',text:'Солнечные панели окупятся за 7 лет — расчёт независимого энергоаудитора для нашего региона.',pub:3,verdict:'true',rel:[[18,'for'],[28,'for'],[16,'against']],extra:[],orig:'Аудитор опубликовал методику: расчёт сделан при текущих тарифах, при их снижении срок окупаемости вырастет.',arg:{fr:[['Солнечные панели окупятся за 7 лет','claim'],['Расчёт для условий нашего региона','data'],['Независимый расчёт для местных условий надёжен','warrant'],['Аудитор независим и раскрыл методику','backing'],['При текущих тарифах','qualifier'],['Если тарифы упадут, срок вырастет','rebuttal']],missing:[]},expl:'Пример сильного аргумента: есть все шесть элементов.'},
 {id:'c25',text:'Каждый, кто против новой реформы, — враг города.',pub:20,verdict:'opinion',rel:[[3,'against'],[26,'for'],[18,'against']],extra:[],orig:'Фраза из выступления на митинге, без аргументов по существу реформы.',err:'false_dilemma',expl:'Оценочное суждение с ложной дилеммой и переходом на личности.'}
];
const CARD=Object.fromEntries(CARDS.map(c=>[c.id,c]));

const SIFTDECK=[['pause','Пауза','S',4,'+1 жетон концентрации'],['domain','Проверить домен','I',4,'Перевернуть карточку источника'],['author','Проверить автора','I',3,'Перевернуть карточку источника'],['compare','Сравнить с другими СМИ','F',5,'+2 источника и +2 к лимиту'],['origin','Найти первоисточник','T',2,'Открыть исходный контекст'],['reverse','Обратный поиск изображения','T',2,'Открыть исходный контекст']];
const SIFTINFO=Object.fromEntries(SIFTDECK.map(d=>[d[0],{n:d[1],L:d[2],eff:d[4]}]));
const LCOL={S:'var(--orange)',I:'var(--pink)',F:'var(--violet)',T:'var(--blue)'};

const EVENTS={1:['Информационный шум','Срочный дедлайн: −1 жетон концентрации.'],2:['Атака ботофермы','Ошибка при «Быстром ответе» стоит на 1 репутацию больше.'],3:['Штатный режим','Раунд без особых условий.'],4:['Штатный режим','Раунд без особых условий.'],5:['Инсайдерская наводка','Первая проверка источника бесплатна.'],6:['Редакционный кофе-брейк','+1 жетон концентрации (если запас полон — замена карточки SIFT).']};
const ZONES=[[1,'Сбор информации','',' var(--yellow)'],[2,'Стоп','S','var(--orange)'],[3,'Проверка источника','I','var(--pink)'],[4,'Поиск лучших источников','F','var(--violet)'],[5,'Первоисточник','T','var(--blue)'],[6,'Анализ аргумента','','var(--green)'],[7,'Вердикт','','var(--red)']];
const TEAMDEF=[['Красные','#e2574c'],['Синие','#4f86c6'],['Зелёные','#4f9d63'],['Жёлтые','#e2b33c']];

/* ======================= ПРАВИЛА (общие для браузера и сервера) ======================= */
const rnd=n=>Math.floor(Math.random()*n);
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}

function makeUnit(name,color){
  const deck=shuffle(SIFTDECK.flatMap(d=>Array(d[3]).fill(d[0])));
  return {name,color,rep:10,conc:5,pts:0,hand:deck.splice(0,3),deck,clues:0,dist:[],log:[],quickStreak:0,out:false,closure:null,turn:null};
}
function caseCard(caseId){return CARDS.find(c=>c.caseId===caseId).id}
function generalCards(n){return shuffle(CARDS.filter(c=>!c.caseId).map(c=>c.id)).slice(0,n)}
function roundCards(caseId){return [caseCard(caseId)].concat(generalCards(4))}

function beginTurn(u,round,roll,cardId){
  if(round>1)u.conc=Math.min(5,u.conc+2);
  while(u.hand.length<3&&u.deck.length)u.hand.push(u.deck.shift());
  let evNote='';
  if(roll===1)u.conc=Math.max(0,u.conc-1);
  if(roll===6){if(u.conc<5)u.conc++;else if(u.deck.length&&u.hand.length){u.deck.push(u.hand.shift());u.hand.push(u.deck.shift());evNote='Карточка SIFT заменена.'}}
  const c=CARD[cardId];
  u.turn={cardId,zone:1,roll,evNote,hyp:null,mode:null,pubFlipped:false,opened:[],limit:3,extras:false,orig:false,
    freeI:roll===5,botfarm:roll===2,placed:{},missing:[],tCheck:null,tShown:false,detect:null,verdict:null,dis:null,shiftLog:[],scale:50,result:null,
    order:c.arg?shuffle(c.arg.fr.map((f,i)=>i)):[]};
  return u.turn;
}
function allSrc(t){const c=CARD[t.cardId];return c.rel.concat(t.extras?c.extra:[])}
function scaleShift(t,s,stance,label){
  const n=shiftOf(s),d=(stance==='for'?1:-1)*n*10,before=t.scale;
  t.scale=Math.max(0,Math.min(100,before+d));
  t.shiftLog.push(label+': '+SRC[s].n+' — Э'+SRC[s].e+' / А'+SRC[s].a+' → N = '+n+', '+(stance==='for'?'подтверждает':'опровергает')+': '+before+'% → '+t.scale+'%');
}
function hasCard(u,L){return u.hand.some(k=>SIFTINFO[k].L===L)}
function useCard(u,L){const i=u.hand.findIndex(k=>SIFTINFO[k].L===L);if(i<0)return null;return u.hand.splice(i,1)[0]}
/* «Адвокат дьявола»: открыт ли хотя бы один источник, противоречащий вердикту */
function opposedOpened(t,v){const all=allSrc(t);const want=v==='true'?'against':'for';return t.opened.some(i=>all[i][1]===want)}
function inGrey(t){return t.scale>20&&t.scale<80}
/* разбор по Тулмину: результат по каждой ячейке */
function toulminRes(t){const a=CARD[t.cardId].arg,res={};
  for(const [k] of SLOTS){const exp=a.missing.includes(k)?'miss':String(a.fr.findIndex(f=>f[1]===k));
    const got=t.missing.includes(k)?'miss':Object.keys(t.placed).find(f=>t.placed[f]===k);res[k]=exp===String(got)}
  return res}
function toulminOk(t){return !!CARD[t.cardId].arg&&!t.tShown&&Object.values(toulminRes(t)).every(Boolean)}
function warnings(t){const w=[];if(t.mode!=='analysis')return w;const cat=t.verdict==='true'||t.verdict==='fake';
  if(cat&&inGrey(t))w.push('Маркер на '+t.scale+'% — в «серой зоне». Категоричный вердикт будет засчитан как поспешный (−1 репутация).');
  if(cat&&!opposedOpened(t,t.verdict))w.push('Адвокат дьявола: вы не открыли ни одного источника, который противоречит вашему вердикту. Будет выдана карточка «Предвзятость подтверждения» (−1 очко).');
  return w}

/* act: изменить ход по действию игрока. Возвращает true, если что-то изменилось. */
function act(u,type,v,ctx){
  const t=u.turn;if(!t||t.result||u.out)return false;const c=CARD[t.cardId];
  switch(type){
    case 'hyp':if(t.zone!==1)return false;t.hyp=v==='true'?'true':'fake';t.zone=2;return true;
    case 'pause':if(t.zone!==2||u.conc>=5)return false;if(!useCard(u,'S'))return false;u.conc++;return true;
    case 'quick':if(t.zone!==2)return false;t.mode='quick';t.zone=7;u.quickStreak++;return true;
    case 'analysis':if(t.zone!==2||u.conc<1)return false;u.conc--;t.mode='analysis';t.zone=3;u.quickStreak=0;return true;
    case 'flipPub':if(t.zone!==3||t.pubFlipped)return false;
      if(v==='free'){if(!t.freeI)return false;t.freeI=false}else if(v==='card'){if(!useCard(u,'I'))return false}else{if(u.conc<1)return false;u.conc--}
      t.pubFlipped=true;scaleShift(t,c.pub,'for','Источник публикации');return true;
    case 'next':if(t.zone<3||t.zone>6)return false;t.zone++;return true;
    case 'openSrc':{if(t.zone!==4)return false;const i=+v,all=allSrc(t);if(!(i>=0&&i<all.length)||t.opened.includes(i)||t.opened.length>=t.limit)return false;
      t.opened.push(i);scaleShift(t,all[i][0],all[i][1],'Источник');return true}
    case 'compare':if(t.zone!==4||t.extras)return false;if(!useCard(u,'F'))return false;t.extras=true;t.limit+=2;return true;
    case 'origin':if(t.zone!==5||t.orig)return false;if(v==='card'){if(!useCard(u,'T'))return false}else{if(u.conc<1)return false;u.conc--}t.orig=true;return true;
    case 'place':{if(t.zone!==6||!c.arg)return false;const ch=+v.chip,k=v.slot;if(!SLOTL[k]||!(ch>=0&&ch<c.arg.fr.length))return false;
      for(const f in t.placed)if(t.placed[f]===k)delete t.placed[f];t.placed[ch]=k;t.missing=t.missing.filter(m=>m!==k);t.tCheck=null;return true}
    case 'clearSlot':{if(t.zone!==6)return false;for(const f in t.placed)if(t.placed[f]===v)delete t.placed[f];t.tCheck=null;return true}
    case 'miss':{if(t.zone!==6||!SLOTL[v])return false;if(t.missing.includes(v))t.missing=t.missing.filter(m=>m!==v);else{t.missing.push(v);for(const f in t.placed)if(t.placed[f]===v)delete t.placed[f]}t.tCheck=null;return true}
    case 'tcheck':if(t.zone!==6||!c.arg)return false;t.tCheck=toulminRes(t);return true;
    case 'tshow':{if(t.zone!==6||!c.arg)return false;t.tShown=true;t.placed={};c.arg.fr.forEach((f,i)=>{t.placed[i]=f[1]});t.missing=c.arg.missing.slice();return act(u,'tcheck')}
    case 'detect':if(t.zone!==6||!DETL[v])return false;t.detect=v;return true;
    case 'verdict':if(t.zone!==7||!VERD[v])return false;t.verdict=v;if(v!=='fake')t.dis=null;return true;
    case 'dis':if(t.zone!==7||t.verdict!=='fake'||(v!=='dis'&&v!=='mis'))return false;t.dis=v;return true;
    case 'lock':if(t.zone!==7||!t.verdict||(t.verdict==='fake'&&!t.dis))return false;finish(u,ctx);return true;
  }
  return false;
}

function finish(u,ctx){
  const t=u.turn,c=CARD[t.cardId],L=[],dists=[];let dp=0,dr=0;
  const v=t.verdict,correct=v===c.verdict;let hasty=false,clue=false;
  if(t.mode==='quick'){
    if(correct){dp+=1;L.push(['+1','Верный вердикт после быстрого ответа','plus'])}
    else{const pen=t.botfarm?3:2;dr-=pen;L.push(['−'+pen+' реп.','Неверный быстрый ответ'+(t.botfarm?' (атака ботофермы)':''),'minus'])}
    if(u.quickStreak>=3&&u.conc>0){dists.push('Предвзятость текущего момента');u.quickStreak=0}
  }else{
    if((v==='true'||v==='fake')&&inGrey(t)){hasty=true;dr-=1;L.push(['−1 реп.','Поспешный вердикт: маркер на '+t.scale+'%, а категоричный ответ разрешён только при ≥80% или ≤20%','minus'])}
    else if(correct){dp+=2;L.push(['+2','Верный вердикт после анализа','plus'])}
    else L.push(['0','Неверный вердикт после анализа','minus']);
    const target=[c.err,c.trap].filter(Boolean);
    if(target.length&&target.includes(t.detect)){dp+=1;L.push(['+1','Верно определено: '+DETL[t.detect],'plus'])}
    if(c.arg){if(toulminOk(t)){dp+=1;L.push(['+1','Аргумент верно разложен по модели Тулмина','plus'])}
      else L.push(['0',t.tShown?'Разбор по Тулмину подсмотрен — бонуса нет':'Разбор по Тулмину неполный или с ошибками','minus'])}
    if((v==='true'||v==='fake')&&!opposedOpened(t,v))dists.push('Предвзятость подтверждения');
  }
  if(c.trap&&!correct)dists.push(TRAPCARD[c.trap]);
  for(const d of dists){dp-=1;L.push(['−1','Карточка искажения: '+d,'minus'])}
  if(correct&&!hasty&&u.clues<5){u.clues++;clue=true}
  u.pts=Math.max(0,u.pts+dp);u.rep=Math.max(0,u.rep+dr);u.dist.push(...dists);
  if(u.rep<=0)u.out=true;
  const all=allSrc(t),disOk=c.dis&&v==='fake'?t.dis===c.dis:null;
  const tul=c.arg&&t.mode==='analysis'?toulminOk(t):null;
  u.log.push({card:c.id,mode:t.mode,hyp:t.hyp,verdict:v,correct,hasty,opened:t.opened.map(i=>all[i][0]),detect:t.detect,tul,disOk,dp,dr});
  t.result={L,correct,hasty,clue,clueText:clue?CASES[ctx.caseId-1].clues[u.clues-1]:null,dists,disOk,dp,dr};
  t.zone=7;
}
function skipTurn(u){const t=u.turn;if(!t||t.result)return;
  t.result={L:[['0','Время вышло: вердикт не вынесен','minus']],correct:false,hasty:false,clue:false,clueText:null,dists:[],disOk:null,skipped:true,dp:0,dr:0};
  u.log.push({card:t.cardId,mode:t.mode||'none',hyp:t.hyp,verdict:null,correct:false,hasty:false,opened:[],detect:null,skipped:true,dp:0,dr:0})}

function unitStats(u){const lg=u.log.filter(l=>!l.skipped);const q=lg.filter(l=>l.mode==='quick'),an=lg.filter(l=>l.mode==='analysis');
  const tf=lg.filter(l=>['true','fake'].includes(CARD[l.card].verdict)&&l.hyp);const cal=tf.filter(l=>l.hyp===CARD[l.card].verdict).length;
  const types={};lg.forEach(l=>l.opened.forEach(s=>{types[SRC[s].t]=(types[SRC[s].t]||0)+1}));
  const top=Object.entries(types).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
  const opened=lg.flatMap(l=>l.opened);const avgN=opened.length?opened.reduce((s,x)=>s+shiftOf(x),0)/opened.length:0;
  const tu=lg.filter(l=>l.tul!=null),di=lg.filter(l=>l.disOk!=null);
  return {q:q.length,qc:q.filter(l=>l.correct).length,an:an.length,ac:an.filter(l=>l.correct&&!l.hasty).length,hasty:lg.filter(l=>l.hasty).length,
    cal:tf.length?Math.round(cal/tf.length*100):null,top,avgN,tul:tu.length,tulOk:tu.filter(l=>l.tul).length,dis:di.length,disOk:di.filter(l=>l.disOk).length}}
function solved(u,ctx){const cs=CASES[ctx.caseId-1];return !!(u.closure&&u.closure.org===cs.org&&u.closure.goal===cs.goal)}
function won(u,ctx){return !u.out&&solved(u,ctx)&&u.pts>=ctx.threshold}

const HL={SRC,shiftOf,VERD,DET,DETL,TRAPCARD,SLOTS,SLOTL,CASES,ORGS,GOALS,CARDS,CARD,SIFTDECK,SIFTINFO,LCOL,EVENTS,ZONES,TEAMDEF,
  rnd,shuffle,makeUnit,caseCard,generalCards,roundCards,beginTurn,allSrc,hasCard,opposedOpened,inGrey,toulminRes,toulminOk,warnings,act,finish,skipTurn,unitStats,solved,won};
if(typeof module!=='undefined'&&module.exports)module.exports=HL;else root.HL=HL;
})(typeof window!=='undefined'?window:globalThis);

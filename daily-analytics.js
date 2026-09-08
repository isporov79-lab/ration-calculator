(function(){
  const correctionKey='legacyDayDateFix_20260908_v1';
  function correctLegacyDayDate(){
    if(get(correctionKey,false))return false;
    if(typeof localDayKey!=='function'||localDayKey()!=='2026-09-08')return false;
    let days=get('daysV1',null),from='2026-09-08',to='2026-09-07';
    if(!days||typeof days!=='object'||Array.isArray(days)||!Array.isArray(days[from])||days[from].length===0){set(correctionKey,true);return false}
    let target=Array.isArray(days[to])?days[to]:[],seen=new Set(target.map(x=>x&&x.id).filter(Boolean));
    days[to]=target.concat(days[from].filter(x=>!x?.id||!seen.has(x.id)));
    days[from]=[];
    set('daysV1',days);set('day',[]);set(correctionKey,true);
    if(typeof st==='object'&&st){st.days=days;if(st.activeDate===from)st.day=days[from]}
    return true;
  }
  const corrected=correctLegacyDayDate();
  let historyMode=false;
  const nativeEnsureCurrentDay=typeof ensureCurrentDay==='function'?ensureCurrentDay:null;
  if(nativeEnsureCurrentDay)ensureCurrentDay=function(){return historyMode?false:nativeEnsureCurrentDay()};
  const dateLabel=date=>new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});
  const signed=(actual,plan,unit)=>{let diff=actual-plan;if(Math.abs(diff)<0.05)return {text:'0 '+unit,color:'inherit'};return {text:(diff>0?'+':'−')+fmt(Math.abs(diff),0)+' '+unit,color:diff>0?'#dc2626':'#1677ff'}};
  const pct=(actual,plan)=>plan>0?Math.round(actual/plan*100):0;
  function ringCard(key,label,ringColor){
    return '<div class="macroCard"><div class="macroLabel">'+label+'</div><div class="ring" id="aRing'+key+'" style="--ring:'+ringColor+'"><strong id="aPct'+key+'">0%</strong></div><div class="macroFact"><span id="aPlan'+key+'">0</span> / <span id="aFact'+key+'">0</span></div><div class="macroRemain" id="aDiff'+key+'">0</div></div>';
  }
  function installAnalyticsLayout(){
    let card=$('#dayCalorieStatus')?.closest('.settingsCard')||document.querySelector('#today .settingsCard');if(!card)return;
    let old=card.previousElementSibling;if(old&&old.classList.contains('activityBalance'))old.remove();
    card.innerHTML='<div class="sectionHead"><div><h2>Аналитика за день</h2><p>План / Факт / Разница</p></div></div><div class="summary" id="dailyAnalyticsRings">'+ringCard('Kcal','Калории','var(--blue)')+ringCard('P','Белки','var(--green)')+ringCard('F','Жиры','var(--orange)')+ringCard('C','Углеводы','var(--red)')+ringCard('Fiber','Клетчатка','var(--green)')+'</div>';
  }
  function put(id,value){let el=$(id);if(el)el.textContent=value}
  function putDiff(id,obj){let el=$(id);if(!el)return;el.textContent=obj.text;el.style.color=obj.color;el.style.fontWeight='800'}
  function putRing(key,actual,plan,unit){
    let percent=pct(actual,plan),ring=$('#aRing'+key);if(ring)ring.style.setProperty('--p',Math.max(0,Math.min(percent,100)));
    put('#aPct'+key,percent+'%');
    put('#aPlan'+key,fmt(plan,0));
    put('#aFact'+key,fmt(actual,0)+(unit?' '+unit:''));
    putDiff('#aDiff'+key,signed(actual,plan,unit||''));
  }
  function renderDailyAnalytics(){
    if(!$('#aRingKcal'))return;
    let t=total(),s=st.settings;
    putRing('Kcal',t.kcal,n(s.kcal),'ккал');
    putRing('P',t.p,n(s.p),'г');
    putRing('F',t.f,n(s.f),'г');
    putRing('C',t.c,n(s.c),'г');
    putRing('Fiber',t.fiber,n(s.fiber),'г');
    let heading=document.querySelector('#today .heroHead h2');if(heading)heading.textContent=st.activeDate===localDayKey()?'Сегодня':dateLabel(st.activeDate);
    if($('#todayDate'))$('#todayDate').textContent=dateLabel(st.activeDate);
  }
  function selectNutritionDate(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    let today=localDayKey();if(date>today)date=today;
    st.days[st.activeDate]=st.day;st.activeDate=date;st.day=Array.isArray(st.days[date])?st.days[date]:(st.days[date]=[]);historyMode=date!==today;
    set('daysV1',st.days);set('day',st.day);if(typeof syncTodayDate==='function')syncTodayDate();renderToday();renderDailyAnalytics();
  }
  function shiftDate(delta){let d=new Date(st.activeDate+'T12:00:00');d.setDate(d.getDate()+delta);selectNutritionDate(localDayKey(d))}
  function installDateNavigator(){
    let current=$('#todayDate');if(!current||$('#nutritionDatePrev'))return;
    let prev=document.createElement('button'),next=document.createElement('button'),picker=document.createElement('input');
    prev.id='nutritionDatePrev';prev.type='button';prev.className='iconBtn';prev.textContent='‹';prev.title='Предыдущий день';
    next.id='nutritionDateNext';next.type='button';next.className='iconBtn';next.textContent='›';next.title='Следующий день';
    picker.type='date';picker.id='nutritionDatePicker';picker.max=localDayKey();picker.value=st.activeDate;picker.style.position='fixed';picker.style.left='-9999px';picker.style.opacity='0';
    current.parentNode.insertBefore(prev,current);current.insertAdjacentElement('afterend',next);document.body.appendChild(picker);
    prev.onclick=()=>shiftDate(-1);next.onclick=()=>shiftDate(1);current.onclick=()=>{picker.value=st.activeDate;picker.max=localDayKey();if(typeof picker.showPicker==='function')picker.showPicker();else picker.click()};picker.onchange=()=>{if(picker.value)selectNutritionDate(picker.value)};
  }
  if(typeof renderToday==='function'){const baseRenderTodayHistory=renderToday;renderToday=function(){baseRenderTodayHistory();renderDailyAnalytics()}}
  window.renderDailyAnalytics=renderDailyAnalytics;window.selectNutritionDate=selectNutritionDate;
  installAnalyticsLayout();installDateNavigator();if(corrected&&typeof renderToday==='function')renderToday();renderDailyAnalytics();
})();

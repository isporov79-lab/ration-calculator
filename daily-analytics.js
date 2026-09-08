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
  function installAnalyticsLayout(){
    let card=$('#dayCalorieStatus')?.closest('.settingsCard');if(!card)return;
    let old=card.previousElementSibling;if(old&&old.classList.contains('activityBalance'))old.remove();
    card.innerHTML='<div class="sectionHead"><div><h2>Аналитика за день</h2><p>План · Факт · Дефицит/профицит</p></div></div><div style="display:grid;gap:10px"><div class="activityBalance"><div><span>Калории · План</span><strong id="aKcalPlan">0 ккал</strong></div><div><span>Калории · Факт</span><strong id="aKcalFact">0 ккал</strong></div><div><span>Дефицит / профицит</span><strong id="aKcalDiff">0 ккал</strong></div></div><div class="activityBalance"><div><span>Белки · План</span><strong id="aPPlan">0 г</strong></div><div><span>Факт</span><strong id="aPFact">0 г</strong></div><div><span>Разница</span><strong id="aPDiff">0 г</strong></div></div><div class="activityBalance"><div><span>Жиры · План</span><strong id="aFPlan">0 г</strong></div><div><span>Факт</span><strong id="aFFact">0 г</strong></div><div><span>Разница</span><strong id="aFDiff">0 г</strong></div></div><div class="activityBalance"><div><span>Углеводы · План</span><strong id="aCPlan">0 г</strong></div><div><span>Факт</span><strong id="aCFact">0 г</strong></div><div><span>Разница</span><strong id="aCDiff">0 г</strong></div></div></div>';
  }
  function put(id,value){let el=$(id);if(el)el.textContent=value}
  function putDiff(id,obj){let el=$(id);if(!el)return;el.textContent=obj.text;el.style.color=obj.color}
  function renderDailyAnalytics(){
    if(!$('#aKcalPlan'))return;
    let t=total(),kp=n(st.settings.kcal),pp=n(st.settings.p),fp=n(st.settings.f),cp=n(st.settings.c);
    put('#aKcalPlan',Math.round(kp)+' ккал');put('#aKcalFact',Math.round(t.kcal)+' ккал');putDiff('#aKcalDiff',signed(t.kcal,kp,'ккал'));
    put('#aPPlan',fmt(pp,0)+' г');put('#aPFact',fmt(t.p,0)+' г');putDiff('#aPDiff',signed(t.p,pp,'г'));
    put('#aFPlan',fmt(fp,0)+' г');put('#aFFact',fmt(t.f,0)+' г');putDiff('#aFDiff',signed(t.f,fp,'г'));
    put('#aCPlan',fmt(cp,0)+' г');put('#aCFact',fmt(t.c,0)+' г');putDiff('#aCDiff',signed(t.c,cp,'г'));
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

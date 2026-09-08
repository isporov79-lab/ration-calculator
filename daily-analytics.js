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
  if(nativeEnsureCurrentDay){
    ensureCurrentDay=function(){return historyMode?false:nativeEnsureCurrentDay()};
  }
  const macroStatus=(actual,target)=>{let diff=actual-target;if(Math.abs(diff)<0.05)return 'Норма';return diff<0?'Недобор '+fmt(-diff,0)+' г':'Перебор '+fmt(diff,0)+' г'};
  const dateLabel=date=>new Date(date+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});
  function selectedBurn(){return typeof trainingCalories==='function'?trainingCalories(st.activeDate):0}
  function renderDailyAnalytics(){
    if(!document.querySelector('#dayCalorieStatus'))return;
    let t=total(),burn=selectedBurn(),spent=n(st.settings.kcal)+n(burn),balance=t.kcal-spent,limit=spent,net=t.kcal-burn;
    $('#dayFood').textContent=Math.round(t.kcal)+' ккал';
    $('#daySpent').textContent=Math.round(spent)+' ккал';
    $('#dayBalance').textContent=(balance>0?'+':'')+Math.round(balance)+' ккал';
    $('#dayCalorieStatus').textContent=Math.abs(balance)<1?'Баланс':balance<0?'Дефицит '+Math.round(-balance)+' ккал':'Профицит '+Math.round(balance)+' ккал';
    $('#dayProteinStatus').textContent=macroStatus(t.p,n(st.settings.p));
    $('#dayFatStatus').textContent=macroStatus(t.f,n(st.settings.f));
    $('#dayCarbStatus').textContent=macroStatus(t.c,n(st.settings.c));
    if($('#activityFood'))$('#activityFood').textContent=Math.round(t.kcal)+' ккал';
    if($('#activityBurn'))$('#activityBurn').textContent=Math.round(burn)+' ккал';
    if($('#activityNet'))$('#activityNet').textContent=Math.round(net)+' ккал';
    if($('#activityLimit'))$('#activityLimit').textContent=Math.round(limit)+' ккал';
    setMetric('Kcal',t.kcal,limit,' ккал');
    let heading=document.querySelector('#today .heroHead h2');if(heading)heading.textContent=st.activeDate===localDayKey()?'Сегодня':dateLabel(st.activeDate);
    if($('#todayDate'))$('#todayDate').textContent=dateLabel(st.activeDate);
  }
  function selectNutritionDate(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    let today=localDayKey();if(date>today)date=today;
    st.days[st.activeDate]=st.day;
    st.activeDate=date;
    st.day=Array.isArray(st.days[date])?st.days[date]:(st.days[date]=[]);
    historyMode=date!==today;
    set('daysV1',st.days);set('day',st.day);
    if(typeof syncTodayDate==='function')syncTodayDate();
    renderToday();
    renderDailyAnalytics();
  }
  function shiftDate(delta){let d=new Date(st.activeDate+'T12:00:00');d.setDate(d.getDate()+delta);selectNutritionDate(localDayKey(d))}
  function installDateNavigator(){
    let current=$('#todayDate');if(!current||$('#nutritionDatePrev'))return;
    let prev=document.createElement('button'),next=document.createElement('button'),picker=document.createElement('input');
    prev.id='nutritionDatePrev';prev.type='button';prev.className='iconBtn';prev.textContent='‹';prev.title='Предыдущий день';
    next.id='nutritionDateNext';next.type='button';next.className='iconBtn';next.textContent='›';next.title='Следующий день';
    picker.type='date';picker.id='nutritionDatePicker';picker.max=localDayKey();picker.value=st.activeDate;picker.style.position='fixed';picker.style.left='-9999px';picker.style.opacity='0';
    current.parentNode.insertBefore(prev,current);current.insertAdjacentElement('afterend',next);document.body.appendChild(picker);
    prev.onclick=()=>shiftDate(-1);next.onclick=()=>shiftDate(1);
    current.onclick=()=>{picker.value=st.activeDate;picker.max=localDayKey();if(typeof picker.showPicker==='function')picker.showPicker();else picker.click()};
    picker.onchange=()=>{if(picker.value)selectNutritionDate(picker.value)};
  }
  if(typeof renderEnergyBalance==='function'){
    const baseRenderEnergyBalance=renderEnergyBalance;
    renderEnergyBalance=function(){baseRenderEnergyBalance();renderDailyAnalytics()};
  }
  if(typeof renderToday==='function'){
    const baseRenderTodayHistory=renderToday;
    renderToday=function(){baseRenderTodayHistory();renderDailyAnalytics()};
  }
  window.renderDailyAnalytics=renderDailyAnalytics;
  window.selectNutritionDate=selectNutritionDate;
  installDateNavigator();
  if(corrected&&typeof renderToday==='function')renderToday();
  renderDailyAnalytics();
})();

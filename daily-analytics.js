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
  const macroStatus=(actual,target)=>{let diff=actual-target;if(Math.abs(diff)<0.05)return 'Норма';return diff<0?'Недобор '+fmt(-diff,0)+' г':'Перебор '+fmt(diff,0)+' г'};
  function renderDailyAnalytics(){
    if(!document.querySelector('#dayCalorieStatus'))return;
    let t=total(),burn=typeof trainingCalories==='function'?trainingCalories(typeof trainingDateKey==='function'?trainingDateKey():localDayKey()):0,spent=n(st.settings.kcal)+n(burn),balance=t.kcal-spent;
    $('#dayFood').textContent=Math.round(t.kcal)+' ккал';
    $('#daySpent').textContent=Math.round(spent)+' ккал';
    $('#dayBalance').textContent=(balance>0?'+':'')+Math.round(balance)+' ккал';
    $('#dayCalorieStatus').textContent=Math.abs(balance)<1?'Баланс':balance<0?'Дефицит '+Math.round(-balance)+' ккал':'Профицит '+Math.round(balance)+' ккал';
    $('#dayProteinStatus').textContent=macroStatus(t.p,n(st.settings.p));
    $('#dayFatStatus').textContent=macroStatus(t.f,n(st.settings.f));
    $('#dayCarbStatus').textContent=macroStatus(t.c,n(st.settings.c));
  }
  if(typeof renderEnergyBalance==='function'){
    const baseRenderEnergyBalance=renderEnergyBalance;
    renderEnergyBalance=function(){baseRenderEnergyBalance();renderDailyAnalytics()};
  }
  window.renderDailyAnalytics=renderDailyAnalytics;
  if(corrected&&typeof renderToday==='function')renderToday();
  renderDailyAnalytics();
})();

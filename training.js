const TRAINING_EXERCISES=[
  {id:'pullups',name:'Подтягивания',kind:'strength',met:5.0},
  {id:'dips',name:'Отжимания на брусьях',kind:'strength',met:5.0},
  {id:'reverse-dips',name:'Обратные отжимания на брусьях',kind:'strength',met:4.5},
  {id:'jump-rope',name:'Скакалка',kind:'strength',met:11.8},
  {id:'pushups',name:'Отжимания от пола',kind:'strength',met:4.5},
  {id:'hanging-leg-raise',name:'Пресс — подъём ног вися на турнике',kind:'strength',met:4.0},
  {id:'dip-leg-raise',name:'Пресс — подъём ног на брусьях',kind:'strength',met:4.0},
  {id:'walking',name:'Ходьба',kind:'cardio',met:3.8},
  {id:'running',name:'Бег',kind:'cardio',met:8.3},
  {id:'cycling',name:'Велосипед',kind:'cardio',met:6.8}
];
const trainingGetExercise=id=>TRAINING_EXERCISES.find(x=>x.id===id);
const trainingDateKey=d=>{let x=d?new Date(d+'T12:00:00'):new Date(),y=x.getFullYear(),m=String(x.getMonth()+1).padStart(2,'0'),day=String(x.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
let trainingSelectedDate=trainingDateKey();
let trainingData=get('workoutsV1',{days:{}});if(!trainingData||typeof trainingData!=='object')trainingData={days:{}};if(!trainingData.days)trainingData.days={};
const trainingSave=()=>set('workoutsV1',trainingData);
const trainingDay=(date=trainingSelectedDate)=>trainingData.days[date]||(trainingData.days[date]={exercises:[]});
const trainingNumOrBlank=v=>v===''?'':n(v);
function trainingBodyWeight(){let a=[...(st.weights||[])].sort((x,y)=>y.date.localeCompare(x.date));return n(a[0]?.value)||n(st.settings.targetWeight)||70}
function trainingStrengthStats(item){let sets=item.sets||[],plan=sets.reduce((s,x)=>s+n(x.plan),0),fact=sets.reduce((s,x)=>s+n(x.fact),0),done=sets.filter(x=>x.fact!==''&&x.fact!=null).length;return{sets:sets.length,done,plan,fact,pct:plan?Math.round(fact/plan*100):0}}
function trainingEstimatedMinutes(item){if(item.kind==='cardio')return n(item.factMinutes);if(n(item.factMinutes)>0)return n(item.factMinutes);let s=trainingStrengthStats(item),active=s.fact*3/60,rests=Math.max(0,s.done-1)*1.5;return active+rests}
function trainingCaloriesForItem(item){let ex=trainingGetExercise(item.exerciseId);if(!ex)return 0;let minutes=trainingEstimatedMinutes(item);return ex.met*3.5*trainingBodyWeight()/200*minutes}
function trainingCalories(date=trainingDateKey()){let d=trainingData.days[date];return d?.exercises?.reduce((s,x)=>s+trainingCaloriesForItem(x),0)||0}
function trainingProgress(item){if(item.kind==='cardio'){let plan=n(item.planMinutes),fact=n(item.factMinutes);return plan?Math.round(fact/plan*100):(fact>0?100:0)}return trainingStrengthStats(item).pct}
function renderEnergyBalance(){if(!$('#activityBurn'))return;let food=total().kcal,burn=trainingCalories(trainingDateKey()),limit=n(st.settings.kcal)+burn,net=food-burn;$('#activityBurn').textContent=Math.round(burn)+' ккал';$('#activityFood').textContent=Math.round(food)+' ккал';$('#activityNet').textContent=Math.round(net)+' ккал';$('#activityLimit').textContent=Math.round(limit)+' ккал';setMetric('Kcal',food,limit,' ккал')}
function renderTraining(){let dateInput=$('#trainingDate');if(!dateInput)return;dateInput.value=trainingSelectedDate;let d=trainingDay(),items=d.exercises||[],host=$('#trainingList');host.innerHTML='';let totalPlan=0,totalFact=0,completed=0;
  items.forEach(item=>{let ex=trainingGetExercise(item.exerciseId);if(!ex)return;let pct=trainingProgress(item);if(item.kind==='cardio'){totalPlan+=n(item.planMinutes);totalFact+=Math.min(n(item.factMinutes),n(item.planMinutes)||n(item.factMinutes));if(n(item.factMinutes)>0)completed++}else{let s=trainingStrengthStats(item);totalPlan+=s.plan;totalFact+=Math.min(s.fact,s.plan||s.fact);if(s.done===s.sets&&s.sets)completed++}
    let card=document.createElement('div');card.className='trainingCard';card.dataset.id=item.id;let kcal=Math.round(trainingCaloriesForItem(item));
    if(item.kind==='cardio'){
      card.innerHTML=`<div class="trainingCardHead"><div><h3>${ex.name}</h3><p>План и факт по времени и дистанции</p></div><div class="trainingPct">${pct}%</div></div><div class="trainingProgress"><i style="width:${Math.min(100,Math.max(0,pct))}%"></i></div><div class="cardioGrid"><label>План, мин<input class="input training-field" data-field="planMinutes" type="number" min="0" step="1" value="${n(item.planMinutes)}"></label><label>Факт, мин<input class="input training-field" data-field="factMinutes" type="number" min="0" step="1" value="${n(item.factMinutes)}"></label><label>План, км<input class="input training-field" data-field="planDistance" type="number" min="0" step="0.1" value="${n(item.planDistance)}"></label><label>Факт, км<input class="input training-field" data-field="factDistance" type="number" min="0" step="0.1" value="${n(item.factDistance)}"></label></div><div class="trainingFoot"><span>≈ ${kcal} ккал</span><button class="danger training-delete" type="button">Удалить</button></div>`;
    }else{
      let stats=trainingStrengthStats(item),rows=(item.sets||[]).map((s,i)=>`<div class="setRow"><span>${i+1}</span><label>План<input class="input set-field" data-set="${i}" data-field="plan" type="number" min="0" step="1" value="${n(s.plan)}"></label><span class="setArrow">→</span><label>Факт<input class="input set-field" data-set="${i}" data-field="fact" type="number" min="0" step="1" value="${s.fact??''}"></label></div>`).join('');
      card.innerHTML=`<div class="trainingCardHead"><div><h3>${ex.name}</h3><p>${stats.done}/${stats.sets} подходов · ${stats.fact}/${stats.plan} повторений</p></div><div class="trainingPct">${pct}%</div></div><div class="trainingProgress"><i style="width:${Math.min(100,Math.max(0,pct))}%"></i></div><div class="setList">${rows}</div><div class="strengthTools"><button class="secondary training-add-set" type="button">＋ Подход</button><label>Факт. время, мин<input class="input training-field" data-field="factMinutes" type="number" min="0" step="1" value="${n(item.factMinutes)}"></label></div><div class="trainingFoot"><span>≈ ${kcal} ккал${n(item.factMinutes)?'':' · время оценено'}</span><button class="danger training-delete" type="button">Удалить</button></div>`;
    }
    host.appendChild(card)
  });
  let totalPct=totalPlan?Math.round(totalFact/totalPlan*100):0,burn=Math.round(items.reduce((s,x)=>s+trainingCaloriesForItem(x),0));$('#trainingProgressPct').textContent=totalPct+'%';$('#trainingProgressBar').style.width=Math.min(100,totalPct)+'%';$('#trainingDone').textContent=completed+' / '+items.length;$('#trainingBurn').textContent=burn+' ккал';$('#trainingBodyWeight').textContent=fmt(trainingBodyWeight(),1)+' кг';$('#trainingEmpty').hidden=items.length>0;
  $$('.training-field').forEach(input=>input.onchange=()=>{let card=input.closest('.trainingCard'),item=trainingDay().exercises.find(x=>x.id===card.dataset.id);if(!item)return;item[input.dataset.field]=n(input.value);trainingSave();renderTraining();renderEnergyBalance()});
  $$('.set-field').forEach(input=>input.onchange=()=>{let card=input.closest('.trainingCard'),item=trainingDay().exercises.find(x=>x.id===card.dataset.id),s=item?.sets?.[Number(input.dataset.set)];if(!s)return;s[input.dataset.field]=input.dataset.field==='fact'?trainingNumOrBlank(input.value):n(input.value);trainingSave();renderTraining();renderEnergyBalance()});
  $$('.training-add-set').forEach(b=>b.onclick=()=>{let item=trainingDay().exercises.find(x=>x.id===b.closest('.trainingCard').dataset.id);if(!item)return;let last=item.sets[item.sets.length-1];item.sets.push({plan:n(last?.plan)||10,fact:''});trainingSave();renderTraining()});
  $$('.training-delete').forEach(b=>b.onclick=()=>{let id=b.closest('.trainingCard').dataset.id;if(!confirm('Удалить упражнение из тренировки?'))return;trainingDay().exercises=trainingDay().exercises.filter(x=>x.id!==id);trainingSave();renderTraining();renderEnergyBalance()})
}
function trainingOpenAdd(){let s=$('#trainingExercise');s.innerHTML='';TRAINING_EXERCISES.forEach(ex=>{let o=document.createElement('option');o.value=ex.id;o.textContent=ex.name;s.appendChild(o)});trainingSyncAddFields();$('#trainingDialog').showModal()}
function trainingSyncAddFields(){let ex=trainingGetExercise($('#trainingExercise').value),strength=$('#trainingStrengthFields'),cardio=$('#trainingCardioFields');if(!ex)return;strength.hidden=ex.kind==='cardio';cardio.hidden=ex.kind!=='cardio'}
$('#trainingExercise').onchange=trainingSyncAddFields;$('#addTrainingBtn').onclick=trainingOpenAdd;$('#trainingAddFirst').onclick=trainingOpenAdd;
$('#trainingForm').onsubmit=e=>{e.preventDefault();let ex=trainingGetExercise($('#trainingExercise').value);if(!ex)return;let item={id:uid(),exerciseId:ex.id,kind:ex.kind};if(ex.kind==='cardio'){item.planMinutes=n($('#trainingPlanMinutes').value);item.factMinutes=0;item.planDistance=n($('#trainingPlanDistance').value);item.factDistance=0}else{let count=Math.max(1,Math.round(n($('#trainingPlanSets').value)||1)),reps=n($('#trainingPlanReps').value);item.sets=Array.from({length:count},()=>({plan:reps,fact:''}));item.factMinutes=0}trainingDay().exercises.push(item);trainingSave();$('#trainingDialog').close();renderTraining();renderEnergyBalance()};
$('#trainingDate').onchange=()=>{trainingSelectedDate=$('#trainingDate').value||trainingDateKey();renderTraining()};
$('#trainingPrev').onclick=()=>{let d=new Date(trainingSelectedDate+'T12:00:00');d.setDate(d.getDate()-1);trainingSelectedDate=trainingDateKey(d.toISOString().slice(0,10));renderTraining()};
$('#trainingNext').onclick=()=>{let d=new Date(trainingSelectedDate+'T12:00:00');d.setDate(d.getDate()+1);trainingSelectedDate=trainingDateKey(d.toISOString().slice(0,10));renderTraining()};
$$('[data-close="trainingDialog"]').forEach(b=>b.onclick=()=>$('#trainingDialog').close());
const trainingBaseRenderToday=renderToday;renderToday=function(){trainingBaseRenderToday();renderEnergyBalance()};
const trainingTabButton=document.querySelector('.tab[data-tab="training"]');if(trainingTabButton)trainingTabButton.addEventListener('click',()=>renderTraining());
renderTraining();renderToday();

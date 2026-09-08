(function(){
  const input=document.querySelector('#productSearch');
  const list=document.querySelector('#productList');
  if(!input||!list)return;

  const wrap=document.createElement('div');
  wrap.id='externalProductSearch';
  wrap.style.margin='10px 0 18px';
  wrap.innerHTML='<button id="externalProductSearchBtn" class="secondary" type="button" hidden>Найти во внешней базе</button><div id="externalProductStatus" class="meta" style="margin-top:8px"></div><div id="externalProductResults" style="display:grid;gap:10px;margin-top:10px"></div>';
  input.insertAdjacentElement('afterend',wrap);

  const button=wrap.querySelector('#externalProductSearchBtn');
  const status=wrap.querySelector('#externalProductStatus');
  const results=wrap.querySelector('#externalProductResults');
  let lastQuery='';

  function localMatches(q){
    q=q.trim().toLowerCase();
    if(!q)return true;
    try{return st.products.some(p=>(p.name||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q))}catch{return true}
  }

  function syncButton(){
    const q=input.value.trim();
    button.hidden=q.length<2||localMatches(q);
    if(q!==lastQuery){status.textContent='';results.innerHTML=''}
  }

  input.addEventListener('input',syncButton);
  setTimeout(syncButton,0);

  const num=v=>{const x=Number(v);return Number.isFinite(x)&&x>=0?x:0};
  const val=(n,...keys)=>{for(const k of keys){if(n&&n[k]!=null&&n[k]!=='')return num(n[k])}return 0};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v||0).toFixed(1).replace('.',',');

  function openCandidate(p){
    const n=p.nutriments||{};
    const name=(p.product_name||p.product_name_ru||p.product_name_en||'Продукт').trim();
    const brand=(p.brands||'').split(',')[0].trim();
    if(typeof openProduct==='function')openProduct();
    const title=document.querySelector('#productDialogTitle');
    if(title)title.textContent='Добавить продукт из внешней базы';
    document.querySelector('#productId').value='';
    document.querySelector('#productName').value=brand&&!name.toLowerCase().includes(brand.toLowerCase())?name+' · '+brand:name;
    document.querySelector('#productCategory').value='Внешняя база';
    document.querySelector('#productKcal').value=val(n,'energy-kcal_100g','energy-kcal_value');
    document.querySelector('#productP').value=val(n,'proteins_100g','proteins_value');
    document.querySelector('#productF').value=val(n,'fat_100g','fat_value');
    document.querySelector('#productC').value=val(n,'carbohydrates_100g','carbohydrates_value');
    document.querySelector('#productFiber').value=val(n,'fiber_100g','fiber_value');
  }

  function render(products){
    results.innerHTML='';
    if(!products.length){status.textContent='Во внешней базе ничего подходящего не найдено.';return}
    status.textContent='Найдено во внешней базе. БЖУ указаны на 100 г — проверь значения перед сохранением.';
    products.forEach((p,i)=>{
      const n=p.nutriments||{};
      const name=(p.product_name||p.product_name_ru||p.product_name_en||'Без названия').trim();
      const brand=(p.brands||'').split(',')[0].trim();
      const kcal=val(n,'energy-kcal_100g','energy-kcal_value'),pr=val(n,'proteins_100g','proteins_value'),fat=val(n,'fat_100g','fat_value'),carb=val(n,'carbohydrates_100g','carbohydrates_value'),fiber=val(n,'fiber_100g','fiber_value');
      const card=document.createElement('div');
      card.className='productCard';
      card.innerHTML='<div><b>'+esc(name)+(brand?' · '+esc(brand):'')+'</b><div class="meta">100 г: '+fmt(kcal)+' ккал · Б '+fmt(pr)+' · Ж '+fmt(fat)+' · У '+fmt(carb)+' · клетч. '+fmt(fiber)+'</div></div><div><button class="primary externalPick" type="button" data-i="'+i+'">Добавить</button></div>';
      results.appendChild(card);
    });
    results.querySelectorAll('.externalPick').forEach(b=>b.onclick=()=>openCandidate(products[Number(b.dataset.i)]));
  }

  button.addEventListener('click',async()=>{
    const q=input.value.trim();
    if(q.length<2)return;
    lastQuery=q;
    button.disabled=true;
    status.textContent='Ищу во внешней базе…';
    results.innerHTML='';
    try{
      const url='https://world.openfoodfacts.org/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,product_name_ru,product_name_en,brands,nutriments';
      const r=await fetch(url,{headers:{Accept:'application/json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const data=await r.json();
      const products=(Array.isArray(data.products)?data.products:[]).filter(p=>p&&(p.product_name||p.product_name_ru||p.product_name_en)&&p.nutriments).slice(0,10);
      render(products);
    }catch(e){
      status.textContent='Не удалось выполнить внешний поиск. Проверь интернет и попробуй ещё раз.';
    }finally{button.disabled=false}
  });
})();

const langSelect=document.getElementById('language');
function applyLang(){const lang=langSelect.value;document.documentElement.lang=lang;document.querySelectorAll('[data-ja][data-en]').forEach(el=>el.innerHTML=el.dataset[lang]);localStorage.setItem('luka-lang',lang)}
langSelect.value=localStorage.getItem('luka-lang')||'ja';langSelect.addEventListener('change',applyLang);applyLang();

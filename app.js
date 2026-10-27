export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
export function safeURL(value) {
  const s = String(value || '').trim();
  if (s.startsWith('/#')) return './' + s.slice(1);
  if (s.startsWith('#')) return s;
  try { const u = new URL(s); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
const e = escapeHTML;
let data;
const arrow = '<span aria-hidden="true">↗</span>';
const logo = '<img class="brand-logo" src="./assets/th-game-logo-v2.png" alt="TH Game — Chơi vui, khơi trí sáng tạo" width="260" height="104">';
const art = '<div class="play-art"><img src="./assets/play-lab.svg" width="560" height="480" alt="" aria-hidden="true"><span class="art-note">Một chút tò mò, thật nhiều điều hay!</span></div>';

function nav() {
  const link = m => `<a href="${e(safeURL(m.url))}" ${location.hash === m.url.replace(/^\//, '') ? 'aria-current="page"' : ''}>${e(m.label)}</a>`;
  return data.menus.filter(m => !m.parent).map(m => {
    const children = data.menus.filter(c => c.parent === m.id);
    return children.length ? `<details class="dropdown"><summary>${e(m.label)} <span aria-hidden="true">⌄</span></summary><div>${children.map(link).join('')}</div></details>` : link(m);
  }).join('');
}

function card(g, index) {
  return `<a class="game-card tone-${index % 3}" href="#/game/${encodeURIComponent(g.id)}">
    <div class="cover"><span class="card-number">${String(index + 1).padStart(2, '0')} / KHÁM PHÁ</span><span class="cover-doodle" aria-hidden="true">${['✳', '↗', '✦'][index % 3]}</span>${safeURL(g.image) ? `<img src="${e(safeURL(g.image))}" alt="Biểu tượng ${e(g.title)}" width="144" height="144" loading="lazy">` : '<span class="cover-placeholder" aria-hidden="true">✧</span>'}<span class="platform"><i></i>${e(g.platform || 'Game')}</span></div>
    <div class="card-body"><span class="game-category">${e(g.category || 'Khám phá & học hỏi')}</span><h3>${e(g.title)}</h3><p>${e(g.description)}</p><div class="card-bottom"><span>Khám phá game</span><span class="round-arrow" aria-hidden="true">↗</span></div></div>
  </a>`;
}

function home() {
  const games = data.games.filter(g => g.published);
  return `<section class="hero wrap">
    <div class="hero-copy"><span class="eyebrow hero-label"><span aria-hidden="true">✦</span> GÓC NHỎ CHO NHỮNG TRÍ TÒ MÒ</span><h1>${e(data.settings.tagline)}</h1><p>${e(data.settings.description)}</p><div class="hero-actions"><a class="button" href="#games">Khám phá trò chơi ${arrow}</a><a class="quiet-link" href="#/page/about">Về TH Game <span aria-hidden="true">→</span></a></div><div class="hero-note"><span class="little-sun" aria-hidden="true">☀</span><span>Những thử thách nhỏ.<br><strong>Những khám phá thật to.</strong></span></div></div>${art}
  </section>
  <section class="learning-strip wrap" aria-label="Định hướng phát triển game"><div class="learning-item"><span class="skill-icon skill-mint" aria-hidden="true">✳</span><div><h2>Khơi mở tư duy</h2><p>Tìm quy luật, thử một cách nghĩ mới.</p></div></div><div class="learning-item"><span class="skill-icon skill-peach" aria-hidden="true">↗</span><div><h2>Rèn luyện kỹ năng</h2><p>Quan sát, tập trung và kiên nhẫn.</p></div></div><div class="learning-item"><span class="skill-icon skill-lilac" aria-hidden="true">✦</span><div><h2>Vui cùng khám phá</h2><p>Học thêm từ mỗi lần thử sức.</p></div></div></section>
  <section id="games" class="catalog wrap"><div class="section-heading"><div><span class="eyebrow">CHƠI MỘT CHÚT, KHÁM PHÁ THẬT NHIỀU</span><h2>Hôm nay, mình chơi gì<span class="orange-text">?</span></h2><p>Mỗi trò chơi, một cách khám phá thế giới của riêng bạn.</p></div><span class="count">${String(games.length).padStart(2, '0')} trò chơi <span aria-hidden="true">✧</span></span></div>${games.length ? `<div class="game-grid">${games.map(card).join('')}</div>` : '<div class="empty"><span aria-hidden="true">✦</span><h3>Những cuộc phiêu lưu đang được chuẩn bị.</h3><p>Game mới sẽ xuất hiện tại đây. Hẹn gặp bạn sớm!</p></div>'}<p class="collection-note"><span aria-hidden="true">ⓘ</span> Ba mẹ có thể xem thông tin và phân loại độ tuổi của từng game trên Google Play.</p></section>
  <section class="maker-section wrap"><div class="maker-illustration" aria-hidden="true"><span class="maker-orbit"></span><div class="code-window"><div class="window-dots"><i></i><i></i><i></i></div><span class="code-brackets">&lt; <b>♥</b> /&gt;</span><span class="code-caption">LÀM BẰNG SỰ TÒ MÒ</span></div><span class="maker-star">✳</span><span class="maker-sticker">Một người làm game.<br>Thật nhiều ý tưởng.</span></div><div class="maker-copy"><span class="eyebrow">CHÀO BẠN, MÌNH LÀ TH GAME</span><h2>Một góc sáng tạo.<br>Nhiều niềm vui học hỏi.</h2><p>Mình phát triển những trò chơi từ niềm yêu thích lập trình và mong muốn mang đến các trải nghiệm học tập gần gũi. Đặc biệt, mình luôn dành một góc trong những ý tưởng ấy cho các bé.</p><a class="quiet-link" href="#/page/about">Đọc câu chuyện của mình ${arrow}</a></div></section>
  <section class="family-note wrap"><span class="family-icon" aria-hidden="true">✿</span><div><span class="eyebrow">DÀNH CHO BA MẸ & CÁC BÉ</span><h2>Cùng chơi. Cùng thử. Cùng lớn khôn.</h2><p>Một chút đồng hành của ba mẹ có thể biến giờ chơi thành khoảng thời gian cùng nhau khám phá.</p></div><a class="round-arrow" href="#/page/about" aria-label="Tìm hiểu về TH Game">↗</a></section>`;
}

export function formatText(text) {
  return String(text || '').split(/\n\s*\n/).filter(Boolean).map(block => {
    const lines = block.trim().split('\n');
    if (lines.every(line => line.startsWith('• '))) return `<ul>${lines.map(line => `<li>${e(line.slice(2))}</li>`).join('')}</ul>`;
    if (lines.length === 1 && block.trim().length < 65 && !/[.!?…]$/.test(block.trim())) return `<h2>${e(block.trim())}</h2>`;
    return `<p>${e(block.trim()).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function contentPage(p) {
  return `<section class="page wrap"><a class="back" href="#">← Về trang chủ</a><div class="page-layout"><article><span class="eyebrow">${p.id === 'about' ? 'GÓC SÁNG TẠO CÁ NHÂN' : 'TH GAME / THÔNG TIN'}</span><h1>${e(p.title)}<span class="orange-text">.</span></h1><div class="prose">${formatText(p.body)}</div></article><aside class="page-aside"><span class="aside-flower" aria-hidden="true">✳</span><h2>Điều hay bắt đầu<br>từ sự tò mò.</h2><p>Một lần thử.<br>Một cách nghĩ mới.<br>Một niềm vui vừa tìm thấy.</p><a class="button" href="#games">Khám phá game ${arrow}</a></aside></div></section>`;
}

function missing() { return '<section class="page wrap"><span class="eyebrow">MỘT CHÚT NỮA THÔI</span><h1>Trang chưa được công bố.</h1><a class="button" href="#">Về trang chủ ↗</a></section>'; }

function gamePage(id) {
  const g = data.games.find(g => g.id === id && g.published);
  if (!g) return missing();
  document.title = g.title + ' · ' + data.settings.name;
  const links = [['Google Play', g.android], ['App Store', g.ios], ['Tải game / Chơi ngay', g.download]].filter(x => safeURL(x[1]));
  return `<section class="detail wrap"><a class="back" href="#games">← Tất cả trò chơi</a><div class="detail-grid"><div class="detail-art tone-${data.games.indexOf(g) % 3}"><span class="detail-spark" aria-hidden="true">✳</span>${safeURL(g.image) ? `<img class="detail-image" src="${e(safeURL(g.image))}" alt="Biểu tượng ${e(g.title)}" width="300" height="300">` : art}<span class="detail-caption">MỘT TRÒ CHƠI TỪ ${e(data.settings.name.toUpperCase())}</span></div><div><span class="eyebrow">${e(g.platform || 'GAME')}</span><h1>${e(g.title)}</h1><span class="detail-category">${e(g.category || 'Khám phá & học hỏi')}</span><div class="prose">${formatText(g.description)}</div><div class="download-links">${links.map(([label, url]) => `<a class="button" target="_blank" rel="noopener noreferrer" href="${e(safeURL(url))}">Tải trên ${label} ${arrow}</a>`).join('') || '<p>Liên kết tải sẽ được cập nhật sớm.</p>'}</div>${links.length ? `<div class="qr"><img width="116" height="116" alt="QR tải ${e(g.title)}" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(new URL(safeURL(links[0][1]), location.href).href)}"><div><strong>Quét mã, mở cuộc vui</strong><p>Dùng camera điện thoại<br>để mở trang tải game.</p><small>QR được tạo bởi QRServer</small></div></div>` : ''}${safeURL(g.privacy) ? `<a class="text-link" href="${e(safeURL(g.privacy))}">Chính sách quyền riêng tư ${arrow}</a>` : ''}</div></div></section>`;
}

function render() {
  const route = location.hash;
  let body;
  document.title = data.settings.name + ' · Chơi vui, khám phá điều hay';
  try {
    if (route.startsWith('#/game/')) body = gamePage(decodeURIComponent(route.slice(7)));
    else if (route.startsWith('#/page/')) {
      const p = data.pages.find(p => p.id === decodeURIComponent(route.slice(7)) && p.published);
      body = p ? contentPage(p) : missing();
      document.title = (p?.title || 'Trang chưa công bố') + ' · ' + data.settings.name;
    } else body = home();
  } catch { body = missing(); }
  document.querySelector('#app').innerHTML = `<div class="top-note">Một góc nhỏ cho những trí tò mò lớn. <span aria-hidden="true">✦</span></div><header class="wrap"><a class="brand" href="#">${logo}</a><nav aria-label="Menu chính">${nav()}</nav><a class="header-cta" href="#games">Cùng chơi nào ${arrow}</a></header><main>${body}</main><footer><div class="footer-top wrap"><div><a class="brand" href="#">${logo}</a><p>Từ niềm vui chơi, khơi mở những điều hay.</p></div><div class="footer-links"><a href="#games">Khám phá game</a><a href="#/page/about">Về TH Game</a>${data.pages.filter(p => p.published && p.id !== 'about').map(p => `<a href="#/page/${encodeURIComponent(p.id)}">${e(p.title)}</a>`).join('')}${data.settings.email ? `<a href="mailto:${e(data.settings.email)}">Liên hệ ${arrow}</a>` : ''}</div></div><div class="footer-bottom wrap"><span>© ${new Date().getFullYear()} ${e(data.settings.name)}. Một góc sáng tạo cá nhân.</span></div></footer>`;
  if (route === '#games') requestAnimationFrame(() => document.querySelector('#games')?.scrollIntoView());
  else window.scrollTo(0, 0);
}

if (typeof document !== 'undefined' && document.querySelector('#app')) {
  fetch('./content.json', {cache: 'no-store'}).then(r => { if (!r.ok) throw Error('Load failed'); return r.json(); }).then(d => { data = d; render(); window.addEventListener('hashchange', render); }).catch(() => { document.querySelector('#app').textContent = 'Không tải được nội dung. Vui lòng tải lại trang.'; });
}

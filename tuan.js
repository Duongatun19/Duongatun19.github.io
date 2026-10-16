let menu = document.getElementById('menu');
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
    menu.style.display = 'block';
    menu.style.top = event.y + 'px';
    menu.style.left = event.x + 'px';
})
document.addEventListener('click', function () {
    menu.style.display = 'none';
});

/* ===== Công cụ đổi mùa: nhấn phím S để mở/đóng ===== */
(function () {
    var SEASONS = {
        spring: { name: '🌸 Xuân', shape: 'petal', colors: ['#ffb7d1', '#ff8fb8', '#ffe3ee'], dy: [0.6, 1.4], dx: 0.5, size: [8, 16] },
        summer: { name: '☀️ Hạ',  shape: 'bubble', colors: ['rgba(255,255,255,.8)', 'rgba(255,236,170,.85)'], dy: [-1.2, -0.4], dx: 0.3, size: [4, 12] },
        autumn: { name: '🍂 Thu', shape: 'maple', colors: ['#d9381e', '#f08a24', '#e6b422', '#a0522d'], dy: [0.8, 1.8], dx: 1, size: [14, 22] },
        winter: { name: '❄️ Đông', shape: 'flake', colors: ['#ffffff', '#dff3ff'], dy: [0.7, 1.7], dx: 0.4, size: [8, 18] }
    };
    var KEYS = ['spring', 'summer', 'autumn', 'winter'];
    var body = document.body, canvas = document.getElementById('fx'), ctx = canvas.getContext('2d');
    var mode = 'auto', particles = [], current;

    function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

    function autoSeason() {
        var m = new Date().getMonth() + 1;
        return m <= 3 ? 'spring' : m <= 6 ? 'summer' : m <= 9 ? 'autumn' : 'winter';
    }
    var DRAW = {
        petal: function (r, c) {
            ctx.fillStyle = c; ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.7, r * 0.6, 0, r);
            ctx.bezierCurveTo(-r * 0.7, r * 0.6, -r * 0.9, -r * 0.6, 0, -r * 0.8);
            ctx.fill();
        },
        bubble: function (r, c) {
            ctx.strokeStyle = c; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.stroke();
            ctx.fillStyle = c; ctx.beginPath();
            ctx.arc(-r * 0.35, -r * 0.35, r * 0.18, 0, 6.283); ctx.fill();
        },
        maple: function (r, c) {
            ctx.fillStyle = c; ctx.beginPath();
            var pts = [[0,-1],[.25,-.55],[.7,-.7],[.55,-.2],[1,0],[.5,.2],[.55,.6],[.1,.45],[0,1],[-.1,.45],[-.55,.6],[-.5,.2],[-1,0],[-.55,-.2],[-.7,-.7],[-.25,-.55]];
            pts.forEach(function (q, i) { ctx[i ? 'lineTo' : 'moveTo'](q[0] * r, q[1] * r); });
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, -r * .8); ctx.lineTo(0, r * 1.3); ctx.stroke();
        },
        flake: function (r, c) {
            ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, r / 9); ctx.lineCap = 'round';
            for (var i = 0; i < 6; i++) {
                ctx.save(); ctx.rotate(i * Math.PI / 3);
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r);
                ctx.moveTo(0, -r * .55); ctx.lineTo(r * .3, -r * .8);
                ctx.moveTo(0, -r * .55); ctx.lineTo(-r * .3, -r * .8);
                ctx.stroke(); ctx.restore();
            }
        }
    };
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    function spawn(s, anywhere) {
        var up = s.dy[1] < 0;
        return {
            x: rnd(0, canvas.width),
            y: anywhere ? rnd(0, canvas.height) : (up ? canvas.height + 20 : -20),
            vy: rnd(s.dy[0], s.dy[1]), vx: rnd(-s.dx, s.dx),
            size: rnd(s.size[0], s.size[1]), rot: rnd(0, 6.28), vr: rnd(-0.03, 0.03),
            color: s.colors[Math.floor(rnd(0, s.colors.length))]
        };
    }
    function apply(key) {
        current = key;
        body.setAttribute('data-season', key);
        particles = [];
        for (var i = 0; i < 60; i++) particles.push(spawn(SEASONS[key], true));
        var btns = document.querySelectorAll('#season-panel button');
        btns.forEach(function (b) { b.classList.toggle('on', b.dataset.m === mode); });
    }
    function setMode(m) {
        mode = m; save('season-mode', m);
        apply(m === 'auto' ? autoSeason() : m);
    }
    function tick() {
        var s = SEASONS[current];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(function (p, i) {
            p.x += p.vx + Math.sin(p.y / 40) * 0.3; p.y += p.vy; p.rot += p.vr;
            if (p.y > canvas.height + 30 || p.y < -30) particles[i] = spawn(s, false);
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            DRAW[s.shape](p.size, p.color); ctx.restore();
        });
        requestAnimationFrame(tick);
    }

    var panel = document.createElement('div');
    panel.id = 'season-panel';
    panel.innerHTML = KEYS.map(function (k, i) {
        return '<button data-m="' + k + '">' + (i + 1) + ' · ' + SEASONS[k].name + '</button>';
    }).join('') + '<button data-m="auto">0 · 🔄 Tự động</button>' +
        '<small>Nhấn S hoặc Esc để đóng · phím 1-4 chọn mùa · 0 tự động</small>';
    body.appendChild(panel);
    panel.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (b) setMode(b.dataset.m);
    });
    var toggle = document.createElement('button');
    toggle.id = 'season-toggle'; toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Đổi mùa'); toggle.textContent = '🍃';
    toggle.addEventListener('click', function () { panel.classList.toggle('open'); });
    body.appendChild(toggle);
    panel.addEventListener('contextmenu', function (e) { e.stopPropagation(); });

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) { e.preventDefault(); return; }
        var k = e.key.toLowerCase();
        if (k === 's') panel.classList.toggle('open');
        else if (k === 'escape') panel.classList.remove('open');
        else if (panel.classList.contains('open') && '1234'.indexOf(k) > -1 && k) setMode(KEYS[+k - 1]);
        else if (panel.classList.contains('open') && k === '0') setMode('auto');
        e.preventDefault(); // giữ nguyên hành vi chặn phím của trang
    });

    window.addEventListener('resize', resize);
    resize();
    var saved = load('season-mode');
    mode = (saved === 'auto' || SEASONS[saved]) ? saved : 'auto';
    apply(mode === 'auto' ? autoSeason() : mode);
    tick();
})();

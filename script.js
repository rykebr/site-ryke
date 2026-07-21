/* =========================================================================
   RYKE — motor de animação
   three  → campo de partículas WebGL (fundo)
   gsap   → ScrollTrigger: pin do scroll lateral, parallax, revelações
   anime  → título, contadores, menu
   motion → micro-interações com mola (spring)
   Cada bloco checa se a lib carregou; se não, cai no fallback em JS puro.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const deskQ = window.matchMedia('(min-width: 761px)');

    const HAS_THREE  = typeof THREE  !== 'undefined';
    const HAS_GSAP   = typeof gsap   !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    const HAS_ANIME  = typeof anime  !== 'undefined';
    const HAS_MOTION = typeof Motion !== 'undefined' && typeof Motion.animate === 'function';

    // Marca o <html> para o CSS ceder o controle às libs
    if (HAS_GSAP)  root.classList.add('gsap-on');
    if (HAS_ANIME) root.classList.add('anime-on');

    /* =====================================================================
       1. TEMA — sol / lua
       ===================================================================== */
    const themeBtn = document.getElementById('theme-toggle');
    let onThemeChange = null;

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('ryke-theme', next);
            if (onThemeChange) onThemeChange(next);

            if (HAS_MOTION && !reduced) {
                Motion.animate(themeBtn, { rotate: [0, 180], scale: [1, 0.8, 1] }, { duration: 0.5 });
            }
        });
    }

    /* =====================================================================
       2. THREE.JS — campo de partículas em onda
       Toda a deformação acontece no vertex shader (GPU), então o custo
       de CPU por quadro é praticamente zero.
       ===================================================================== */
    const glCanvas = document.getElementById('gl');
    let glTick = null;

    if (HAS_THREE && glCanvas && !reduced) {
        try {
            const renderer = new THREE.WebGLRenderer({
                canvas: glCanvas, alpha: true, antialias: false,
                powerPreference: 'high-performance'
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight, false);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
            camera.position.set(0, 7, 24);
            camera.lookAt(0, 0, -6);

            // Grade de pontos no plano XZ
            const COLS = 150, ROWS = 90, SP = 0.62;
            const positions = new Float32Array(COLS * ROWS * 3);
            let i = 0;
            for (let x = 0; x < COLS; x++) {
                for (let z = 0; z < ROWS; z++) {
                    positions[i++] = (x - COLS / 2) * SP;
                    positions[i++] = 0;
                    positions[i++] = (z - ROWS / 2) * SP;
                }
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const THEMES = {
                dark:  { a: new THREE.Color('#1e5fb0'), b: new THREE.Color('#ff6a1a'), o: 0.75 },
                light: { a: new THREE.Color('#1273e6'), b: new THREE.Color('#f2530a'), o: 0.45 }
            };
            const startTheme = THEMES[root.getAttribute('data-theme')] || THEMES.dark;

            const mat = new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                uniforms: {
                    uTime:  { value: 0 },
                    uScroll:{ value: 0 },
                    uColA:  { value: startTheme.a.clone() },
                    uColB:  { value: startTheme.b.clone() },
                    uOpacity: { value: startTheme.o }
                },
                vertexShader: `
                    uniform float uTime;
                    uniform float uScroll;
                    varying float vH;
                    void main() {
                        vec3 p = position;
                        // A rolagem empurra a onda para dentro da cena: descer
                        // a página é literalmente atravessar o campo.
                        p.z += uScroll * 46.0;
                        p.z = mod(p.z + 28.0, 56.0) - 28.0;

                        float d = length(p.xz) * 0.055;
                        float h = sin(p.x * 0.17 + uTime * 0.62 + uScroll * 5.0) * 0.95
                                + cos(p.z * 0.15 + uTime * 0.48) * 0.95
                                + sin(d * 2.2 - uTime * 1.05) * 0.8;
                        p.y += h;
                        vH = h;
                        vec4 mv = modelViewMatrix * vec4(p, 1.0);
                        gl_PointSize = (2.0 + h * 0.55) * (260.0 / -mv.z);
                        gl_Position = projectionMatrix * mv;
                    }`,
                fragmentShader: `
                    uniform vec3 uColA;
                    uniform vec3 uColB;
                    uniform float uOpacity;
                    varying float vH;
                    void main() {
                        vec2 c = gl_PointCoord - 0.5;
                        float r = dot(c, c);
                        if (r > 0.25) discard;
                        float t = smoothstep(-1.6, 1.9, vH);
                        vec3 col = mix(uColA, uColB, t);
                        float a = (0.20 + 0.62 * t) * uOpacity * smoothstep(0.25, 0.0, r);
                        gl_FragColor = vec4(col, a);
                    }`
            });

            const points = new THREE.Points(geo, mat);
            scene.add(points);

            // Parallax suave do mouse
            let mx = 0, my = 0, cxp = 0, cyp = 0;
            if (fine) {
                window.addEventListener('mousemove', (e) => {
                    mx = (e.clientX / window.innerWidth - 0.5) * 2;
                    my = (e.clientY / window.innerHeight - 0.5) * 2;
                }, { passive: true });
            }

            // Progresso da rolagem (0 no topo → 1 no rodapé)
            let scrollTarget = 0, scrollSmooth = 0;
            function readScroll() {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                scrollTarget = max > 0 ? window.scrollY / max : 0;
            }
            window.addEventListener('scroll', readScroll, { passive: true });
            readScroll();

            const clock = new THREE.Clock();
            let running = true;

            glTick = function () {
                if (!running) return;
                mat.uniforms.uTime.value = clock.getElapsedTime();

                // Suaviza o scroll para o movimento não ficar travado
                scrollSmooth += (scrollTarget - scrollSmooth) * 0.06;
                mat.uniforms.uScroll.value = scrollSmooth;

                cxp += (mx * 3.2 - cxp) * 0.045;
                cyp += (-my * 1.8 - cyp) * 0.045;

                // A câmera desce e gira conforme a página avança
                camera.position.x = cxp;
                camera.position.y = 7 + cyp - scrollSmooth * 3.2;
                camera.position.z = 24 - scrollSmooth * 7.0;
                points.rotation.y = scrollSmooth * 0.45;
                camera.lookAt(0, 0, -6);

                renderer.render(scene, camera);
            };

            (function loop() {
                requestAnimationFrame(loop);
                if (glTick) glTick();
            })();

            glCanvas.classList.add('ready');

            // O canvas é fixo e acompanha a página inteira, então ele roda
            // do topo ao rodapé. Só paramos quando a aba sai de foco —
            // aí sim não há nada para desenhar.
            document.addEventListener('visibilitychange', () => { running = !document.hidden; });

            // Troca de tema atualiza as cores do shader
            onThemeChange = (name) => {
                const t = THEMES[name] || THEMES.dark;
                mat.uniforms.uColA.value.copy(t.a);
                mat.uniforms.uColB.value.copy(t.b);
                mat.uniforms.uOpacity.value = t.o;
            };

            let glResize;
            window.addEventListener('resize', () => {
                clearTimeout(glResize);
                glResize = setTimeout(() => {
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight, false);
                }, 150);
            });
        } catch (err) {
            console.warn('WebGL indisponível — seguindo sem o fundo 3D.', err);
            glCanvas.style.display = 'none';
        }
    } else if (glCanvas) {
        glCanvas.style.display = 'none';
    }

    /* =====================================================================
       3. MENU FULLSCREEN (anime.js para a cascata dos links)
       ===================================================================== */
    const burger = document.getElementById('burger');
    const menuFull = document.getElementById('menu-full');
    let menuOpen = false;

    function setMenu(open) {
        menuOpen = open;
        burger.classList.toggle('open', open);
        menuFull.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';

        const links = menuFull.querySelectorAll('nav a');
        if (open && HAS_ANIME && !reduced) {
            anime.remove(links);
            anime({
                targets: links,
                translateY: [40, 0],
                opacity: [0, 1],
                duration: 700,
                delay: anime.stagger(60, { start: 150 }),
                easing: 'cubicBezier(.19,1,.22,1)'
            });
        } else if (!open && HAS_ANIME) {
            anime.remove(links);
            links.forEach(l => { l.style.opacity = ''; l.style.transform = ''; });
        }
    }
    if (burger) {
        burger.addEventListener('click', () => setMenu(!menuOpen));
        menuFull.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    }

    /* =====================================================================
       4. TOPBAR
       ===================================================================== */
    const topbar = document.getElementById('topbar');
    window.addEventListener('scroll', () => {
        topbar.classList.toggle('stuck', window.scrollY > 40);
    }, { passive: true });

    /* =====================================================================
       5. GSAP + SCROLLTRIGGER
       ===================================================================== */
    const hSection = document.querySelector('[data-hscroll]');
    const hTrack = hSection ? hSection.querySelector('[data-track]') : null;

    if (HAS_GSAP && !reduced) {
        gsap.registerPlugin(ScrollTrigger);

        // -- barra de progresso
        gsap.to('#progress', {
            width: '100%', ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: 0.25 }
        });

        // -- SCROLL LATERAL fixado (Serviços)
        if (hSection && hTrack) {
            const mm = gsap.matchMedia();
            mm.add('(min-width: 761px)', () => {
                const dist = () => Math.max(0, hTrack.scrollWidth - window.innerWidth);
                const tween = gsap.to(hTrack, {
                    x: () => -dist(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: hSection,
                        pin: hSection.querySelector('.hscroll-pin'),
                        start: 'top top',
                        end: () => '+=' + dist(),
                        scrub: 0.7,
                        anticipatePin: 1,
                        invalidateOnRefresh: true
                    }
                });
                return () => { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); gsap.set(hTrack, { x: 0 }); };
            });
        }

        // -- revelações em lote
        gsap.set('.rv', { opacity: 0, y: 28 });
        ScrollTrigger.batch('.rv', {
            start: 'top 88%',
            onEnter: (batch) => gsap.to(batch, {
                opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.09, overwrite: true
            })
        });

        // -- parallax discreto
        gsap.utils.toArray('.sec-head h2').forEach((el) => {
            gsap.fromTo(el, { y: 40 }, {
                y: -40, ease: 'none',
                scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        });
        const footWord = document.querySelector('.foot-word');
        if (footWord) {
            gsap.fromTo(footWord, { y: 60 }, {
                y: -20, ease: 'none',
                scrollTrigger: { trigger: footWord, start: 'top bottom', end: 'bottom top', scrub: true }
            });
        }

        // -- linhas do processo entram deslizando
        gsap.utils.toArray('.row').forEach((row) => {
            gsap.fromTo(row, { opacity: 0, x: -40 }, {
                opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
                scrollTrigger: { trigger: row, start: 'top 90%' }
            });
        });

        window.addEventListener('load', () => ScrollTrigger.refresh());

    } else {
        /* ---------- FALLBACK sem GSAP: scroll lateral em JS puro ---------- */
        let hMax = 0;
        const progressBar = document.getElementById('progress');

        function setupH() {
            if (!hSection || !hTrack) return;
            if (!deskQ.matches) { hSection.style.height = ''; hTrack.style.transform = ''; hMax = 0; return; }
            hTrack.style.transform = 'translateX(0px)';
            hMax = Math.max(0, hTrack.scrollWidth - window.innerWidth);
            hSection.style.height = (window.innerHeight + hMax) + 'px';
        }
        function updateH() {
            if (!hSection || !hTrack || hMax <= 0 || !deskQ.matches) return;
            const shift = Math.min(Math.max(-hSection.getBoundingClientRect().top, 0), hMax);
            hTrack.style.transform = 'translateX(' + (-shift) + 'px)';
        }
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                updateH();
                if (progressBar) {
                    const max = document.documentElement.scrollHeight - window.innerHeight;
                    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
                }
                ticking = false;
            });
        }, { passive: true });

        let rt;
        window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setupH, 160); });
        setupH(); updateH();
        window.addEventListener('load', setupH);

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((es) => {
                es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
            }, { threshold: 0.15 });
            document.querySelectorAll('.rv').forEach(el => io.observe(el));
        } else {
            document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
        }
    }

    /* =====================================================================
       6. ANIME.JS — título do hero e contadores
       ===================================================================== */
    const titleTargets = document.querySelectorAll('.ln b');

    if (HAS_ANIME && !reduced) {
        anime({
            targets: titleTargets,
            translateY: ['105%', '0%'],
            duration: 1200,
            delay: anime.stagger(110, { start: 120 }),
            easing: 'cubicBezier(.19,1,.22,1)'
        });
    } else {
        document.querySelectorAll('.ln').forEach(l => l.classList.add('in'));
    }

    function runCounter(el) {
        if (el.dataset.text) { el.textContent = el.dataset.text; return; }
        const target = parseInt(el.dataset.count, 10) || 0;
        const suffix = el.dataset.suffix || '';

        if (HAS_ANIME && !reduced) {
            const obj = { v: 0 };
            anime({
                targets: obj, v: target, duration: 1600, easing: 'easeOutExpo',
                update: () => { el.textContent = Math.round(obj.v) + suffix; }
            });
        } else {
            el.textContent = target + suffix;
        }
    }
    const nums = document.querySelectorAll('.mf-stats b');
    if ('IntersectionObserver' in window) {
        const nIO = new IntersectionObserver((es) => {
            es.forEach(e => { if (e.isIntersecting) { runCounter(e.target); nIO.unobserve(e.target); } });
        }, { threshold: 0.6 });
        nums.forEach(n => nIO.observe(n));
    } else nums.forEach(runCounter);

    /* =====================================================================
       7. MOTION ONE — micro-interações com mola
       ===================================================================== */
    if (HAS_MOTION && !reduced) {
        const spring = (typeof Motion.spring === 'function')
            ? Motion.spring({ stiffness: 320, damping: 18 })
            : { duration: 0.4 };

        // Botões e cards reagem com mola
        document.querySelectorAll('.btn, .rail-btns button, .wa').forEach(el => {
            el.addEventListener('mouseenter', () => Motion.animate(el, { scale: 1.05 }, { easing: spring }));
            el.addEventListener('mouseleave', () => Motion.animate(el, { scale: 1 }, { easing: spring }));
        });

        // Lista da vitrine entra com mola quando aparece
        if (typeof Motion.inView === 'function') {
            const scList = document.querySelector('.sc-list');
            if (scList) {
                Motion.inView(scList, () => {
                    Motion.animate(
                        scList.querySelectorAll('li'),
                        { opacity: [0, 1], transform: ['translateX(-24px)', 'none'] },
                        { duration: 0.6, delay: Motion.stagger(0.09), easing: [0.19, 1, 0.22, 1] }
                    );
                }, { amount: 0.3 });
            }

            // Números do manifesto pulsam ao entrar
            Motion.inView('.mf-stats b', (info) => {
                Motion.animate(info.target, { scale: [0.85, 1] }, { easing: spring });
            });
        }
    } else {
        document.querySelectorAll('.sc-list li').forEach(li => li.classList.add('in'));
    }

    /* =====================================================================
       8. GALERIA LATERAL ARRASTÁVEL (Projetos)
       ===================================================================== */
    const rail = document.getElementById('rail');
    const railProgress = document.getElementById('rail-progress');
    const railPrev = document.getElementById('rail-prev');
    const railNext = document.getElementById('rail-next');

    function updateRailUI() {
        if (!rail || !railProgress) return;
        const max = rail.scrollWidth - rail.clientWidth;
        const ratio = rail.clientWidth / rail.scrollWidth;
        railProgress.style.width = Math.min(ratio * 100, 100) + '%';
        railProgress.style.left = (max > 0 ? (rail.scrollLeft / max) * (100 - ratio * 100) : 0) + '%';
    }

    if (rail) {
        rail.addEventListener('scroll', updateRailUI, { passive: true });

        const step = () => {
            const card = rail.querySelector('.work');
            return card ? card.getBoundingClientRect().width : rail.clientWidth * 0.6;
        };
        if (railNext) railNext.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
        if (railPrev) railPrev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));

        let down = false, startX = 0, startLeft = 0, moved = 0;
        rail.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') return;
            down = true; moved = 0; startX = e.clientX; startLeft = rail.scrollLeft;
            rail.classList.add('dragging');
        });
        rail.addEventListener('pointermove', (e) => {
            if (!down) return;
            const dx = e.clientX - startX;
            moved = Math.abs(dx);
            rail.scrollLeft = startLeft - dx;
        });
        const endDrag = () => { if (down) { down = false; rail.classList.remove('dragging'); } };
        rail.addEventListener('pointerup', endDrag);
        rail.addEventListener('pointerleave', endDrag);
        rail.addEventListener('pointercancel', endDrag);
        rail.addEventListener('click', (e) => { if (moved > 6) e.preventDefault(); }, true);

        rail.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
            const max = rail.scrollWidth - rail.clientWidth;
            const next = rail.scrollLeft + e.deltaY;
            if (next > 0 && next < max) { e.preventDefault(); rail.scrollLeft = next; }
        }, { passive: false });

        updateRailUI();
    }

    /* =====================================================================
       9. PAUSA ANIMAÇÕES FORA DA TELA
       ===================================================================== */
    if ('IntersectionObserver' in window) {
        const pauseIO = new IntersectionObserver((es) => {
            es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting));
        }, { threshold: 0 });
        document.querySelectorAll('.sc-columns, .ticker').forEach(el => pauseIO.observe(el));
    }

    /* =====================================================================
       10. NAV ATIVO
       ===================================================================== */
    const navLinks = document.querySelectorAll('.topnav a');
    if ('IntersectionObserver' in window && navLinks.length) {
        const sIO = new IntersectionObserver((es) => {
            es.forEach(e => {
                if (!e.isIntersecting) return;
                navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
            });
        }, { threshold: 0, rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main section[id]').forEach(s => sIO.observe(s));
    }

    /* =====================================================================
       11. CURSOR CUSTOMIZADO
       ===================================================================== */
    const cursor = document.getElementById('cursor');
    const cursorLabel = document.getElementById('cursor-label');
    if (cursor && fine && !reduced) {
        let cx = 0, cy = 0, tx = 0, ty = 0;
        window.addEventListener('mousemove', (e) => {
            tx = e.clientX; ty = e.clientY;
            cursor.classList.add('on');
        }, { passive: true });

        (function follow() {
            cx += (tx - cx) * 0.19;
            cy += (ty - cy) * 0.19;
            cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
            requestAnimationFrame(follow);
        })();

        document.addEventListener('mouseleave', () => cursor.classList.remove('on'));
        document.querySelectorAll('[data-cursor]').forEach(el => {
            const mode = el.dataset.cursor;
            el.addEventListener('mouseenter', () => {
                cursor.classList.add(mode);
                if (mode === 'drag') cursorLabel.textContent = 'ARRASTAR';
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove(mode);
                cursorLabel.textContent = '';
            });
        });
    }

    /* =====================================================================
       12. RELÓGIO
       ===================================================================== */
    function relogio() {
        const n = new Date();
        const el = document.getElementById('hora-atual');
        if (el) el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    relogio();
    setInterval(relogio, 15000);

    /* =====================================================================
       13. FORMULÁRIO → WHATSAPP
       ===================================================================== */
    const form = document.getElementById('formZap');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const projeto = document.getElementById('projeto').value.trim();
            const empresa = document.getElementById('empresa').value.trim() || 'Não informada';

            const texto =
                `Olá! Vim pelo site da RYKE e quero um orçamento.\n\n` +
                `*Nome:* ${nome}\n*Projeto:* ${projeto}\n*Empresa:* ${empresa}\n\n` +
                `Podemos conversar?`;

            window.open('https://api.whatsapp.com/send?phone=5515981618716&text=' + encodeURIComponent(texto), '_blank');
        });
    }
});

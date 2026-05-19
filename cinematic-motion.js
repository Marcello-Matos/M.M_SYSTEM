/* ============================================================
   CINEMATIC MOTION
   - ScrollTrigger reveals
   - Magnetic buttons
   - Number counters
   - Ambient cursor spotlight
   - Smooth tab switch
   - Idle pulses
   ============================================================ */
(function () {
    'use strict';

    var reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia &&
        window.matchMedia('(pointer: coarse)').matches;

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    function whenGSAP(cb, tries) {
        tries = tries || 0;
        if (window.gsap) return cb(window.gsap);
        if (tries > 50) return;
        setTimeout(function () { whenGSAP(cb, tries + 1); }, 100);
    }

    /* ---------- Reveal por IntersectionObserver (não depende de plugin pago) ---------- */
    function bindReveal() {
        if (reduce) return;
        var nodes = document.querySelectorAll(
            '.form-section, .list-section, .totais-grid > *, .dashboard-card, .card, table tbody, .modal-content'
        );
        nodes.forEach(function (n) {
            if (!n.hasAttribute('data-reveal')) n.setAttribute('data-reveal', '');
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('[data-reveal]').forEach(function (n) { io.observe(n); });

        // Re-observa elementos novos
        var mo = new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                Array.prototype.forEach.call(m.addedNodes, function (node) {
                    if (node.nodeType !== 1) return;
                    if (node.matches && node.matches('.dashboard-card, .card')) {
                        node.setAttribute('data-reveal', '');
                        io.observe(node);
                    }
                });
            });
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    /* ---------- Magnetic buttons ---------- */
    function bindMagnetic(gsap) {
        if (reduce || coarse) return;
        var sel = '.btn-primary, .btn-success, .login-button, .btn-submit, .quick-action';
        var els = document.querySelectorAll(sel);
        els.forEach(function (el) {
            if (el.dataset.magneticBound === '1') return;
            el.dataset.magneticBound = '1';
            el.classList.add('magnetic');

            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
                var dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
                gsap.to(el, { x: dx, y: dy, duration: 0.4, ease: 'power3.out' });
            });
            el.addEventListener('pointerleave', function () {
                gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
            });
        });
    }

    /* ---------- Number counters (anima valores ao mudar) ---------- */
    function bindCounters(gsap) {
        if (reduce) return;
        var sel = '.total-card .card-value, .dashboard-card .card-value, ' +
                  '.total-card strong, .dashboard-card strong, ' +
                  '#valorInvestido, #valorVendas, #lucroTotal, #produtosEstoque';

        function parse(text) {
            if (!text) return null;
            var clean = text.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
            var n = parseFloat(clean);
            if (isNaN(n)) return null;
            return { num: n, raw: text };
        }

        function format(template, value) {
            // Se o template tem R$, mantém formato BRL com 2 casas
            var hasCurrency = /R\$/.test(template);
            var hasComma = /,/.test(template);
            var fixed = (hasCurrency || hasComma) ? value.toFixed(2).replace('.', ',') : Math.round(value).toString();
            // Adiciona separador de milhar
            var parts = fixed.split(',');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            fixed = parts.join(',');
            return hasCurrency ? 'R$ ' + fixed : fixed;
        }

        function animate(el, fromN, toN, template) {
            var obj = { v: fromN };
            gsap.to(obj, {
                v: toN,
                duration: 1.0,
                ease: 'expo.out',
                onUpdate: function () { el.textContent = format(template, obj.v); }
            });
        }

        function check(el) {
            var parsed = parse(el.textContent);
            if (!parsed) return;
            var prev = parseFloat(el.dataset.lastValue);
            var from = isNaN(prev) ? 0 : prev;
            if (from === parsed.num) {
                el.dataset.lastValue = parsed.num;
                return;
            }
            el.dataset.lastValue = parsed.num;
            animate(el, from, parsed.num, parsed.raw);
        }

        var nodes = document.querySelectorAll(sel);
        nodes.forEach(check);

        // Observa mudanças de texto
        var mo = new MutationObserver(function (muts) {
            muts.forEach(function (m) {
                if (m.type === 'characterData' || m.type === 'childList') {
                    var el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
                    if (el && el.matches && el.matches(sel)) check(el);
                }
            });
        });
        nodes.forEach(function (el) {
            mo.observe(el, { characterData: true, childList: true, subtree: true });
        });
    }

    /* ---------- Ambient cursor spotlight ---------- */
    function bindSpotlight() {
        if (reduce || coarse) return;
        var spot = document.createElement('div');
        spot.className = 'cinema-spot';
        document.body.appendChild(spot);

        var x = window.innerWidth / 2, y = window.innerHeight / 2;
        var tx = x, ty = y;
        var visible = false;

        document.addEventListener('pointermove', function (e) {
            tx = e.clientX; ty = e.clientY;
            if (!visible) { spot.classList.add('is-active'); visible = true; }
        });
        document.addEventListener('pointerleave', function () {
            spot.classList.remove('is-active'); visible = false;
        });

        function loop() {
            x += (tx - x) * 0.08;
            y += (ty - y) * 0.08;
            spot.style.transform = 'translate(' + (x - 270) + 'px,' + (y - 270) + 'px)';
            requestAnimationFrame(loop);
        }
        loop();
    }

    /* ---------- Smooth tab switch ---------- */
    function bindTabTransition(gsap) {
        if (reduce) return;
        if (typeof window.mostrarAba !== 'function' || window.mostrarAba.__cinemaPatched) return;
        var orig = window.mostrarAba;
        window.mostrarAba = function (id) {
            var current = document.querySelector('.aba-content.active');
            if (current) {
                gsap.to(current, {
                    opacity: 0, y: 8, duration: 0.22, ease: 'power2.in',
                    onComplete: function () {
                        orig.apply(window, [id]);
                        var next = document.querySelector('.aba-content.active');
                        if (next) {
                            gsap.fromTo(next,
                                { opacity: 0, y: 12 },
                                { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
                        }
                    }
                });
            } else {
                orig.apply(window, [id]);
            }
        };
        window.mostrarAba.__cinemaPatched = true;
    }

    /* ---------- Boot ---------- */
    ready(function () {
        bindReveal();
        bindSpotlight();
        whenGSAP(function (gsap) {
            try {
                bindMagnetic(gsap);
                bindCounters(gsap);
                bindTabTransition(gsap);
                // Re-bind magnetic em conteúdo dinâmico
                new MutationObserver(function () { bindMagnetic(gsap); })
                    .observe(document.body, { childList: true, subtree: true });
            } catch (e) {
                console.warn('[cinematic-motion] erro:', e);
            }
        });
    });
})();

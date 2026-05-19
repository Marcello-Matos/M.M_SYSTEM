/* ============================================================
   ELITE MOTION — animações com GSAP
   - Entry states orgânicos
   - Stagger reveal
   - Hover com física natural (tilt sutil)
   - Ripple tátil em botões
   - Auto-rebind para conteúdo dinâmico (tabelas, listas)
   ============================================================ */
(function () {
    'use strict';

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return; // Respeita preferência do usuário
    }

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    function whenGSAP(cb, tries) {
        tries = tries || 0;
        if (window.gsap) return cb(window.gsap);
        if (tries > 50) return; // ~5s
        setTimeout(function () { whenGSAP(cb, tries + 1); }, 100);
    }

    /* ---------- Ripple tátil ---------- */
    function bindRipple() {
        var sel = '.btn, .login-button, .btn-submit, .btn-filter, .tab-btn, .nav-item, .quick-action';
        document.addEventListener('pointerdown', function (e) {
            var el = e.target.closest(sel);
            if (!el || el.dataset.rippleBound === '1') {
                if (el) animateRipple(el, e);
                return;
            }
            el.dataset.rippleBound = '1';
            animateRipple(el, e);
        }, { passive: true });
    }

    function animateRipple(el, e) {
        var rect = el.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--ripple-x', x + '%');
        el.style.setProperty('--ripple-y', y + '%');
        el.classList.remove('is-rippling');
        // force reflow
        void el.offsetWidth;
        el.classList.add('is-rippling');
        setTimeout(function () { el.classList.remove('is-rippling'); }, 520);
    }

    /* ---------- Entry / Stagger via GSAP ---------- */
    function runEntry(gsap) {
        // Login
        var loginCard = document.querySelector('.login-card');
        if (loginCard) {
            gsap.from(loginCard, {
                opacity: 0, y: 28, scale: 0.985,
                duration: 0.9, ease: 'expo.out'
            });
            gsap.from('.login-hero > *', {
                opacity: 0, y: 16, duration: 0.7,
                ease: 'expo.out', stagger: 0.08, delay: 0.15
            });
            gsap.from('.login-form > *', {
                opacity: 0, y: 14, duration: 0.6,
                ease: 'expo.out', stagger: 0.06, delay: 0.25
            });
        }

        // Header / abas (desktop)
        var header = document.querySelector('.header');
        if (header) gsap.from(header, { opacity: 0, y: -16, duration: 0.7, ease: 'expo.out' });

        gsap.from('.tab-btn', {
            opacity: 0, y: 10, duration: 0.55,
            ease: 'expo.out', stagger: 0.05, delay: 0.1
        });

        // Cards do dashboard / totais
        var totals = document.querySelectorAll('.totais-grid .total-card, .dashboard-card, .card');
        if (totals.length) {
            gsap.from(totals, {
                opacity: 0, y: 18, scale: 0.97,
                duration: 0.7, ease: 'expo.out',
                stagger: 0.07, delay: 0.15
            });
        }

        // Seções principais
        gsap.from('.form-section, .list-section', {
            opacity: 0, y: 14, duration: 0.7,
            ease: 'expo.out', stagger: 0.08, delay: 0.05
        });
    }

    /* ---------- Hover físico nos cards (tilt sutil) ---------- */
    function bindTilt(gsap) {
        var cards = document.querySelectorAll('.total-card, .dashboard-card, .card, .quick-action');
        cards.forEach(function (card) {
            if (card.dataset.tiltBound === '1') return;
            card.dataset.tiltBound = '1';
            card.style.transformStyle = 'preserve-3d';

            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                gsap.to(card, {
                    rotateY: px * 4,
                    rotateX: -py * 4,
                    y: -3,
                    duration: 0.5,
                    ease: 'power3.out',
                    transformPerspective: 800
                });
            });
            card.addEventListener('pointerleave', function () {
                gsap.to(card, {
                    rotateY: 0, rotateX: 0, y: 0,
                    duration: 0.7, ease: 'expo.out'
                });
            });
        });
    }

    /* ---------- Reveal de novas linhas em tabelas / listas ---------- */
    function bindMutationReveal(gsap) {
        var targets = [
            document.getElementById('listaEstoque'),
            document.getElementById('listaVendas'),
            document.getElementById('listaProdutosMobile'),
            document.getElementById('listaVendasMobile')
        ].filter(Boolean);

        targets.forEach(function (target) {
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    var nodes = Array.prototype.slice.call(m.addedNodes)
                        .filter(function (n) { return n.nodeType === 1; });
                    if (!nodes.length) return;
                    gsap.from(nodes, {
                        opacity: 0, y: 8, duration: 0.45,
                        ease: 'expo.out', stagger: 0.03,
                        clearProps: 'transform,opacity'
                    });
                    // Re-bind tilt em cards novos
                    bindTilt(gsap);
                });
            });
            observer.observe(target, { childList: true });
        });
    }

    /* ---------- Modais com easing natural ---------- */
    function patchModals(gsap) {
        if (typeof window.abrirModal === 'function' && !window.abrirModal.__elitePatched) {
            var orig = window.abrirModal;
            window.abrirModal = function (id) {
                var r = orig.apply(this, arguments);
                var modal = document.getElementById(id);
                if (modal) {
                    var content = modal.querySelector('.modal-content, .edit-modal-content');
                    if (content) {
                        gsap.fromTo(content,
                            { opacity: 0, y: 24, scale: 0.97 },
                            { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' });
                    }
                }
                return r;
            };
            window.abrirModal.__elitePatched = true;
        }
    }

    /* ---------- Boot ---------- */
    ready(function () {
        bindRipple();
        whenGSAP(function (gsap) {
            try {
                gsap.config({ nullTargetWarn: false });
                runEntry(gsap);
                bindTilt(gsap);
                bindMutationReveal(gsap);
                patchModals(gsap);
            } catch (e) {
                console.warn('[elite-motion] erro:', e);
            }
        });
    });
})();

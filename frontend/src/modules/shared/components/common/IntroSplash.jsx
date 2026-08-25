import { useEffect, useState } from 'react';
import './IntroSplash.css';

// Timings (ms) — each phase switches a CSS class, the CSS does the rest.
// Kept tight on purpose (total ~2s): a boot splash should read instantly,
// not make every page load feel slow.
const RUN_DURATION = 550;       // rabbit hops in from the left
const LEAP_DURATION = 220;      // rabbit leaps up into the cart
const REVEAL_HOLD = 850;        // logo + wordmark + tagline sit on screen
const EXIT_DURATION = 300;      // whole overlay fades away

/**
 * Full-screen splash animation shown once when the app boots:
 * the GoodKart rabbit hops in, leaps into the cart, and the whole
 * thing settles into the real GoodKart logo + tagline before fading
 * out to reveal the site underneath. ~2s total, real CSS keyframe
 * animation throughout (not a crossfade of static frames).
 */
export default function IntroSplash({ onFinish }) {
    const [phase, setPhase] = useState('run'); // run -> leap -> reveal -> exit -> gone

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('leap'), RUN_DURATION);
        const t2 = setTimeout(() => setPhase('reveal'), RUN_DURATION + LEAP_DURATION);
        const t3 = setTimeout(() => setPhase('exit'), RUN_DURATION + LEAP_DURATION + REVEAL_HOLD);
        const t4 = setTimeout(() => {
            setPhase('gone');
            onFinish && onFinish();
        }, RUN_DURATION + LEAP_DURATION + REVEAL_HOLD + EXIT_DURATION);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }, [onFinish]);

    if (phase === 'gone') return null;

    const showRunner = phase === 'run' || phase === 'leap';
    const showLogo = phase === 'reveal' || phase === 'exit';

    return (
        <div className={`intro-splash ${phase === 'exit' ? 'intro-splash--exit' : ''}`} aria-hidden="true">
            <span className="intro-sparkle intro-sparkle--1" />
            <span className="intro-sparkle intro-sparkle--2" />
            <span className="intro-sparkle intro-sparkle--3" />

            <div className="intro-stage">
                {showRunner && (
                    <>
                        <div className={`intro-cart ${phase === 'leap' ? 'intro-cart--in' : ''}`}>
                            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#1800AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1.4" fill="#1800AD" stroke="none" />
                                <circle cx="19" cy="21" r="1.4" fill="#1800AD" stroke="none" />
                                <path d="M2.5 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21.5 8H6" />
                            </svg>
                        </div>

                        <div className={`intro-rabbit-outer intro-rabbit-outer--${phase}`}>
                            <div className="intro-rabbit-inner">
                                {/* Smooth gradient shading (soft light/shadow blended over the
                                    silhouette) reads as a rounded, lit form — the old version used
                                    flat hard-edged color patches per body part, which looked like
                                    stickers rather than an actual shaded illustration. */}
                                <div className="intro-rabbit-layer intro-rabbit-base" />
                                <div className="intro-rabbit-layer intro-rabbit-highlight" />
                                <div className="intro-rabbit-layer intro-rabbit-shadow-under" />
                                <div className="intro-rabbit-layer intro-rabbit-ear-tone" />
                                <span className="intro-rabbit-eye" />
                                <span className="intro-rabbit-eye-shine" />
                                <span className="intro-rabbit-nose" />
                                <span className="intro-rabbit-tail" />
                            </div>
                            <span className="intro-dust intro-dust--1" />
                            <span className="intro-dust intro-dust--2" />
                        </div>
                    </>
                )}

                {showLogo && (
                    <div className="intro-logo-group">
                        <img src="/goodkart-icon-only.png" alt="GoodKart" className="intro-logo-icon" />
                        <div className="intro-wordmark">
                            <span className="intro-wordmark-good">Good</span><span className="intro-wordmark-kart">kart</span>
                        </div>
                        <div className="intro-tagline">Good Deals. Good Life</div>
                    </div>
                )}
            </div>
        </div>
    );
}

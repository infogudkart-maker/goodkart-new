import { useEffect, useRef, useState } from 'react';
import './IntroSplash.css';

// How long the logo + wordmark + tagline sit on screen before the exit
// (docking) animation begins. Long enough for the slowest entrance
// animation — the tagline, at 750ms (350ms delay + 400ms duration) from
// mount — to fully finish and settle before exit fires, so the fade-out
// always transitions smoothly instead of interrupting an entrance.
const REVEAL_HOLD = 1150;
// Matches IntroSplash.css: the icon flies for 400ms, then the background
// (which had stayed opaque, hiding the real Navbar underneath) clears in a
// final 130ms starting at the 320ms mark — 320 + 130 = 450. Keep this in
// sync with those numbers if either changes, so the splash never unmounts
// mid-transition.
const EXIT_DURATION = 450;

const prefersReducedMotion = () => {
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
};

/**
 * Full-screen splash shown once when the app boots: pops in the real
 * GoodKart wordmark + tagline, then docks the icon onto the real Navbar
 * logo and fades out to reveal the site underneath. Skips the entrance
 * animations outright for prefers-reduced-motion.
 */
export default function IntroSplash({ onFinish }) {
    const reduceMotion = useRef(prefersReducedMotion());
    const [phase, setPhase] = useState('reveal'); // reveal -> exit -> gone
    // Where the intro icon needs to fly to so it lands exactly on the real
    // Navbar logo — measured once, right as we leave 'reveal', then applied
    // as a transform through the whole 'exit' phase.
    const logoIconRef = useRef(null);
    const wordmarkRef = useRef(null);
    const taglineRef = useRef(null);
    const [dockTransform, setDockTransform] = useState(null);
    // Tracked in React state (not just poked onto the DOM node directly) —
    // React fully owns `className` on these elements and rewrites it from
    // scratch on every render, so a class added by reaching straight into
    // the DOM gets silently wiped the next time this component re-renders
    // (which happens right as exit begins). That wiped the settled class
    // at exactly the wrong moment and let the entrance animation come back
    // and restart, fighting the docking transform for control of `transform`.
    const [settled, setSettled] = useState({ icon: false, wordmark: false, tagline: false });

    // Once an entrance fade/scale-in finishes, its `animation-fill-mode:
    // forwards` is just holding the final value steady — but a browser
    // won't smoothly transition a property AWAY from a forwards-filled
    // animation if we remove the animation and change the value in the
    // very same update (which is what exit does). Swapping onto a plain
    // "settled" style here, well before exit ever runs, means the later
    // exit-time change is an ordinary transition instead of a same-tick
    // snap. (Purely additive — the settled style matches the animation's
    // final value exactly, so nothing visibly changes at this moment.)
    const settleEntrance = (key) => () => {
        setSettled((s) => (s[key] ? s : { ...s, [key]: true }));
    };

    useEffect(() => {
        if (phase !== 'reveal') return undefined;
        const t1 = setTimeout(() => {
            // The real Navbar (already mounted underneath the splash) only
            // renders its logo as this exact clickable icon on the home
            // route, which is the only route the splash ever shows on.
            // Skipped for prefers-reduced-motion — that icon flying across
            // the screen is exactly the kind of motion that setting asks us
            // to avoid, so those users just get the plain fade instead.
            const source = reduceMotion.current ? null : logoIconRef.current;
            const target = reduceMotion.current ? null : document.querySelector('.brand-logo img');
            if (source && target) {
                const s = source.getBoundingClientRect();
                const t = target.getBoundingClientRect();
                if (s.width > 0 && t.width > 0) {
                    const scale = t.width / s.width;
                    const dx = (t.left + t.width / 2) - (s.left + s.width / 2);
                    const dy = (t.top + t.height / 2) - (s.top + s.height / 2);
                    setDockTransform({ dx, dy, scale });
                }
            }
            setPhase('exit');
        }, REVEAL_HOLD);
        return () => clearTimeout(t1);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'exit') return undefined;
        const t1 = setTimeout(() => {
            setPhase('gone');
            onFinish && onFinish();
        }, EXIT_DURATION);
        return () => clearTimeout(t1);
    }, [phase, onFinish]);

    if (phase === 'gone') return null;

    // Once we're exiting and know where the real logo sits, the icon flies
    // there instead of just sitting still while the overlay fades away.
    const isDocking = phase === 'exit' && !!dockTransform;

    return (
        <div className={`intro-splash ${phase === 'exit' ? 'intro-splash--exit' : ''}`} aria-hidden="true">
            <div className="intro-stage">
                <div className="intro-logo-group">
                    <img
                        ref={logoIconRef}
                        src="/goodkart-icon-only.png"
                        alt="GoodKart"
                        className={`intro-logo-icon ${settled.icon ? 'intro-settled' : ''} ${isDocking ? 'intro-logo-icon--docking' : ''}`}
                        style={isDocking ? {
                            transform: `translate(${dockTransform.dx}px, ${dockTransform.dy}px) scale(${dockTransform.scale})`,
                        } : undefined}
                        onAnimationEnd={settleEntrance('icon')}
                    />
                    <img
                        src="/goodkart-wordmark.png"
                        alt="Goodkart"
                        className={`intro-wordmark ${settled.wordmark ? 'intro-settled' : ''}`}
                        ref={wordmarkRef}
                        onAnimationEnd={settleEntrance('wordmark')}
                    />
                    <img
                        src="/goodkart-tagline.png"
                        alt="Good Deals. Good Life"
                        className={`intro-tagline ${settled.tagline ? 'intro-settled' : ''}`}
                        ref={taglineRef}
                        onAnimationEnd={settleEntrance('tagline')}
                    />
                </div>
            </div>
        </div>
    );
}

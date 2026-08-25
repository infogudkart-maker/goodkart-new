import { useEffect, useRef, useState } from 'react';
import './IntroSplash.css';

// Your real reference video, trimmed to exactly 4s: one hop cycle was
// removed from the middle (spliced at matching poses so it still reads as
// one continuous hop) to tighten the lead-up, ending right as the rabbit
// lands in the cart — a clean, complete beat well before the source's own
// "Godkart" text ever appears. We cut there and hand off to our own HTML
// wordmark, which reads correctly ("Goodkart").
const VIDEO_DURATION_MS = 4000;
// The video's last frame (rabbit landing in the cart) and our static
// reveal icon are two different pieces of artwork — similar idea, but not
// pixel-matched. Overlapping them in a true cross-fade made that mismatch
// visible as a brief "double image" while both were partway faded, which
// read as a glitch rather than a smooth handoff. So this is deliberately
// NOT an overlap anymore: the video fades out completely on its own first,
// and only once it's gone does the logo start its own pop-in — two clean,
// separate fades against the shared background instead of one messy blend.
const VIDEO_FADE_MS = 250;
// Counted from the start of 'reveal' (same moment the video starts fading),
// so it needs to cover: the video's own fade (VIDEO_FADE_MS) + the logo's
// entrance animations actually finishing — the slowest, the tagline, takes
// 750ms (350ms delay + 400ms duration) from when the logo group mounts.
// Comfortable buffer on top so "settled" (see settleEntrance below) always
// lands before exit fires — otherwise the fade-out at exit can't transition
// smoothly.
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

// The rabbit video is a first-open thing: once someone's seen it this visit,
// clicking the logo to replay the intro (or any other remount of this
// component) should skip straight to the logo pop-up + dock — no video.
// sessionStorage (not localStorage) so it's "once per visit/tab", not
// "once ever" — closing the tab and coming back later plays it again.
const INTRO_SEEN_KEY = 'goodkart-intro-video-seen';

const hasSeenIntroVideo = () => {
    try {
        return window.sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
    } catch {
        return false;
    }
};

const markIntroVideoSeen = () => {
    try {
        window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
        // No storage access (private mode, etc.) — the video will just play
        // again next time, which is a harmless fallback.
    }
};

// Almost every real browser (Chrome, Edge, Safari, Firefox) plays the mp4
// natively, so that's picked in practice. The webm is only a fallback for
// the rare browser build without H.264 support. We resolve this ONCE to a
// single `src` string rather than rendering multiple <source> children:
// React's onError on <video> also fires for a failed child <source> (its
// error event doesn't bubble in the DOM, but React's synthetic-event layer
// delivers it to the nearest ancestor handler anyway), which would trip our
// "give up, show the logo" handler the instant the *first* source failed —
// even when a later source would have played fine.
const pickVideoSrc = () => {
    try {
        const v = document.createElement('video');
        if (v.canPlayType('video/mp4; codecs="avc1.42E01E"')) return '/goodkart-intro.mp4';
        if (v.canPlayType('video/webm; codecs="vp9"')) return '/goodkart-intro.webm';
    } catch {
        // fall through to the default below
    }
    return '/goodkart-intro.mp4';
};

/**
 * Full-screen splash shown once when the app boots: plays the actual
 * reference video (rabbit hops in, leaps into the cart, cart morphs into
 * the bag icon) muted and once, fades it out, then pops in the real
 * GoodKart wordmark + tagline before fading out to reveal the site
 * underneath. Falls straight to the static reveal for prefers-reduced-motion,
 * or if the video fails to load for any reason.
 */
export default function IntroSplash({ onFinish }) {
    const reduceMotion = useRef(prefersReducedMotion());
    // Skip the video (go straight to the logo reveal + dock) for
    // reduced-motion users, same as before, AND for anyone who's already
    // sat through the video once this visit — e.g. clicking the navbar
    // logo to replay the intro after the first load.
    const skipVideo = useRef(reduceMotion.current || hasSeenIntroVideo());
    const [phase, setPhase] = useState(skipVideo.current ? 'reveal' : 'video'); // video -> reveal -> exit -> gone
    // Kept mounted a little past 'video' so it can fade out while the logo
    // fades in on top of it, instead of hard-cutting the instant it ends.
    const [videoInDom, setVideoInDom] = useState(!skipVideo.current);
    const videoRef = useRef(null);
    const videoSrc = useRef(skipVideo.current ? null : pickVideoSrc());
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

    const goToReveal = () => setPhase((p) => (p === 'video' ? 'reveal' : p));

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
        if (phase !== 'video') return undefined;
        // Mark it seen as soon as it actually starts playing, not only once
        // it finishes — so a refresh mid-video (or the error/fallback path)
        // still counts and doesn't replay the video on the very next load.
        markIntroVideoSeen();
        // Safety net: if the video's `ended` / `error` events never fire for
        // some reason, don't leave the splash stuck forever.
        const fallback = setTimeout(goToReveal, VIDEO_DURATION_MS + 1500);
        return () => clearTimeout(fallback);
    }, [phase]);

    useEffect(() => {
        if (phase !== 'reveal') return undefined;
        // Video fades out alone first (see the VIDEO_FADE_MS comment above
        // for why); only once it's actually gone does the logo mount and
        // start its own entrance animation.
        const t0 = setTimeout(() => {
            // Explicitly release the video's decoder resources right as we
            // remove it, rather than leaving that to whenever the browser
            // gets around to tearing down the unmounted element — cheap
            // insurance against a stray hitch right at the handoff.
            if (videoRef.current) {
                try {
                    videoRef.current.pause();
                    videoRef.current.removeAttribute('src');
                    videoRef.current.load();
                } catch {
                    // best-effort cleanup only
                }
            }
            setVideoInDom(false);
        }, VIDEO_FADE_MS);
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
        return () => {
            clearTimeout(t0);
            clearTimeout(t1);
        };
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

    // Waits for the video to be fully gone (not just "we're past the video
    // phase") — see the VIDEO_FADE_MS comment above for why the two never
    // overlap on screen.
    const showLogo = (phase === 'reveal' || phase === 'exit') && !videoInDom;
    // Still in the DOM for a moment into 'reveal' so it can fade out on its
    // own first — see VIDEO_FADE_MS above.
    const videoFadingOut = videoInDom && phase !== 'video';
    // Once we're exiting and know where the real logo sits, the icon flies
    // there instead of just sitting still while the overlay fades away.
    const isDocking = phase === 'exit' && !!dockTransform;

    return (
        <div className={`intro-splash ${phase === 'exit' ? 'intro-splash--exit' : ''}`} aria-hidden="true">
            <div className="intro-stage">
                {videoInDom && (
                    <video
                        ref={videoRef}
                        className={`intro-video ${videoFadingOut ? 'intro-video--out' : ''}`}
                        src={videoSrc.current}
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        onEnded={goToReveal}
                        onError={goToReveal}
                    />
                )}

                {showLogo && (
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
                        <div className={`intro-wordmark ${settled.wordmark ? 'intro-settled' : ''}`} ref={wordmarkRef} onAnimationEnd={settleEntrance('wordmark')}>
                            <span className="intro-wordmark-good">Good</span><span className="intro-wordmark-kart">kart</span>
                        </div>
                        <div className={`intro-tagline ${settled.tagline ? 'intro-settled' : ''}`} ref={taglineRef} onAnimationEnd={settleEntrance('tagline')}>Good Deals. Good Life</div>
                    </div>
                )}
            </div>
        </div>
    );
}
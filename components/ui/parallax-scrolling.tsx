'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export function ParallaxComponent() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const triggerElement = parallaxRef.current?.querySelector('[data-parallax-layers]');

    if (triggerElement) {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: "0% 0%",
          end: "100% 0%",
          scrub: 0
        }
      });

      const layers = [
        { layer: "1", yPercent: 70 },
        { layer: "2", yPercent: 55 },
        { layer: "3", yPercent: 40 },
        { layer: "4", yPercent: 10 }
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          {
            yPercent: layerObj.yPercent,
            ease: "none"
          },
          idx === 0 ? undefined : "<"
        );
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
      if (triggerElement) gsap.killTweensOf(triggerElement);
    };
  }, []);

  return (
    <div className="parallax" ref={parallaxRef}>
      <section className="parallax__header">
        <div className="parallax__visuals">
          <div className="parallax__black-line-overflow"></div>
          <div data-parallax-layers className="parallax__layers">
            <img
              src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&q=80"
              loading="eager"
              width="1600"
              data-parallax-layer="1"
              alt="Tampa events"
              className="parallax__layer-img"
            />
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
              loading="eager"
              width="1600"
              data-parallax-layer="2"
              alt="Tampa food scene"
              className="parallax__layer-img"
            />
            <div data-parallax-layer="3" className="parallax__layer-title">
              <h2 className="parallax__title">Tampa</h2>
            </div>
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80"
              loading="eager"
              width="1600"
              data-parallax-layer="4"
              alt="Tampa nightlife"
              className="parallax__layer-img"
            />
          </div>
          <div className="parallax__fade"></div>
        </div>
      </section>
      <section className="parallax__content">
        <div className="text-center px-6">
          <p className="text-[#FF5A36] text-xs font-semibold tracking-[0.3em] uppercase mb-4">The City That Never Chills</p>
          <p className="text-white/60 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            There&apos;s always something worth showing up for. We make sure you know what it is.
          </p>
        </div>
      </section>
    </div>
  );
}

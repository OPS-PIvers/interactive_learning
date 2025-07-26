##UPDATE BUTTON TO CREATE A PROJECT
  - Instead of a circle with a plus, create the "Create" button component with the following code, just adjusting for the styling of my project:

<button
  class="cursor-pointer bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-[0px_4px_32px_0_rgba(99,102,241,.70)] px-6 py-3 rounded-xl border-[1px] border-slate-500 text-white font-medium group"
>
  <div class="relative overflow-hidden">
    <p
      class="group-hover:-translate-y-7 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]"
    >
      Create
    </p>
    <p
      class="absolute top-7 left-0 group-hover:top-0 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]"
    >
      Create
    </p>
  </div>
</button>

## UPDATE INTERACTION TYPE: "Text Tip"
  - Implement a new interaction type that uses the following concept to add an overlay text tip associated with a hotspot.  Adjust for the styling of my project:

  /* From Uiverse.io by vnuny */ 
.item-hints {
  --purple: #720c8f;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
  padding-right: 170px;
}
.item-hints .hint {
  margin: 150px auto;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.item-hints .hint-dot {
  z-index: 3;
  border: 1px solid #ffe4e4;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  -webkit-transform: translate(-0%, -0%) scale(0.95);
  transform: translate(-0%, -0%) scale(0.95);
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.item-hints .hint-radius {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -125px 0 0 -125px;
  opacity: 0;
  visibility: hidden;
  -webkit-transform: scale(0);
  transform: scale(0);
}
.item-hints .hint[data-position="1"] .hint-content {
  top: 85px;
  left: 50%;
  margin-left: 56px;
}
.item-hints .hint-content {
  width: 300px;
  position: absolute;
  z-index: 5;
  padding: 35px 0;
  opacity: 0;
  transition: opacity 0.7s ease, visibility 0.7s ease;
  color: #fff;
  visibility: hidden;
  pointer-events: none;
}
.item-hints .hint:hover .hint-content {
  position: absolute;
  z-index: 5;
  padding: 35px 0;
  opacity: 1;
  -webkit-transition: opacity 0.7s ease, visibility 0.7s ease;
  transition: opacity 0.7s ease, visibility 0.7s ease;
  color: #fff;
  visibility: visible;
  pointer-events: none;
}
.item-hints .hint-content::before {
  width: 0px;
  bottom: 29px;
  left: 0;
  content: "";
  background-color: #fff;
  height: 1px;
  position: absolute;
  transition: width 0.4s;
}
.item-hints .hint:hover .hint-content::before {
  width: 180px;
  transition: width 0.4s;
}
.item-hints .hint-content::after {
  -webkit-transform-origin: 0 50%;
  transform-origin: 0 50%;
  -webkit-transform: rotate(-225deg);
  transform: rotate(-225deg);
  bottom: 29px;
  left: 0;
  width: 80px;
  content: "";
  background-color: #fff;
  height: 1px;
  position: absolute;
  opacity: 1;
  -webkit-transition: opacity 0.5s ease;
  transition: opacity 0.5s ease;
  -webkit-transition-delay: 0s;
  transition-delay: 0s;
}
.item-hints .hint:hover .hint-content::after {
  opacity: 1;
  visibility: visible;
}
.item-hints .hint[data-position="4"] .hint-content {
  bottom: 85px;
  left: 50%;
  margin-left: 56px;
}

## HOTSPOT -- Style Preset Color Selection
  - Update the hotspot color selected to match this code structure, but with the colors from my project themes.  Adjust, as necessary for the styling of my project:

  /* From Uiverse.io by xyzswas */ 
.lgc-radio-wrapper {
  margin: 0;
  padding: 2rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.liquid-radio {
  --primary-hue: 280;
  --secondary-hue: 320;
  --tertiary-hue: 200;
  --saturation: 45%;
  --lightness: 85%;
  --border-radius: 2em;
  --transition-duration: 0.4s;
  --scale-factor: 1;

  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 1rem;
  user-select: none;
  transition: all var(--transition-duration)
    cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.liquid-radio:hover {
  --scale-factor: 1.03;
  transform: scale(var(--scale-factor)) translateZ(5px);
}

.liquid-radio input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.liquid-radio .radio-visual {
  position: relative;
  width: 1.5em;
  height: 1.5em;
  margin-right: 0.75em;
  border-radius: var(--border-radius);
  background: linear-gradient(
    135deg,
    hsl(var(--primary-hue), var(--saturation), var(--lightness)),
    hsl(var(--secondary-hue), var(--saturation), var(--lightness)),
    hsl(var(--tertiary-hue), var(--saturation), var(--lightness))
  );
  border: 0.125em solid
    hsla(
      var(--primary-hue),
      var(--saturation),
      calc(var(--lightness) - 20%),
      0.4
    );
  transition: all var(--transition-duration)
    cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow:
    0 0.25em 0.5em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 40%),
        0.15
      ),
    0 0.125em 0.25em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 30%),
        0.2
      ),
    0 0.0625em 0.125em hsla(0, 0%, 0%, 0.1),
    inset 0 0.125em 0.25em hsla(0, 0%, 100%, 0.6),
    inset 0 -0.0625em 0.125em hsla(var(--primary-hue), var(--saturation), calc(var(
              --lightness
            ) - 15%), 0.3);
  transform-style: preserve-3d;
}

.liquid-radio .radio-visual::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5em;
  height: 0.5em;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    hsl(
      var(--primary-hue),
      calc(var(--saturation) + 25%),
      calc(var(--lightness) - 25%)
    ),
    hsl(
      var(--secondary-hue),
      calc(var(--saturation) + 20%),
      calc(var(--lightness) - 35%)
    ),
    hsl(
      var(--primary-hue),
      calc(var(--saturation) + 15%),
      calc(var(--lightness) - 45%)
    )
  );
  transform: translate(-50%, -50%) scale(0) translateZ(2px);
  transition: all var(--transition-duration)
    cubic-bezier(0.68, -0.25, 0.265, 1.25);
  opacity: 0;
  box-shadow:
    0 0.0625em 0.125em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 50%),
        0.4
      ),
    inset 0 0.0312em 0.0625em hsla(0, 0%, 100%, 0.4);
}

.liquid-radio .radio-visual::after {
  content: "";
  position: absolute;
  top: -0.1875em;
  left: -0.1875em;
  right: -0.1875em;
  bottom: -0.1875em;
  border-radius: calc(var(--border-radius) + 0.0625em);
  background: radial-gradient(
    ellipse at top left,
    hsla(var(--primary-hue), var(--saturation), var(--lightness), 0.6),
    hsla(var(--secondary-hue), var(--saturation), var(--lightness), 0.4),
    hsla(var(--tertiary-hue), var(--saturation), var(--lightness), 0.2)
  );
  opacity: 0;
  transition: all var(--transition-duration)
    cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: -1;
  filter: blur(0.125em);
}

.liquid-radio:hover .radio-visual {
  --saturation: 55%;
  --lightness: 88%;
  transform: translateY(-0.125em) rotateX(5deg) translateZ(3px);
  box-shadow:
    0 0.5em 1em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 40%),
        0.2
      ),
    0 0.25em 0.5em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 30%),
        0.25
      ),
    0 0.125em 0.25em hsla(0, 0%, 0%, 0.15),
    inset 0 0.1875em 0.375em hsla(0, 0%, 100%, 0.7),
    inset 0 -0.0625em 0.125em hsla(var(--primary-hue), var(--saturation), calc(var(
              --lightness
            ) - 15%), 0.4);
}

.liquid-radio:hover .radio-visual::after {
  opacity: 1;
  transform: translateZ(-1px) scale(1.1);
}

.liquid-radio input[type="radio"]:focus + .radio-visual {
  outline: 0.125em solid
    hsl(var(--primary-hue), var(--saturation), calc(var(--lightness) - 40%));
  outline-offset: 0.125em;
}

.liquid-radio input[type="radio"]:checked + .radio-visual {
  --saturation: 65%;
  --lightness: 80%;
  background: radial-gradient(
    ellipse at top left,
    hsl(var(--primary-hue), var(--saturation), calc(var(--lightness) + 5%)),
    hsl(var(--secondary-hue), var(--saturation), var(--lightness)),
    hsl(var(--tertiary-hue), var(--saturation), calc(var(--lightness) - 5%))
  );
  border-color: hsl(
    var(--primary-hue),
    calc(var(--saturation) + 10%),
    calc(var(--lightness) - 30%)
  );
  box-shadow:
    0 0.375em 0.75em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 40%),
        0.25
      ),
    0 0.1875em 0.375em
      hsla(
        var(--primary-hue),
        var(--saturation),
        calc(var(--lightness) - 30%),
        0.3
      ),
    0 0.0625em 0.125em hsla(0, 0%, 0%, 0.2),
    inset 0 0.1875em 0.375em hsla(0, 0%, 100%, 0.8),
    inset 0 -0.0625em 0.1875em hsla(var(--primary-hue), var(--saturation), calc(var(
              --lightness
            ) - 20%), 0.4);
  transform: translateZ(2px);
}

.liquid-radio input[type="radio"]:checked + .radio-visual::before {
  transform: translate(-50%, -50%) scale(1) translateZ(2px);
  opacity: 1;
  animation: pulseGlow 2s ease-in-out infinite;
}

.liquid-radio input[type="radio"]:active + .radio-visual {
  transform: scale(0.96) translateY(0.0625em) rotateX(-2deg);
  transition: all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes pulseGlow {
  0%,
  100% {
    box-shadow:
      0 0.0625em 0.125em
        hsla(
          var(--primary-hue),
          var(--saturation),
          calc(var(--lightness) - 50%),
          0.4
        ),
      inset 0 0.0312em 0.0625em hsla(0, 0%, 100%, 0.4);
  }
  50% {
    box-shadow:
      0 0.0625em 0.1875em
        hsla(
          var(--primary-hue),
          var(--saturation),
          calc(var(--lightness) - 50%),
          0.6
        ),
      0 0 0.25em
        hsla(
          var(--primary-hue),
          calc(var(--saturation) + 20%),
          calc(var(--lightness) - 30%),
          0.3
        ),
      inset 0 0.0312em 0.0625em hsla(0, 0%, 100%, 0.6);
  }
}

.liquid-radio .radio-label {
  color: hsl(var(--primary-hue), 25%, 45%);
  font-weight: 500;
  transition: color var(--transition-duration) ease;
}

.liquid-radio:hover .radio-label {
  color: hsl(var(--primary-hue), 35%, 35%);
}

.liquid-radio input[type="radio"]:checked ~ .radio-label {
  color: hsl(var(--primary-hue), 40%, 30%);
}

/* Variant colors */
.liquid-radio.variant-coral {
  --primary-hue: 15;
  --secondary-hue: 45;
  --tertiary-hue: 340;
}

.liquid-radio.variant-mint {
  --primary-hue: 150;
  --secondary-hue: 180;
  --tertiary-hue: 120;
}

.liquid-radio.variant-sky {
  --primary-hue: 200;
  --secondary-hue: 220;
  --tertiary-hue: 260;
}

## HOTSPOT VISUAL FEEDBACK ON CLICK/TOUCH
  - Implement an animation that indicates a hotspot has been clicked with the following code as an example, adjusting for the styling of my project:

  import * as motion from "motion/react-client"

export default function Gestures() {
    return (
        <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            style={box}
        />
    )
}

## 
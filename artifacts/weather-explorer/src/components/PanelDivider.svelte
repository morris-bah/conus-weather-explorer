<script lang="ts">
  let { label, controls, value, maximum, direction = 1, onresize }: {
    label: string;
    controls: string;
    value: number;
    maximum: number;
    direction?: number;
    onresize: (width: number) => void;
  } = $props();
  const minimum = 220;
  let dragging = $state(false);
  let origin = 0;
  let originalWidth = 0;

  function start(event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.focus();
    target.setPointerCapture(event.pointerId);
    dragging = true;
    origin = event.clientX;
    originalWidth = value;
  }
  function move(event: PointerEvent) {
    if (dragging) onresize(originalWidth + direction * (event.clientX - origin));
  }
  function stop() { dragging = false; }
  function keyboard(event: KeyboardEvent) {
    const step = event.shiftKey ? 40 : 10;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      onresize(value + (event.key === 'ArrowRight' ? 1 : -1) * direction * step);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      onresize(event.key === 'Home' ? minimum : maximum);
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class:dragging
  class="divider"
  role="separator"
  tabindex="0"
  aria-label={label}
  aria-controls={controls}
  aria-orientation="vertical"
  aria-valuemin={minimum}
  aria-valuemax={Math.round(maximum)}
  aria-valuenow={Math.round(value)}
  aria-valuetext={`${Math.round(value)} pixels`}
  title={`${label}. Drag or use left/right arrow keys.`}
  onpointerdown={start}
  onpointermove={move}
  onpointerup={stop}
  onpointercancel={stop}
  onlostpointercapture={stop}
  onkeydown={keyboard}
><span></span></div>

<style>
  .divider { display:none; }
  @media (min-width:768px) {
    .divider { display:flex; width:8px; flex:0 0 8px; align-items:center; justify-content:center; background:#172338; cursor:col-resize; touch-action:none; user-select:none; z-index:20; }
    .divider span { width:2px; height:36px; border-radius:2px; background:#64748b; }
    .divider:hover, .divider:focus-visible, .divider.dragging { background:#0369a1; outline:none; }
    .divider:hover span, .divider:focus-visible span, .divider.dragging span { background:#bae6fd; }
  }
</style>
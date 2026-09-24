<script lang="ts">
  import Sidebar from './components/Sidebar.svelte';
  import MapComponent from './components/Map.svelte';
  import Chat from './components/Chat.svelte';
  import { appState } from './lib/store.svelte';
  import { MessageSquare, Map as MapIcon, X } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import PanelDivider from './components/PanelDivider.svelte';

  let weatherWidth = $state(320);
  let chatWidth = $state(340);
  let viewportWidth = $state(1280);
  let mapPanel: HTMLDivElement;
  const minimumPanel = 220;
  const minimumMap = 240;
  const dividersWidth = 16;
  let weatherMaximum = $derived(Math.max(minimumPanel, viewportWidth - chatWidth - minimumMap - dividersWidth));
  let chatMaximum = $derived(Math.max(minimumPanel, viewportWidth - weatherWidth - minimumMap - dividersWidth));
  function resizeWeather(width: number) {
    weatherWidth = Math.min(weatherMaximum, Math.max(minimumPanel, width));
  }
  function resizeChat(width: number) {
    chatWidth = Math.min(chatMaximum, Math.max(minimumPanel, width));
  }
  onMount(() => {
    function fitPanels() {
      viewportWidth = window.innerWidth;
      if (viewportWidth < 768) return;
      const available = viewportWidth - minimumMap - dividersWidth;
      if (weatherWidth + chatWidth > available) {
        const extra = available - minimumPanel * 2;
        const ratio = (weatherWidth - minimumPanel) / (weatherWidth + chatWidth - minimumPanel * 2 || 1);
        weatherWidth = minimumPanel + extra * ratio;
        chatWidth = available - weatherWidth;
      }
    }
    fitPanels();
    window.addEventListener('resize', fitPanels);
    // Leaflet must recalculate its canvas when either panel changes size.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => appState.mapInstance?.invalidateSize({ pan: false, debounceMoveend: true }));
    });
    observer.observe(mapPanel);
    return () => {
      window.removeEventListener('resize', fitPanels);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  });

  // For mobile view toggles
  let showChatMobile = $state(false);
  let showSidebarMobile = $state(false);
</script>

<div class="h-screen w-screen flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-100">
  
  <!-- Mobile Header -->
  <div class="md:hidden flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900 z-50">
    <div class="flex items-center gap-2 text-brand-400">
      <MapIcon size={20} />
      <span class="font-bold">Weather</span>
    </div>
    <div class="flex items-center gap-2">
      <button 
        class="p-2 rounded-md bg-slate-800 text-slate-300 hover:text-white"
        onclick={() => { showSidebarMobile = !showSidebarMobile; showChatMobile = false; }}
      >
        <MapIcon size={18} />
      </button>
      <button 
        class="p-2 rounded-md bg-brand-600 text-white"
        onclick={() => { showChatMobile = !showChatMobile; showSidebarMobile = false; }}
      >
        <MessageSquare size={18} />
      </button>
    </div>
  </div>

  <!-- Left Sidebar (Search, layers, forecast) -->
  <div id="weather-panel" style:--panel-width={`${weatherWidth}px`} class="
    resizable-panel shrink-0 min-w-0
    absolute md:relative z-40 md:z-10
    w-full
    h-[calc(100%-53px)] md:h-full
    transition-transform duration-300 ease-in-out
    {showSidebarMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  ">
    <Sidebar />
    {#if showSidebarMobile}
      <button 
        class="md:hidden absolute top-4 right-4 p-2 bg-slate-800 rounded-full border border-slate-700 z-50"
        onclick={() => showSidebarMobile = false}
      >
        <X size={16} />
      </button>
    {/if}
  </div>

  <PanelDivider label="Resize weather data panel" controls="weather-panel" value={weatherWidth} maximum={weatherMaximum} onresize={resizeWeather} />

  <!-- Center Map -->
  <div bind:this={mapPanel} class="flex-1 min-w-0 relative z-0 h-[calc(100%-53px)] md:h-full">
    <MapComponent />
  </div>

  <PanelDivider label="Resize chat panel" controls="chat-panel" value={chatWidth} maximum={chatMaximum} direction={-1} onresize={resizeChat} />

  <!-- Right Sidebar (Chat) -->
  <div id="chat-panel" style:--panel-width={`${chatWidth}px`} class="
    resizable-panel shrink-0 min-w-0
    absolute md:relative z-40 md:z-10 right-0
    w-full
    h-[calc(100%-53px)] md:h-full
    transition-transform duration-300 ease-in-out
    {showChatMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
  ">
    <Chat />
    {#if showChatMobile}
      <button 
        class="md:hidden absolute top-4 right-4 p-2 bg-slate-800 rounded-full border border-slate-700 z-50"
        onclick={() => showChatMobile = false}
      >
        <X size={16} />
      </button>
    {/if}
  </div>
</div>

<style>
  @media (min-width:768px) {
    .resizable-panel { width:var(--panel-width); }
  }
</style>

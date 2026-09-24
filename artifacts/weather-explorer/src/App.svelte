<script lang="ts">
  import Sidebar from './components/Sidebar.svelte';
  import MapComponent from './components/Map.svelte';
  import Chat from './components/Chat.svelte';
  import { appState } from './lib/store.svelte';
  import { MessageSquare, Map as MapIcon, X } from '@lucide/svelte';

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
  <div class="
    absolute md:relative z-40 md:z-10
    w-full md:w-80 lg:w-96 
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

  <!-- Center Map -->
  <div class="flex-1 relative z-0 h-[calc(100%-53px)] md:h-full">
    <MapComponent />
  </div>

  <!-- Right Sidebar (Chat) -->
  <div class="
    absolute md:relative z-40 md:z-10 right-0
    w-full md:w-80 lg:w-[400px] 
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

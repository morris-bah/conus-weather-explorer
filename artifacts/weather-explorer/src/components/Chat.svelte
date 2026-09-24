<script lang="ts">
  import { appState } from '../lib/store.svelte';
  import { chat } from '../lib/api';
  import { Send, RefreshCw, AlertCircle, Bot, User, MapPin, Link2 } from '@lucide/svelte';
  
  let inputMessage = $state('');
  let chatContainer: HTMLElement | null = $state(null);
  let isSending = $state(false);
  let errorMsg = $state<string | null>(null);
  let lastFailedMessage = $state<string | null>(null);
  
  function scrollToBottom() {
    if (chatContainer) {
      setTimeout(() => {
        chatContainer!.scrollTop = chatContainer!.scrollHeight;
      }, 50);
    }
  }

  async function handleSend(retryMessage?: string) {
    const userMessage = retryMessage || inputMessage.trim();
    if (!userMessage || isSending) return;
    
    if (!retryMessage) {
      inputMessage = '';
      appState.chatHistory = [...appState.chatHistory, { role: 'user', content: userMessage }];
      scrollToBottom();
    }
    
    errorMsg = null;
    lastFailedMessage = null;
    isSending = true;
    appState.isChatting = true;
    
    try {
      const historyToSend = appState.chatHistory.slice(0, -1).slice(-12);
      
      const response = await chat({
        message: userMessage,
        location: appState.selectedLocation || undefined,
        history: historyToSend
      });
      
      appState.chatHistory = [...appState.chatHistory, { 
        role: 'assistant', 
        content: response.answer,
        sources: response.sources 
      }];
      
      if (response.location) {
        appState.selectedLocation = response.location;
        appState.flyTo(response.location.latitude, response.location.longitude);
      }
      
    } catch (e: any) {
      errorMsg = e.message || 'Failed to communicate with weather assistant.';
      lastFailedMessage = userMessage;
    } finally {
      isSending = false;
      appState.isChatting = false;
      scrollToBottom();
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="flex flex-col h-full bg-slate-900 border-l border-slate-800">
  <div class="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
    <div class="flex items-center gap-2">
      <Bot size={20} class="text-brand-400" />
      <h2 class="font-semibold text-slate-100">Weather Assistant</h2>
    </div>
    <button 
      class="text-slate-400 hover:text-slate-100 transition-colors p-2 rounded-md hover:bg-slate-800 disabled:opacity-50"
      onclick={() => appState.clearChat()}
      title="Clear chat"
      disabled={isSending}
    >
      <RefreshCw size={16} />
    </button>
  </div>
  
  <div 
    class="flex-1 overflow-y-auto p-4 space-y-4"
    bind:this={chatContainer}
  >
    {#each appState.chatHistory as turn}
      <div class="flex flex-col {turn.role === 'user' ? 'items-end' : 'items-start'}">
        <div class="flex items-end gap-2 max-w-[85%]">
          {#if turn.role === 'assistant'}
            <div class="w-8 h-8 rounded-full bg-brand-900/50 flex items-center justify-center shrink-0 mb-1">
              <Bot size={16} class="text-brand-400" />
            </div>
          {/if}
          
          <div class="rounded-2xl px-4 py-3 {
            turn.role === 'user' 
              ? 'bg-brand-600 text-white rounded-br-none' 
              : 'bg-slate-800 text-slate-200 rounded-bl-none'
          }">
            <p class="text-sm whitespace-pre-wrap leading-relaxed">{turn.content}</p>
            
            {#if turn.sources && turn.sources.length > 0}
              <div class="mt-3 pt-3 border-t border-slate-700/50 flex flex-col gap-1.5">
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Link2 size={10} /> Sources
                </span>
                <div class="flex flex-wrap gap-1.5">
                  {#each turn.sources as source}
                    <a 
                      href={source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="text-xs px-2 py-1 bg-slate-900/50 hover:bg-slate-900 rounded-md text-brand-300 hover:text-brand-200 transition-colors truncate max-w-full inline-block"
                    >
                      {new URL(source).hostname.replace('www.', '')}
                    </a>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
          
          {#if turn.role === 'user'}
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mb-1">
              <User size={16} class="text-slate-300" />
            </div>
          {/if}
        </div>
      </div>
    {/each}
    
    {#if isSending}
      <div class="flex items-start gap-2">
        <div class="w-8 h-8 rounded-full bg-brand-900/50 flex items-center justify-center shrink-0">
          <Bot size={16} class="text-brand-400" />
        </div>
        <div class="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1">
          <div class="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style="animation-delay: 300ms"></div>
        </div>
      </div>
    {/if}
  </div>
  
  {#if errorMsg}
    <div class="mx-4 p-3 mb-2 bg-red-900/30 border border-red-800/50 rounded-lg flex items-start gap-2">
      <AlertCircle size={16} class="text-red-400 shrink-0 mt-0.5" />
      <p class="text-sm text-red-200 flex-1">{errorMsg}</p>
      {#if lastFailedMessage}
        <button class="text-red-400 hover:text-red-300 text-xs font-medium bg-red-900/40 px-2 py-1 rounded" onclick={() => handleSend(lastFailedMessage!)}>Retry</button>
      {/if}
    </div>
  {/if}
  
  {#if appState.selectedLocation}
    <div class="px-4 py-2 bg-slate-800/50 text-xs text-slate-400 flex items-center gap-1.5 border-t border-slate-800">
      <MapPin size={12} class="text-brand-400" />
      Context: {appState.selectedLocation.name}
    </div>
  {/if}
  
  <div class="p-4 border-t border-slate-800 bg-slate-900">
    <div class="relative flex items-center">
      <textarea
        bind:value={inputMessage}
        onkeydown={handleKeyDown}
        placeholder="Ask about weather, forecasting, or a location..."
        class="w-full bg-slate-800 text-slate-100 placeholder:text-slate-500 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none min-h-[50px] max-h-[150px] text-sm"
        rows="1"
      ></textarea>
      <button 
        onclick={() => handleSend()}
        disabled={!inputMessage.trim() || isSending}
        class="absolute right-2 p-2 rounded-lg text-brand-400 hover:bg-slate-700 hover:text-brand-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-brand-400 transition-colors"
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </div>
  </div>
</div>

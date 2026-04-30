<script lang="ts">
  import { stage } from '$lib/stores/stage';
  import Setup from '$lib/components/stages/Setup.svelte';
  import Ritual from '$lib/components/stages/Ritual.svelte';
  import Burn from '$lib/components/stages/Burn.svelte';
  import Share from '$lib/components/stages/Share.svelte';
</script>

<svelte:head>
  <title>燒烏龜 · 烏雲歸去</title>
</svelte:head>

{#if $stage === 'setup'}
  <Setup />
{:else if $stage === 'ritual'}
  <Ritual />
{:else if $stage === 'burn'}
  <Burn />
{:else if $stage === 'share'}
  <Share />
{/if}

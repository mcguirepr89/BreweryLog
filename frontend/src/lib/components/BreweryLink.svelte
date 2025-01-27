<script lang="ts">
	import type { Brewery, User } from '$lib/types';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import BreweryCard from './BreweryCard.svelte';
	let modal: HTMLDialogElement;

	let breweries: Brewery[] = [];

	let isLoading: boolean = true;

	export let user: User | null;

	onMount(async () => {
		modal = document.getElementById('my_modal_1') as HTMLDialogElement;
		if (modal) {
			modal.showModal();
		}
		let res = await fetch(`/api/breweries/all/?include_collections=false`, {
			method: 'GET'
		});

		const newBreweries = await res.json();

		if (res.ok && breweries) {
			breweries = newBreweries;
		}
		isLoading = false;
	});

	function close() {
		dispatch('close');
	}

	function add(event: CustomEvent<Brewery>) {
		breweries = breweries.filter((a) => a.id !== event.detail.id);
		dispatch('add', event.detail);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dispatch('close');
		}
	}
</script>

<dialog id="my_modal_1" class="modal">
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<div class="modal-box w-11/12 max-w-5xl" role="dialog" on:keydown={handleKeydown} tabindex="0">
		<h1 class="text-center font-bold text-4xl mb-6">{$t('breweries.my_breweries')}</h1>
		{#if isLoading}
			<div class="flex justify-center items-center w-full mt-16">
				<span class="loading loading-spinner w-24 h-24"></span>
			</div>
		{/if}
		<div class="flex flex-wrap gap-4 mr-4 justify-center content-center">
			{#each breweries as brewery}
				<BreweryCard {user} type="link" {brewery} on:link={add} />
			{/each}
			{#if breweries.length === 0 && !isLoading}
				<p class="text-center text-lg">
					{$t('breweries.no_linkable_breweries')}
				</p>
			{/if}
		</div>
		<button class="btn btn-primary" on:click={close}>{$t('about.close')}</button>
	</div>
</dialog>

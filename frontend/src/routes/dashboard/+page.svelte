<script lang="ts">
	import BreweryCard from '$lib/components/BreweryCard.svelte';
	import type { PageData } from './$types';
	import { t } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	// Initial animation for page load
	onMount(() => {
		// Stat animations with quicker duration
		gsap.from('.stat', {
			opacity: 0,
			y: 50,
			duration: 0.6, // Quicker animation duration
			stagger: 0.1, // Faster staggering between elements
			ease: 'power2.out' // Slightly sharper easing for quicker feel
		});

		gsap.from('.stat-title', {
			opacity: 0,
			x: -50, // Smaller movement for quicker animation
			duration: 0.6, // Quicker animation duration
			stagger: 0.1, // Faster staggering
			ease: 'power2.out' // Slightly sharper easing for quicker feel
		});

		// Stat values with faster reveal and snappier effect
		gsap.from('.stat-value', {
			opacity: 0,
			scale: 0.8, // Slightly less scaling for a snappier effect
			duration: 1, // Shorter duration
			stagger: 0.2, // Faster staggering
			ease: 'elastic.out(0.75, 0.5)', // Slightly snappier bounce
			delay: 0 // Faster delay for quicker sequencing
		});

		// Brewery card animations with quicker reveal
		gsap.from('.brewery-card', {
			opacity: 0,
			y: 50, // Less movement for snappier feel
			duration: 0.8, // Quicker duration
			stagger: 0.1, // Faster staggering
			ease: 'power2.out',
			delay: 0 // Shorter delay for quicker appearance
		});
	});
	export let data: PageData;

	import FlagCheckeredVariantIcon from '~icons/mdi/flag-checkered-variant';
	import Airplane from '~icons/mdi/airplane';
	import CityVariantOutline from '~icons/mdi/city-variant-outline';
	import MapMarkerStarOutline from '~icons/mdi/map-marker-star-outline';

	const user = data.user;
	const recentBreweries = data.props.breweries;
	const stats = data.props.stats;
</script>

<div class="container mx-auto p-4">
	<!-- Welcome Message -->
	<div class="mb-8">
		<h1 class="text-4xl font-extrabold">
			{$t('dashboard.welcome_back')}, {user?.first_name ? `${user.first_name}` : user?.username}!
		</h1>
	</div>

	<!-- Stats -->
	<div class="stats shadow mb-8 w-full bg-neutral">
		<div class="stat">
			<div class="stat-figure text-secondary">
				<Airplane class="w-10 h-10 inline-block" />
			</div>
			<div class="stat-title text-neutral-content">{$t('dashboard.total_breweries')}</div>
			<div class="stat-value text-secondary">{stats.brewery_count}</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-primary">
				<FlagCheckeredVariantIcon class="w-10 h-10 inline-block" />
			</div>
			<div class="stat-title text-neutral-content">{$t('dashboard.countries_visited')}</div>
			<div class="stat-value text-primary">{stats.visited_country_count}</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-success">
				<MapMarkerStarOutline class="w-10 h-10 inline-block" />
			</div>
			<div class="stat-title text-neutral-content">{$t('dashboard.total_visited_regions')}</div>
			<div class="stat-value text-success">{stats.visited_region_count}</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-info">
				<CityVariantOutline class="w-10 h-10 inline-block" />
			</div>
			<div class="stat-title text-neutral-content">{$t('dashboard.total_visited_cities')}</div>
			<div class="stat-value text-info">{stats.visited_city_count}</div>
		</div>
	</div>

	<!-- Recent Breweries -->
	{#if recentBreweries.length > 0}
		<h2 class="text-3xl font-semibold mb-4">{$t('dashboard.recent_breweries')}</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
			{#each recentBreweries as brewery}
				<div class="brewery-card">
					<BreweryCard {brewery} user={data.user} readOnly />
				</div>
			{/each}
		</div>
	{/if}

	<!-- Inspiration if there are no recent breweries -->
	{#if recentBreweries.length === 0}
		<div
			class="inspiration flex flex-col items-center justify-center bg-neutral shadow p-8 mb-8 rounded-lg text-neutral-content"
		>
			<h2 class="text-3xl font-semibold mb-4">{$t('dashboard.no_recent_breweries')}</h2>
			<p class="text-lg text-center">
				{$t('dashboard.add_some')}
			</p>
			<a href="/breweries" class="btn btn-primary mt-4">{$t('map.add_brewery')}</a>
		</div>
	{/if}
</div>

<svelte:head>
	<title>Dashboard | BreweryLog</title>
	<meta name="description" content="Home dashboard for BreweryLog." />
</svelte:head>

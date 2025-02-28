<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type {
		Brewery,
		Category,
		Collection,
		OpenStreetMapPlace,
		Point,
		ReverseGeocode
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/toasts';
	import { deserialize } from '$app/forms';
	import { t } from 'svelte-i18n';
	export let longitude: number | null = null;
	export let latitude: number | null = null;
	export let collection: Collection | null = null;

	import { DefaultMarker, MapEvents, MapLibre } from 'svelte-maplibre';

	let query: string = '';
	let places: OpenStreetMapPlace[] = [];
	let images: { id: string; image: string; is_primary: boolean }[] = [];
	let warningMessage: string = '';
	let constrainDates: boolean = false;

	let categories: Category[] = [];

	import ActivityComplete from './ActivityComplete.svelte';
	import { appVersion } from '$lib/config';
	import CategoryDropdown from './CategoryDropdown.svelte';
	import { findFirstValue } from '$lib';
	import MarkdownEditor from './MarkdownEditor.svelte';
	import ImmichSelect from './ImmichSelect.svelte';

	import Star from '~icons/mdi/star';
	import Crown from '~icons/mdi/crown';

	let wikiError: string = '';

	let noPlaces: boolean = false;

	let is_custom_location: boolean = false;

	let reverseGeocodePlace: ReverseGeocode | null = null;

	let brewery: Brewery = {
		id: '',
		name: '',
		visits: [],
		link: null,
		description: null,
		activity_types: [],
		rating: NaN,
		is_public: false,
		latitude: NaN,
		longitude: NaN,
		location: null,
		images: [],
		user_id: null,
		collection: collection?.id || null,
		category: {
			id: '',
			name: '',
			display_name: '',
			icon: '',
			user_id: ''
		}
	};

	export let breweryToEdit: Brewery | null = null;

	brewery = {
		id: breweryToEdit?.id || '',
		name: breweryToEdit?.name || '',
		link: breweryToEdit?.link || null,
		description: breweryToEdit?.description || null,
		activity_types: breweryToEdit?.activity_types || [],
		rating: breweryToEdit?.rating || NaN,
		is_public: breweryToEdit?.is_public || false,
		latitude: breweryToEdit?.latitude || NaN,
		longitude: breweryToEdit?.longitude || NaN,
		location: breweryToEdit?.location || null,
		images: breweryToEdit?.images || [],
		user_id: breweryToEdit?.user_id || null,
		collection: breweryToEdit?.collection || collection?.id || null,
		visits: breweryToEdit?.visits || [],
		is_visited: breweryToEdit?.is_visited || false,
		category: breweryToEdit?.category || {
			id: '',
			name: '',
			display_name: '',
			icon: '',
			user_id: ''
		}
	};

	let markers: Point[] = [];

	let url: string = '';
	let imageError: string = '';
	let wikiImageError: string = '';

	let old_display_name: string = '';

	images = brewery.images || [];

	if (longitude && latitude) {
		brewery.latitude = latitude;
		brewery.longitude = longitude;
		reverseGeocode(true);
	}

	$: {
		is_custom_location = brewery.location != reverseGeocodePlace?.display_name;
	}

	if (brewery.longitude && brewery.latitude) {
		markers = [];
		markers = [
			{
				lngLat: { lng: brewery.longitude, lat: brewery.latitude },
				location: brewery.location || '',
				name: brewery.name,
				activity_type: ''
			}
		];
	}

	$: {
		if (!brewery.rating) {
			brewery.rating = NaN;
		}
	}

	function clearMap() {
		console.log('CLEAR');
		markers = [];
	}

	let imageSearch: string = brewery.name || '';

	async function removeImage(id: string) {
		let res = await fetch(`/api/images/${id}/image_delete`, {
			method: 'POST'
		});
		if (res.status === 204) {
			images = images.filter((image) => image.id !== id);
			brewery.images = images;
			console.log(images);
			addToast('success', $t('breweries.image_removed_success'));
		} else {
			addToast('error', $t('breweries.image_removed_error'));
		}
	}

	let isDetails: boolean = true;

	function saveAndClose() {
		dispatch('save', brewery);
		close();
	}

	let willBeMarkedVisited: boolean = false;

	$: {
		willBeMarkedVisited = false; // Reset before evaluating

		const today = new Date(); // Cache today's date to avoid redundant calculations

		for (const visit of brewery.visits) {
			const startDate = new Date(visit.start_date);
			const endDate = visit.end_date ? new Date(visit.end_date) : null;

			// If the visit has both a start date and an end date, check if it started by today
			if (startDate && endDate && startDate <= today) {
				willBeMarkedVisited = true;
				break; // Exit the loop since we've determined the result
			}

			// If the visit has a start date but no end date, check if it started by today
			if (startDate && !endDate && startDate <= today) {
				willBeMarkedVisited = true;
				break; // Exit the loop since we've determined the result
			}
		}

		console.log('WMBV:', willBeMarkedVisited);
	}

	let previousCoords: { lat: number; lng: number } | null = null;

	$: if (markers.length > 0) {
		const newLat = Math.round(markers[0].lngLat.lat * 1e6) / 1e6;
		const newLng = Math.round(markers[0].lngLat.lng * 1e6) / 1e6;

		if (!previousCoords || previousCoords.lat !== newLat || previousCoords.lng !== newLng) {
			brewery.latitude = newLat;
			brewery.longitude = newLng;
			previousCoords = { lat: newLat, lng: newLng };
			reverseGeocode();
		}

		if (!brewery.name) {
			brewery.name = markers[0].name;
		}
	}

	async function makePrimaryImage(image_id: string) {
		let res = await fetch(`/api/images/${image_id}/toggle_primary`, {
			method: 'POST'
		});
		if (res.ok) {
			images = images.map((image) => {
				if (image.id === image_id) {
					image.is_primary = true;
				} else {
					image.is_primary = false;
				}
				return image;
			});
			brewery.images = images;
		} else {
			console.error('Error in makePrimaryImage:', res);
		}
	}

	async function handleMultipleFiles(event: Event) {
		const files = (event.target as HTMLInputElement).files;
		if (files) {
			for (const file of files) {
				await uploadImage(file);
			}
		}
	}

	async function uploadImage(file: File) {
		let formData = new FormData();
		formData.append('image', file);
		formData.append('brewery', brewery.id);

		let res = await fetch(`/breweries?/image`, {
			method: 'POST',
			body: formData
		});
		if (res.ok) {
			let newData = deserialize(await res.text()) as { data: { id: string; image: string } };
			console.log(newData);
			let newImage = { id: newData.data.id, image: newData.data.image, is_primary: false };
			console.log(newImage);
			images = [...images, newImage];
			brewery.images = images;
			addToast('success', $t('breweries.image_upload_success'));
		} else {
			addToast('error', $t('breweries.image_upload_error'));
		}
	}

	async function fetchImage() {
		try {
			let res = await fetch(url);
			let data = await res.blob();
			if (!data) {
				imageError = $t('breweries.no_image_url');
				return;
			}
			let file = new File([data], 'image.jpg', { type: 'image/jpeg' });
			let formData = new FormData();
			formData.append('image', file);
			formData.append('brewery', brewery.id);

			await uploadImage(file);
			url = '';
		} catch (e) {
			imageError = $t('breweries.image_fetch_failed');
		}
	}

	async function fetchWikiImage() {
		let res = await fetch(`/api/generate/img/?name=${imageSearch}`);
		let data = await res.json();
		if (!res.ok) {
			wikiImageError = $t('breweries.image_fetch_failed');
			return;
		}
		if (data.source) {
			let imageUrl = data.source;
			let res = await fetch(imageUrl);
			let blob = await res.blob();
			let file = new File([blob], `${imageSearch}.jpg`, { type: 'image/jpeg' });
			let formData = new FormData();
			formData.append('image', file);
			formData.append('brewery', brewery.id);
			let res2 = await fetch(`/breweries?/image`, {
				method: 'POST',
				body: formData
			});
			if (res2.ok) {
				let newData = deserialize(await res2.text()) as { data: { id: string; image: string } };
				console.log(newData);
				let newImage = { id: newData.data.id, image: newData.data.image, is_primary: false };
				console.log(newImage);
				images = [...images, newImage];
				brewery.images = images;
				addToast('success', $t('breweries.image_upload_success'));
			} else {
				addToast('error', $t('breweries.image_upload_error'));
				wikiImageError = $t('breweries.wiki_image_error');
			}
		}
	}
	async function geocode(e: Event | null) {
		if (e) {
			e.preventDefault();
		}
		if (!query) {
			alert($t('breweries.no_location'));
			return;
		}
		let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2`, {
			headers: {
				'User-Agent': `BreweryLog / ${appVersion} `
			}
		});
		console.log(res);
		let data = (await res.json()) as OpenStreetMapPlace[];
		places = data;
		if (data.length === 0) {
			noPlaces = true;
		} else {
			noPlaces = false;
		}
	}

	let new_start_date: string = '';
	let new_end_date: string = '';
	let new_notes: string = '';
	function addNewVisit() {
		if (new_start_date && !new_end_date) {
			new_end_date = new_start_date;
		}
		if (new_start_date > new_end_date) {
			addToast('error', $t('breweries.start_before_end_error'));
			return;
		}
		if (new_end_date && !new_start_date) {
			addToast('error', $t('breweries.no_start_date'));
			return;
		}
		brewery.visits = [
			...brewery.visits,
			{
				start_date: new_start_date,
				end_date: new_end_date,
				notes: new_notes,
				id: ''
			}
		];
		new_start_date = '';
		new_end_date = '';
		new_notes = '';
	}

	async function markVisited() {
		console.log(reverseGeocodePlace);
		if (reverseGeocodePlace) {
			if (!reverseGeocodePlace.region_visited && reverseGeocodePlace.region_id) {
				let region_res = await fetch(`/api/visitedregion`, {
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
					body: JSON.stringify({ region: reverseGeocodePlace.region_id })
				});
				if (region_res.ok) {
					reverseGeocodePlace.region_visited = true;
					addToast('success', `Visit to ${reverseGeocodePlace.region} marked`);
				} else {
					addToast('error', `Failed to mark visit to ${reverseGeocodePlace.region}`);
				}
			}
			if (!reverseGeocodePlace.city_visited && reverseGeocodePlace.city_id != null) {
				let city_res = await fetch(`/api/visitedcity`, {
					headers: { 'Content-Type': 'application/json' },
					method: 'POST',
					body: JSON.stringify({ city: reverseGeocodePlace.city_id })
				});
				if (city_res.ok) {
					reverseGeocodePlace.city_visited = true;
					addToast('success', `Visit to ${reverseGeocodePlace.city} marked`);
				} else {
					addToast('error', `Failed to mark visit to ${reverseGeocodePlace.city}`);
				}
			}
		}
	}

	async function reverseGeocode(force_update: boolean = false) {
		let res = await fetch(
			`/api/reverse-geocode/reverse_geocode/?lat=${brewery.latitude}&lon=${brewery.longitude}`
		);
		let data = await res.json();
		if (data.error) {
			console.log(data.error);
			reverseGeocodePlace = null;
			return;
		}
		reverseGeocodePlace = data;

		console.log(reverseGeocodePlace);
		console.log(is_custom_location);

		if (
			reverseGeocodePlace &&
			reverseGeocodePlace.display_name &&
			(!is_custom_location || force_update)
		) {
			old_display_name = reverseGeocodePlace.display_name;
			brewery.location = reverseGeocodePlace.display_name;
		}
		console.log(data);
	}

	let fileInput: HTMLInputElement;

	const dispatch = createEventDispatcher();
	let modal: HTMLDialogElement;

	let immichIntegration: boolean = false;

	onMount(async () => {
		modal = document.getElementById('my_modal_1') as HTMLDialogElement;
		modal.showModal();
		console.log('open');
		let categoryFetch = await fetch('/api/categories/categories');
		if (categoryFetch.ok) {
			categories = await categoryFetch.json();
		} else {
			addToast('error', $t('breweries.category_fetch_error'));
		}
		// Check for Immich Integration
		let res = await fetch('/api/integrations');
		if (!res.ok) {
			addToast('error', $t('immich.integration_fetch_error'));
		} else {
			let data = await res.json();
			if (data.immich) {
				immichIntegration = true;
			}
		}
	});

	function close() {
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	async function generateDesc() {
		let res = await fetch(`/api/generate/desc/?name=${brewery.name}`);
		let data = await res.json();
		if (data.extract?.length > 0) {
			brewery.description = data.extract;
			wikiError = '';
		} else {
			wikiError = $t('breweries.no_description_found');
		}
	}

	async function addMarker(e: CustomEvent<any>) {
		markers = [];
		markers = [
			...markers,
			{
				lngLat: e.detail.lngLat,
				name: '',
				location: '',
				activity_type: ''
			}
		];
		console.log(markers);
	}

	function imageSubmit() {
		return async ({ result }: any) => {
			if (result.type === 'success') {
				if (result.data.id && result.data.image) {
					brewery.images = [...brewery.images, result.data];
					images = [...images, result.data];
					addToast('success', $t('breweries.image_upload_success'));

					fileInput.value = '';
					console.log(brewery);
				} else {
					addToast('error', result.data.error || $t('breweries.image_upload_error'));
				}
			}
		};
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		console.log(brewery);
		if (brewery.id === '') {
			console.log(categories);
			if (brewery.category?.display_name == '') {
				if (categories.some((category) => category.name === 'general')) {
					brewery.category = categories.find(
						(category) => category.name === 'general'
					) as Category;
				} else {
					brewery.category = {
						id: '',
						name: 'general',
						display_name: 'General',
						icon: '🌍',
						user_id: ''
					};
				}
			}
			let res = await fetch('/api/breweries', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(brewery)
			});
			let data = await res.json();
			if (data.id) {
				brewery = data as Brewery;
				isDetails = false;
				warningMessage = '';
				addToast('success', $t('breweries.brewery_created'));
			} else {
				warningMessage = findFirstValue(data) as string;
				console.error(data);
				addToast('error', $t('breweries.brewery_create_error'));
			}
		} else {
			let res = await fetch(`/api/breweries/${brewery.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(brewery)
			});
			let data = await res.json();
			if (data.id) {
				brewery = data as Brewery;
				isDetails = false;
				warningMessage = '';
				addToast('success', $t('breweries.brewery_updated'));
			} else {
				warningMessage = Object.values(data)[0] as string;
				addToast('error', $t('breweries.brewery_update_error'));
			}
		}
		if (
			brewery.is_visited &&
			(!reverseGeocodePlace?.region_visited || !reverseGeocodePlace?.city_visited)
		) {
			markVisited();
		}
		imageSearch = brewery.name;
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<dialog id="my_modal_1" class="modal">
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div class="modal-box w-11/12 max-w-3xl" role="dialog" on:keydown={handleKeydown} tabindex="0">
		<h3 class="font-bold text-2xl">
			{breweryToEdit ? $t('breweries.edit_brewery') : $t('breweries.new_brewery')}
		</h3>
		{#if brewery.id === '' || isDetails}
			<div class="modal-action items-center">
				<form method="post" style="width: 100%;" on:submit={handleSubmit}>
					<!-- Grid layout for form fields -->
					<!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"> -->
					<div class="collapse collapse-plus bg-base-200 mb-4">
						<input type="checkbox" checked />
						<div class="collapse-title text-xl font-medium">
							{$t('breweries.basic_information')}
						</div>
						<div class="collapse-content">
							<div>
								<label for="name">{$t('breweries.name')}<span class="text-red-500">*</span></label
								><br />
								<input
									type="text"
									id="name"
									name="name"
									bind:value={brewery.name}
									class="input input-bordered w-full"
									required
								/>
							</div>
							<div>
								<label for="link"
									>{$t('breweries.category')}<span class="text-red-500">*</span></label
								><br />

								<CategoryDropdown bind:categories bind:selected_category={brewery.category} />
							</div>
							<div>
								<label for="rating">{$t('breweries.rating')}</label><br />
								<input
									type="number"
									min="0"
									max="5"
									hidden
									bind:value={brewery.rating}
									id="rating"
									name="rating"
									class="input input-bordered w-full max-w-xs mt-1"
								/>
								<div class="rating -ml-3 mt-1">
									<input
										type="radio"
										name="rating-2"
										class="rating-hidden"
										checked={Number.isNaN(brewery.rating)}
									/>
									<input
										type="radio"
										name="rating-2"
										class="mask mask-star-2 bg-orange-400"
										on:click={() => (brewery.rating = 1)}
										checked={brewery.rating === 1}
									/>
									<input
										type="radio"
										name="rating-2"
										class="mask mask-star-2 bg-orange-400"
										on:click={() => (brewery.rating = 2)}
										checked={brewery.rating === 2}
									/>
									<input
										type="radio"
										name="rating-2"
										class="mask mask-star-2 bg-orange-400"
										on:click={() => (brewery.rating = 3)}
										checked={brewery.rating === 3}
									/>
									<input
										type="radio"
										name="rating-2"
										class="mask mask-star-2 bg-orange-400"
										on:click={() => (brewery.rating = 4)}
										checked={brewery.rating === 4}
									/>
									<input
										type="radio"
										name="rating-2"
										class="mask mask-star-2 bg-orange-400"
										on:click={() => (brewery.rating = 5)}
										checked={brewery.rating === 5}
									/>
									{#if brewery.rating}
										<button
											type="button"
											class="btn btn-sm btn-error ml-2"
											on:click={() => (brewery.rating = NaN)}
										>
											{$t('breweries.remove')}
										</button>
									{/if}
								</div>
							</div>
							<div>
								<div>
									<label for="link">{$t('breweries.link')}</label><br />
									<input
										type="text"
										id="link"
										name="link"
										bind:value={brewery.link}
										class="input input-bordered w-full"
									/>
								</div>
							</div>
							<div>
								<label for="description">{$t('breweries.description')}</label><br />
								<MarkdownEditor bind:text={brewery.description} />
								<div class="mt-2">
									<div class="tooltip tooltip-right" data-tip={$t('breweries.wiki_desc')}>
										<button type="button" class="btn btn-neutral mt-2" on:click={generateDesc}
											>{$t('breweries.generate_desc')}</button
										>
									</div>
									<p class="text-red-500">{wikiError}</p>
								</div>
							</div>
							{#if !collection?.id}
								<div>
									<div class="form-control flex items-start mt-1">
										<label class="label cursor-pointer flex items-start space-x-2">
											<span class="label-text">{$t('breweries.public_brewery')}</span>
											<input
												type="checkbox"
												class="toggle toggle-primary"
												id="is_public"
												name="is_public"
												bind:checked={brewery.is_public}
											/>
										</label>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200 mb-4">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">
							{$t('breweries.location_information')}
						</div>
						<div class="collapse-content">
							<!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"> -->
							<div>
								<label for="latitude">{$t('breweries.location')}</label><br />
								<div class="flex items-center">
									<input
										type="text"
										id="location"
										name="location"
										bind:value={brewery.location}
										class="input input-bordered w-full"
									/>
									{#if is_custom_location}
										<button
											class="btn btn-primary ml-2"
											type="button"
											on:click={() => (brewery.location = reverseGeocodePlace?.display_name)}
											>{$t('breweries.set_to_pin')}</button
										>
									{/if}
								</div>
							</div>

							<div>
								<form on:submit={geocode} class="mt-2">
									<input
										type="text"
										placeholder={$t('breweries.search_for_location')}
										class="input input-bordered w-full max-w-xs mb-2"
										id="search"
										name="search"
										bind:value={query}
									/>
									<button class="btn btn-neutral -mt-1" type="submit">{$t('navbar.search')}</button>
									<button class="btn btn-neutral -mt-1" type="button" on:click={clearMap}
										>{$t('breweries.clear_map')}</button
									>
								</form>
							</div>
							{#if places.length > 0}
								<div class="mt-4 max-w-full">
									<h3 class="font-bold text-lg mb-4">{$t('breweries.search_results')}</h3>

									<div class="flex flex-wrap">
										{#each places as place}
											<button
												type="button"
												class="btn btn-neutral mb-2 mr-2 max-w-full break-words whitespace-normal text-left"
												on:click={() => {
													markers = [
														{
															lngLat: { lng: Number(place.lon), lat: Number(place.lat) },
															location: place.display_name,
															name: place.name,
															activity_type: place.type
														}
													];
												}}
											>
												{place.display_name}
											</button>
										{/each}
									</div>
								</div>
							{:else if noPlaces}
								<p class="text-error text-lg">{$t('breweries.no_results')}</p>
							{/if}
							<!-- </div> -->
							<div>
								<MapLibre
									style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
									class="relative aspect-[9/16] max-h-[70vh] w-full sm:aspect-video sm:max-h-full rounded-lg"
									standardControls
								>
									<!-- MapEvents gives you access to map events even from other components inside the map,
where you might not have access to the top-level `MapLibre` component. In this case
it would also work to just use on:click on the MapLibre component itself. -->
									<MapEvents on:click={addMarker} />

									{#each markers as marker}
										<DefaultMarker lngLat={marker.lngLat} />
									{/each}
								</MapLibre>
								{#if reverseGeocodePlace}
									<div class="mt-2">
										<p>
											{reverseGeocodePlace.city
												? reverseGeocodePlace.city + ',  '
												: ''}{reverseGeocodePlace.region},
											{reverseGeocodePlace.country}
										</p>
										<p>
											{reverseGeocodePlace.region}:
											{reverseGeocodePlace.region_visited
												? $t('breweries.visited')
												: $t('breweries.not_visited')}
										</p>
										{#if reverseGeocodePlace.city}
											<p>
												{reverseGeocodePlace.city}:
												{reverseGeocodePlace.city_visited
													? $t('breweries.visited')
													: $t('breweries.not_visited')}
											</p>
										{/if}
									</div>
									{#if !reverseGeocodePlace.region_visited || (!reverseGeocodePlace.city_visited && !willBeMarkedVisited)}
										<button type="button" class="btn btn-neutral" on:click={markVisited}>
											{$t('breweries.mark_visited')}
										</button>
									{/if}
									{#if (willBeMarkedVisited && !reverseGeocodePlace.region_visited && reverseGeocodePlace.region_id) || (!reverseGeocodePlace.city_visited && willBeMarkedVisited && reverseGeocodePlace.city_id)}
										<div role="alert" class="alert alert-info mt-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												class="h-6 w-6 shrink-0 stroke-current"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												></path>
											</svg>
											<span
												>{reverseGeocodePlace.city
													? reverseGeocodePlace.city + ',  '
													: ''}{reverseGeocodePlace.region},
												{reverseGeocodePlace.country}
												{$t('breweries.will_be_marked')}</span
											>
										</div>
									{/if}
								{/if}
							</div>
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200 mb-4 overflow-visible">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">
							{$t('breweries.tags')} ({brewery.activity_types?.length || 0})
						</div>
						<div class="collapse-content">
							<input
								type="text"
								id="activity_types"
								name="activity_types"
								hidden
								bind:value={brewery.activity_types}
								class="input input-bordered w-full"
							/>
							<ActivityComplete bind:activities={brewery.activity_types} />
						</div>
					</div>

					<div class="collapse collapse-plus bg-base-200 mb-4">
						<input type="checkbox" />
						<div class="collapse-title text-xl font-medium">
							{$t('breweries.visits')} ({brewery.visits.length})
						</div>
						<div class="collapse-content">
							<label class="label cursor-pointer flex items-start space-x-2">
								{#if brewery.collection && collection && collection.start_date && collection.end_date}
									<span class="label-text">{$t('breweries.date_constrain')}</span>
									<input
										type="checkbox"
										class="toggle toggle-primary"
										id="constrain_dates"
										name="constrain_dates"
										on:change={() => (constrainDates = !constrainDates)}
									/>
								{/if}
							</label>
							<div class="flex gap-2 mb-1">
								{#if !constrainDates}
									<input
										type="date"
										class="input input-bordered w-full"
										placeholder="Start Date"
										bind:value={new_start_date}
										on:keydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addNewVisit();
											}
										}}
									/>
									<input
										type="date"
										class="input input-bordered w-full"
										placeholder={$t('breweries.end_date')}
										bind:value={new_end_date}
										on:keydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addNewVisit();
											}
										}}
									/>
								{:else}
									<input
										type="date"
										class="input input-bordered w-full"
										placeholder={$t('breweries.start_date')}
										min={collection?.start_date}
										max={collection?.end_date}
										bind:value={new_start_date}
										on:keydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addNewVisit();
											}
										}}
									/>
									<input
										type="date"
										class="input input-bordered w-full"
										placeholder={$t('breweries.end_date')}
										bind:value={new_end_date}
										min={collection?.start_date}
										max={collection?.end_date}
										on:keydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addNewVisit();
											}
										}}
									/>
								{/if}
							</div>
							<div class="flex gap-2 mb-1">
								<!-- textarea for notes -->
								<textarea
									class="textarea textarea-bordered w-full"
									placeholder={$t('breweries.add_notes')}
									bind:value={new_notes}
									on:keydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addNewVisit();
										}
									}}
								></textarea>
							</div>

							<div class="flex gap-2">
								<button type="button" class="btn btn-neutral" on:click={addNewVisit}
									>{$t('breweries.add')}</button
								>
							</div>

							{#if brewery.visits.length > 0}
								<h2 class=" font-bold text-xl mt-2">{$t('breweries.my_visits')}</h2>
								{#each brewery.visits as visit}
									<div class="flex flex-col gap-2">
										<div class="flex gap-2">
											<p>
												{new Date(visit.start_date).toLocaleDateString(undefined, {
													timeZone: 'UTC'
												})}
											</p>
											{#if visit.end_date && visit.end_date !== visit.start_date}
												<p>
													{new Date(visit.end_date).toLocaleDateString(undefined, {
														timeZone: 'UTC'
													})}
												</p>
											{/if}

											<div>
												<button
													type="button"
													class="btn btn-sm btn-error"
													on:click={() => {
														brewery.visits = brewery.visits.filter((v) => v !== visit);
													}}
												>
													{$t('breweries.remove')}
												</button>
											</div>
										</div>
										<p class="whitespace-pre-wrap -mt-2 mb-2">{visit.notes}</p>
									</div>
								{/each}
							{/if}
						</div>
					</div>

					<div>
						<div class="mt-4">
							{#if warningMessage != ''}
								<div role="alert" class="alert alert-warning mb-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6 shrink-0 stroke-current"
										fill="none"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<span>{$t('breweries.warning')}: {warningMessage}</span>
								</div>
							{/if}
							<button type="submit" class="btn btn-primary">{$t('breweries.save_next')}</button>
							<button type="button" class="btn" on:click={close}>{$t('about.close')}</button>
						</div>
					</div>
				</form>
			</div>
		{:else}
			<p class="text-lg">{$t('breweries.upload_images_here')}</p>

			<div class="mb-4">
				<label for="image" class="block font-medium mb-2">
					{$t('breweries.image')}
				</label>
				<form class="flex flex-col items-start gap-2">
					<input
						type="file"
						name="image"
						class="file-input file-input-bordered w-full max-w-sm"
						bind:this={fileInput}
						accept="image/*"
						id="image"
						multiple
						on:change={handleMultipleFiles}
					/>
					<input type="hidden" name="brewery" value={brewery.id} id="brewery" />
					<!-- <button class="btn btn-neutral w-full max-w-sm" type="submit">
						{$t('breweries.upload_image')}
					</button> -->
				</form>
			</div>

			<div class="mb-4">
				<label for="url" class="block font-medium mb-2">
					{$t('breweries.url')}
				</label>
				<div class="flex gap-2">
					<input
						type="text"
						id="url"
						name="url"
						bind:value={url}
						class="input input-bordered flex-1"
						placeholder="Enter image URL"
					/>
					<button class="btn btn-neutral" type="button" on:click={fetchImage}>
						{$t('breweries.fetch_image')}
					</button>
				</div>
			</div>

			<div class="mb-4">
				<label for="name" class="block font-medium mb-2">
					{$t('breweries.wikipedia')}
				</label>
				<div class="flex gap-2">
					<input
						type="text"
						id="name"
						name="name"
						bind:value={imageSearch}
						class="input input-bordered flex-1"
						placeholder="Search Wikipedia for images"
					/>
					<button class="btn btn-neutral" type="button" on:click={fetchWikiImage}>
						{$t('breweries.fetch_image')}
					</button>
				</div>
			</div>

			{#if immichIntegration}
				<ImmichSelect
					on:fetchImage={(e) => {
						url = e.detail;
						fetchImage();
					}}
				/>
			{/if}

			<div class="divider"></div>

			{#if images.length > 0}
				<h1 class="font-semibold text-xl mb-4">{$t('breweries.my_images')}</h1>
				<div class="flex flex-wrap gap-4">
					{#each images as image}
						<div class="relative h-32 w-32">
							<button
								type="button"
								class="absolute top-1 right-1 btn btn-error btn-xs z-10"
								on:click={() => removeImage(image.id)}
							>
								✕
							</button>
							{#if !image.is_primary}
								<button
									type="button"
									class="absolute top-1 left-1 btn btn-success btn-xs z-10"
									on:click={() => makePrimaryImage(image.id)}
								>
									<Star class="h-4 w-4" />
								</button>
							{:else}
								<!-- crown icon -->

								<div class="absolute top-1 left-1 bg-warning text-white rounded-full p-1 z-10">
									<Crown class="h-4 w-4" />
								</div>
							{/if}
							<img
								src={image.image}
								alt={image.id}
								class="w-full h-full object-cover rounded-md shadow-md"
							/>
						</div>
					{/each}
				</div>
			{:else}
				<h1 class="font-semibold text-xl text-gray-500">{$t('breweries.no_images')}</h1>
			{/if}

			<div class="mt-6">
				<button type="button" class="btn btn-primary w-full max-w-sm" on:click={saveAndClose}>
					{$t('about.close')}
				</button>
			</div>
		{/if}

		{#if brewery.is_public && brewery.id}
			<div class="bg-neutral p-4 mt-2 rounded-md shadow-sm">
				<p class=" font-semibold">{$t('breweries.share_brewery')}</p>
				<div class="flex items-center justify-between">
					<p class="text-card-foreground font-mono">
						{window.location.origin}/breweries/{brewery.id}
					</p>
					<button
						type="button"
						on:click={() => {
							navigator.clipboard.writeText(`${window.location.origin}/breweries/${brewery.id}`);
						}}
						class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
					>
						{$t('breweries.copy_link')}
					</button>
				</div>
			</div>
		{/if}
	</div>
</dialog>

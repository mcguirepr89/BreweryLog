<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const user = data.props.user;
	console.log(user);
</script>

{#if user.profile_pic}
	<div class="avatar flex items-center justify-center mt-4">
		<div class="w-48 rounded-md">
			<img src={user.profile_pic} alt={user.username} />
		</div>
	</div>
{/if}

<h1 class="text-center font-semibold text-4xl mt-4">{user.first_name} {user.last_name}</h1>
<h2 class="text-center font-semibold text-2xl">{user.username}</h2>

<div class="flex justify-center mt-4">
	{#if user.is_staff}
		<div class="badge badge-primary">Admin</div>
	{/if}
</div>

<div class="flex justify-center mt-4">
	<p class="text-sm text-neutral-content">
		{user.date_joined ? 'Joined ' + new Date(user.date_joined).toLocaleDateString() : ''}
	</p>
</div>

<svelte:head>
	<title>{user.username} | BreweryLog</title>
	<meta name="description" content="View your brewery collections." />
</svelte:head>

import { browser } from "$app/environment";
import type { FindOptions, Repository } from "remult";
import { writable } from "svelte/store";
import { onDestroy } from 'svelte';


/**  
 * @param repo remult repository to listen to
 * @param initValues usually the data coming from SSR
 * @returns a store with the initial values and a listen() method to subscribe to changes
 *
 * Example
 * ```ts
 * // get the repo
 * const taskRepo = remult.repo(Task)
 *
 * const tasks = remultLive(taskRepo, data.tasks)
 * $: browser && tasks.listen(data.options)
 * ```
 */
export const remultLive = <T>(repo: Repository<T>, initValues: T[] = []) => {
	const { subscribe, set } = writable<T[]>(initValues);
	let unSub: any = null

	onDestroy(async () => {
		await plzUnSub()
	})

	// if we already have a subscription, unsubscribe (on option update for example)
	const plzUnSub = async () => {
		if (unSub) {
			await unSub()
			unSub = null
		}
	}

	return {
		subscribe,
		set,
		listen: async (options?: FindOptions<T>) => {
			if (browser) {
				await plzUnSub()

				unSub = repo
					.liveQuery(options)
					.subscribe((info) => {
						set(info.items)
					})
			} else {
				throw new Error(`xxx.listen() Too early!

You should do like: 
  let tasks = tasksStore<Task>(taskRepo, data.tasks)
  $: browser && tasks.listen()
				`);
			}
		},
	};
}

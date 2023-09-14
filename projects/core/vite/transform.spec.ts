import { expect, it } from 'vitest'
import { transform } from './transform'

it('should empty @BackendMethod and clean imports', async () => {
  const code = `import { Allow, BackendMethod, remult } from "remult";
import { Task } from "./task";
import { AUTH_SECRET } from "$env/static/private";

export class TasksController {
	static async yop1(completed: boolean) {
		const taskRepo = remult.repo(Task);
	}

	@BackendMethod({ allowed: Allow.authenticated })
	static async setAllCompleted(completed: boolean) {
		console.log("AUTH_SECRET", AUTH_SECRET);

		const taskRepo = remult.repo(Task);
		for (const task of await taskRepo.find()) {
			await taskRepo.save({ ...task, completed });
		}
	}

	@BackendMethod({ allowed: Allow.authenticated })
	static async Yop(completed: boolean) {
		// console.log("AUTH_SECRET", AUTH_SECRET);

		const taskRepo = remult.repo(Task);
		for (const task of await taskRepo.find()) {
			await taskRepo.save({ ...task, completed });
		}
	}
}
	`

  const transformed = await transform(code)

  expect(transformed).toMatchInlineSnapshot(`
    {
      "code": "import { Allow, BackendMethod, remult } from \\"remult\\";
    import { Task } from \\"./task\\";

    export class TasksController {
        static async yop1(completed: boolean) {
            const taskRepo = remult.repo(Task);
        }

        @BackendMethod({
            allowed: Allow.authenticated
        })
        static async setAllCompleted(completed: boolean) {}

        @BackendMethod({
            allowed: Allow.authenticated
        })
        static async Yop(completed: boolean) {}
    }",
      "transformed": true,
    }
  `)
})

it('should not crash if there is an error in the original file', async () => {
  const code = `import { Allow, BackendMethod, remult } from "remult";
import { Task } from "./task";
import { AUTH_SECRET } from "$env/static/private";

export class TasksController {
	@BackendMethod({ allowed: Allow.authenticated })
	static async setAllCompleted(completed: boolean) {
		console.log("AUTH_SECRET", AUTH_SECRET);
	//} LEAVE THIS ERROR TO SIMULATE A WRONG PARSED FILE
}
	`

  const transformed = await transform(code)

  expect(transformed).toMatchInlineSnapshot(`
    {
      "code": "import { Allow, BackendMethod, remult } from \\"remult\\";
    import { Task } from \\"./task\\";
    import { AUTH_SECRET } from \\"$env/static/private\\";

    export class TasksController {
    	@BackendMethod({ allowed: Allow.authenticated })
    	static async setAllCompleted(completed: boolean) {
    		console.log(\\"AUTH_SECRET\\", AUTH_SECRET);
    	//} LEAVE THIS ERROR TO SIMULATE A WRONG PARSED FILE
    }
    	",
      "transformed": false,
    }
  `)
})

it('should not do anything as there is no @BackendMethod', async () => {
  const code = `import { Allow, BackendMethod, remult } from "remult";
import { Task } from "./task";
import { AUTH_SECRET } from "$env/static/private";

export class TasksController {
	static async yop1(completed: boolean) {
		const taskRepo = remult.repo(Task);
	}

	static async setAllCompleted(completed: boolean) {
		console.log("AUTH_SECRET", AUTH_SECRET);

		const taskRepo = remult.repo(Task);
		for (const task of await taskRepo.find()) {
			await taskRepo.save({ ...task, completed });
		}
	}
}
	`

  const transformed = await transform(code)

  expect(transformed).toMatchInlineSnapshot(`
    {
      "code": "import { Allow, BackendMethod, remult } from \\"remult\\";
    import { Task } from \\"./task\\";
    import { AUTH_SECRET } from \\"$env/static/private\\";

    export class TasksController {
        static async yop1(completed: boolean) {
            const taskRepo = remult.repo(Task);
        }

        static async setAllCompleted(completed: boolean) {
            console.log(\\"AUTH_SECRET\\", AUTH_SECRET);
            const taskRepo = remult.repo(Task);

            for (const task of await taskRepo.find()) {
                await taskRepo.save({
                    ...task,
                    completed
                });
            }
        }
    }",
      "transformed": false,
    }
  `)
})

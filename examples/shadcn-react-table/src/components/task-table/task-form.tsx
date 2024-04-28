import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Task } from '../../model/task.ts'
import { getValueList, repo } from 'remult'
import { repoResolver } from '../../lib/repo-resolver.ts'
import { fieldsOf } from '../../lib/use-remult-react-table.ts'

export function TaskForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: Task, done: VoidFunction) => void
  defaultValues?: Task
}) {
  const [isSubmitPending, startSubmitTransition] = React.useTransition()
  function formSubmit(values: Task) {
    startSubmitTransition(() => {
      onSubmit(values, () => form.reset())
    })
  }
  const form = useForm({
    resolver: repoResolver(repo(Task)),
    defaultValues,
  })
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(formSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Do a kickflip"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {fieldsOf(repo(Task), 'label', 'status', 'priority').map((meta) => (
          <FormField
            key={meta.key}
            control={form.control}
            name={meta.key as keyof Task}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{meta.caption}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value as string}
                >
                  <FormControl>
                    <SelectTrigger className="capitalize">
                      <SelectValue placeholder={'Select a ' + meta.caption} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {getValueList(meta).map((item) => (
                        <SelectItem
                          key={item}
                          value={item}
                          className="capitalize"
                        >
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <DialogFooter className="gap-2 pt-2 sm:space-x-0">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={isSubmitPending}>Submit</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

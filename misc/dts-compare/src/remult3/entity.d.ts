import type { Remult } from '../context';
import type { EntityOptions } from '../entity';
import type { ClassDecoratorContextStub } from './RepositoryImplementation';
/**Decorates classes that should be used as entities.
 * Receives a key and an array of EntityOptions.
 * @example
 * import  { Entity, Fields } from "remult";
 * @Entity("tasks", {
 *    allowApiCrud: true
 * })
 * export class Task {
 *    @Fields.uuid()
 *    id!: string;
 *    @Fields.string()
 *    title = '';
 *    @Fields.boolean()
 *    completed = false;
 * }
 * @note
 * EntityOptions can be set in two ways:
 * @example
 * // as an object
 * @Entity("tasks",{ allowApiCrud:true })
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Entity("tasks", (options,remult) => options.allowApiCrud = true)
 */
export declare function Entity<entityType>(key: string, ...options: (EntityOptions<entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType> | ((options: EntityOptions<entityType extends new (...args: any) => any ? InstanceType<entityType> : entityType>, remult: Remult) => void))[]): (target: any, info?: ClassDecoratorContextStub<entityType extends new (...args: any) => any ? entityType : never>) => any;

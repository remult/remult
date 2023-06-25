import { objectInputType, objectOutputType, UnknownKeysParam, ZodObjectDef, ZodRawShape, ZodType, ZodTypeAny } from "zod";
import { EntityInfoProvider } from "./src/context";
import { EntityOptions } from "./src/entity";
declare module 'zod' {
    interface ZodObject<T extends ZodRawShape, UnknownKeys extends UnknownKeysParam = "strip", Catchall extends ZodTypeAny = ZodTypeAny, Output = objectOutputType<T, Catchall>, Input = objectInputType<T, Catchall>> extends ZodType<Output, ZodObjectDef<T, UnknownKeys, Catchall>, Input> {
        entity(key: string, options: EntityOptions<any>): ZodObject<T> & EntityInfoProvider<any>;
    }
}

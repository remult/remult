import type { FieldOptions } from '../column-interfaces';
import { Remult } from '../context';
export interface columnInfo {
    key: string;
    settings: (remult: Remult) => FieldOptions;
}

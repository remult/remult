import { EntityBase } from "../remult3";
import { IdEntity } from "../id-entity";
export declare class stam extends EntityBase {
    id: number;
    title: string;
}
export declare class tasksWithEnum extends IdEntity {
    title: string;
    completed: boolean;
    priority: Priority;
}
export declare enum Priority {
    Low = 0,
    High = 1,
    Critical = 2
}
export declare class tasksWithStringEnum extends IdEntity {
    title: string;
    completed: boolean;
    priority: PriorityWithString;
}
export declare enum PriorityWithString {
    Low = "Low",
    High = "High",
    Critical = "Critical"
}

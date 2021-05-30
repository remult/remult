import { Column, Entity } from "../../../projects/core";

@Entity({
    key: 'moti',
    allowApiCrud:true,
    
})
export class MotiEntity {
    @Column()
    firstName: string;
}
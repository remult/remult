import { Column,Entity } from "../remult3";

@Entity({
    name:'Products'
})
export class Products {
    @Column()
    id:number;
    @Column()
    name: string;
    @Column()
    price: number;
    @Column()
    archived: boolean;
    @Column()
    availableFrom:Date;
}
import {
    DeepPartial,
    VendureEntity
} from '@vendure/core';
import { Column, Entity } from 'typeorm';


@Entity()
export class ChangeLog extends VendureEntity {
    constructor(input?: DeepPartial<ChangeLog>) {
        super(input);
    }

    @Column({nullable: true})
    entityName: string;

    @Column({nullable: true})
    entityId: string;

    @Column({ type: 'varchar',nullable: true })
    operation: string;

    @Column({type:'text', nullable: true})
    metadata: string;

}

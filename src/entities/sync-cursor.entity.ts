import {
    DeepPartial,
    VendureEntity
} from '@vendure/core';
import { Column, Entity } from 'typeorm';


@Entity()
export class SyncCursor extends VendureEntity {
    constructor(input?: DeepPartial<SyncCursor>) {
        super(input);
    }

    @Column({nullable: true})
    entityName: string;

    @Column({
        type: 'datetime',
        nullable: true
    })
    lastProcessed: Date;

    @Column({type:'text', nullable: true})
    metadata: string;
}

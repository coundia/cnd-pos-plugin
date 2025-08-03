import {LanguageCode} from '@vendure/common/lib/generated-types';
import {DeepPartial} from '@vendure/common/lib/shared-types';
import {HasCustomFields, Translation, VendureEntity} from '@vendure/core';
import {Column, Entity, Index, ManyToOne} from 'typeorm';

import {TransactionEntry} from './transaction-entry.entity';

export class TransactionEntryCustomFieldsTranslation {}

@Entity()
export class TransactionEntryTranslation
    extends VendureEntity
    implements Translation<TransactionEntry>, HasCustomFields
{
    constructor(input?: DeepPartial<Translation<TransactionEntryTranslation>>) {
        super(input);
    }

    @Column('varchar') languageCode: LanguageCode;

    @Column() localizedName: string;

    @Index()
    @ManyToOne(type => TransactionEntry, base => base.translations, { onDelete: 'CASCADE' })
    base: TransactionEntry;

    @Column(type => TransactionEntryCustomFieldsTranslation)
    customFields: TransactionEntryCustomFieldsTranslation;
}

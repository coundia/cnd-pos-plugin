import {DeepPartial, HasCustomFields, LocaleString, Translatable, Translation, VendureEntity,} from '@vendure/core';
import {Column, Entity, OneToMany} from 'typeorm';

import {TransactionEntryTranslation} from './transaction-entry-translation.entity';

export enum TransactionEntryType {
	CREDIT = 'CREDIT',
	DEBIT = 'DEBIT',
}

export class TransactionEntryCustomFields {
}

@Entity()
export class TransactionEntry extends VendureEntity implements Translatable, HasCustomFields {
	constructor(input?: DeepPartial<TransactionEntry>) {
		super(input);
	}

	@Column({nullable: true, default: 0})
	amount: number;

	@Column({nullable: true, type: 'text' })
	description: string;

	@Column({nullable: true})
	code: string;

	@Column({
		type: 'datetime',
		nullable: true
	})
	dateTransaction: Date;

	@Column({nullable: true, default:TransactionEntryType.DEBIT})
	typeEntry: string;

	@Column(type => TransactionEntryCustomFields)
	customFields: TransactionEntryCustomFields;


	localizedName: LocaleString;

	@OneToMany(type => TransactionEntryTranslation, translation => translation.base, {eager: true})
	translations: Array<Translation<TransactionEntry>>;
}

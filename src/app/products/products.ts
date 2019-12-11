import { IdEntity, StringColumn, EntityClass, ColumnOptions } from '@remult/core';

@EntityClass
export class Products extends IdEntity {
    name = new StringColumn();
    phone = new PhoneColumn();
    constructor() {
        super({
            name: "Products",
            allowApiCRUD: true,
            allowApiRead: true
        });
    }
}
export class PhoneColumn extends StringColumn {
    constructor(settingsOrCaption?: ColumnOptions<string>) {
        super(settingsOrCaption,{
            dataControlSettings: () => ({
                click: () => window.open('tel:' + this.displayValue),
                allowClick: () => !!this.displayValue,
                clickIcon: 'phone',
                inputType: 'phone'
            })
        });
    }
    get displayValue() {
        return PhoneColumn.formatPhone(this.value);
    }

    static formatPhone(s: string) {
        if (!s)
            return s;
        let x = s.replace(/\D/g, '');
        if (x.length < 9 || x.length > 10)
            return s;
        x = x.substring(0, x.length - 4) + '-' + x.substring(x.length - 4, x.length);

        x = x.substring(0, x.length - 8) + '-' + x.substring(x.length - 8, x.length);
        return x;
    }
}
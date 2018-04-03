import { __EntityValueProvider, NumberColumn, StringColumn, Entity, CompoundIdColumn, FilterConsumnerBridgeToUrlBuilder, UrlBuilder, DateTimeDateStorage, DataList } from './utils';
import { createData } from './RowProvider.spec';
import { DataApi, DataApiError, DataApiResponse } from './server/DataApi';
import { InMemoryDataProvider, ActualInMemoryDataProvider } from './inMemoryDatabase';
import { itAsync, Done } from './testHelper.spec';

import { Categories } from './../app/models';
import { TestBed, async } from '@angular/core/testing';


import { environment } from './../environments/environment';

describe("Sync Data Provider", () => {
    it("my first test", () => {
        let c = createData(x => x(1, 'a'));
    });
});
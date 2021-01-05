import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist-server/projects');
import * as express from 'express';
import * as cors from 'cors';
import { initExpress, JWTCookieAuthorizationHelper } from '@remult/server';
import * as fs from 'fs';

import '../app.module';
import { serverInit } from './server-init';
import { ServerContext } from '@remult/core';
import { ServerSignIn } from '../../../projects/angular/schematics/hello/files/src/app/users/server-sign-in';





serverInit().then(async (dataSource) => {

    let app = express();
    app.use(cors());
    let s = initExpress(app, dataSource, process.env.DISABLE_HTTPS == "true");
    ServerSignIn.helper = new JWTCookieAuthorizationHelper(s, 'signKey');


    app.use(express.static('dist/my-project'));
    app.get('/api/noam', async (req, res) => {
        let c = await s.getValidContext(req);
        res.send('hello ' + JSON.stringify(c.user));
    });

    app.use('/*', async (req, res) => {

        const index = 'dist/my-project/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + index);

        }
    });

    let port = process.env.PORT || 3001;
    app.listen(port);
    var c = new ServerContext(dataSource);

});  
//import { CustomModuleLoader } from '../../../../radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/radweb');
import * as express from 'express';
import { ExpressBridge } from 'radweb-server';
import * as fs from 'fs';
import { serverInit } from './server-init';
import '../app.module';


import { ServerSignIn } from "../users/server-sign-in";
import { JWTCookieAuthorizationHelper } from 'radweb-server';

serverInit().then(async (dataSource) => {

    let app = express();
    let eb = new ExpressBridge(app, dataSource, process.env.DISABLE_HTTPS == "true");
    ServerSignIn.helper = new JWTCookieAuthorizationHelper(eb, process.env.TOKEN_SIGN_KEY);

    app.use(express.static('dist/<%= project %>'));

    app.use('/*', async (req, res) => {

        const index = 'dist/<%= project %>/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + index);

        }
    });

    let port = process.env.PORT || 3000;
    app.listen(port);
});
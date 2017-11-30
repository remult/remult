import * as express from 'express';
import * as bodyParser from 'body-parser';


let app = express();
let port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.route('/').get((req, res) => {
  res.write('testing');
  res.end();

});
console.log('working 123');

app.listen(port);

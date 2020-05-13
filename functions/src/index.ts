//import libraries
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';

//initialize firebase inorder to access its services
admin.initializeApp(functions.config().firebase);

//initialize express server
const app = express();

//add the path to receive request and set json as bodyParser to process the body 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//initialize the database and the collection 
const db = admin.firestore();
const userCollection = 'users';
const usersEndpoint = `/users`;
const idParam = `/:id`;

const userQuery = (id: string) => db.collection(userCollection).doc(id);

app.get(`${usersEndpoint}`, async (req, res, next) => {
  const usersCollection = await db.collection(userCollection).get();
  res.send(usersCollection.docs);
});

app.get(`${usersEndpoint}${idParam}`, async (req, res, next) => {
  const userGet = await userQuery(req.params.id).get();
  if (userGet.exists) {
    res.send(userGet.data());
  } else {
    res.status(404).send();
  }
});

app.put(`${usersEndpoint}${idParam}`, async (req, res, next) => {
  userQuery(req.params.id).create(req.body).then(() => {
    res.status(201).send();
  }).catch(async () => {
    await userQuery(req.params.id).set(req.body);
    res.status(204).send();
  });
});

app.patch(`${usersEndpoint}${idParam}`, async (req, res, next) => {
  try {
    await userQuery(req.params.id).set(req.body, {merge: true});
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
});

app.delete('/expressions/:id', async (req, res, next) => {
  try {
    await userQuery(req.params.id).delete();
    res.status(204).send();
  } catch {
    res.status(404).send();
  }
});


//define google cloud function name
// this is not secure so let's not do it
// export const webApi = functions.https.onRequest(app);


const expensesCollection = `expenses`;


export const onCreate = functions.auth.user().onCreate(async (user) => {
  await Promise.all([
    db.doc(`${userCollection}/${user.uid}`).set({}),
    db.collection(`${userCollection}/${user.uid}/${expensesCollection}`).add({}),
  ]);
});

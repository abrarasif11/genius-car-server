const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());

// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vhdpi0m.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(401).send({message: 'Forbidden access'}) 
        }
        req.decoded = decoded;
        next();
    })
}
  
async function run(){
    try{
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCollection = client.db('geniusCar').collection('orders');

        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn : '1h'})
            res.send({token})
            console.log(user);
        })
        app.get('/services', async(req, res) =>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: (id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })
        //orders api 
        app.get('/orders', verifyJWT, async(req, res) =>{
        const decoded = req.decoded;
        console.log('inside orders api', decoded);
        if(decoded.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access'})
        }
        let query = {};
        console.log(req.query.email);
        if(req.query.email){
            query = {
                email: req.query.email
            }
        }
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders)
    })



    app.post('/orders', async(req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result)
    })

    app.patch('/orders/:id', async (req, res) => {
        const id = req.params.id;
        const status = req.body.status
        const query = {_id: ObjectId(id) }
        const updateDoc = {
            $set:{
                status: status
            }

        }
        const result = await orderCollection.updateOne(query, updateDoc);
        res.send(result);
    })

    app.delete('/orders/:id', async (req,res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id) };
        const result = await orderCollection.deleteOne(query);
        res.send(result);
    })
    }
    
    finally{

    }
}
run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('Genius Car Server  Is Running')
})

app.listen(port, () => {
    console.log(`Genius Car Server Is Running on ${port}`);
})